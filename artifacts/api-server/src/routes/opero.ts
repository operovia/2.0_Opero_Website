import { and, asc, count, desc, eq, gt, isNull, lt, max, ne } from 'drizzle-orm';
import { Router, type IRouter, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { db, adminUsers, adminInvites, auditLog, contentSections, inquiries, siteSettings, consoleScenes, surveys, surveyQuestions } from '@workspace/db';
import { getPage, getScenes, getPublicSettings } from '@/content/store';
import { audit } from '@/server/audit';
import { dummyPasswordHash, hashPassword, newPasswordSchema, verifyPassword } from '@/server/auth/password';
import { createSession, destroyAllSessions, destroyOtherSessions, destroySession, getSession, requireAdmin } from '@/server/auth/session';
import { clientIp } from '@/server/request';
import { hit } from '@/server/rate-limit';
import { demoRequestSchema, partnerApplicationSchema, createDemoRequest, createPartnerApplication, screen } from '@/server/inquiries';
import { inquiryStatuses, inquiryTypes } from '@workspace/db';
import { listInquiries, getInquiry, isInquiryStatus, isInquiryType } from '@/server/inquiries-admin';
import { pageStatus, allPagesStatus, sectionForEdit, validateSection, publish, saveDraft, discardDraft, versionData } from '@/server/content-admin';
import { changeContent } from '@/server/content-version';
import { listSurveys, createSurvey, getSurvey, getQuestions, saveQuestions, setSurveyStatus, updateSurveySettings, updateEmailTemplates, deleteSurvey, listRecipients, addRecipients, removeRecipient, surveyCounts, allResponses, forStats, listResponses, getResponse, deleteResponse, deleteAllResponses, sendSurveyEmails, responseCount, invitationsSent, slugTaken } from '@/server/surveys';
import { formatAnswer, readAnswers } from '@/surveys/answers';
import { saveResponse, publicView, markOpened } from '@/server/survey-responses';
import { getSurveyBySlug } from '@/server/surveys';
import { parseRecipients as parseSurveyRecipients, MAX_RECIPIENTS_PER_PASTE } from '@/surveys/recipients';
import { summarize } from '@/surveys/stats';
import { toCsv } from '@/surveys/csv';
import { listMedia, removeMedia, storeUpload } from '@/server/media';
import { MAX_UPLOAD_BYTES } from '@/lib/media';
import { issueInviteLink, findUsableInvite, INVITE_TTL_DAYS } from '@/server/invites';
import { randomToken, sha256 } from '@/server/crypto';
import { retryWording } from '@/server/rate-limit';
import { richDocSchema, isRichEmpty } from '@/lib/rich-text';
import { questionListSchema, slugSchema } from '@/surveys/questions';
import { isSameOrigin } from '@/server/origin';

const router: IRouter = Router();
const bodyObject = z.record(z.string(), z.unknown());
const loginBody = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(200) });
const uuidSchema = z.string().uuid();

router.get('/opero/site', async (_req, res): Promise<void> => {
  const [home, site, partners, privacy, scenes, publicSettings] = await Promise.all([
    getPage('home'), getPage('site'), getPage('partners'), getPage('privacy'), getScenes(), getPublicSettings(),
  ]);
  const s = publicSettings.settings;
  res.json({
    home, site, partners, privacy, scenes,
    settings: {
      siteName: s.siteName, contactEmail: s.contactEmail, partnerProgramLabel: s.partnerProgramLabel,
      homeMetaTitle: s.homeMetaTitle, homeMetaDescription: s.homeMetaDescription,
      socialImage: publicSettings.socialImage, version: publicSettings.version,
      maintenanceMode: s.maintenanceMode, analyticsSnippet: s.analyticsSnippet,
    },
  });
});

router.post('/opero/inquiries', async (req, res): Promise<void> => {
  const raw = bodyObject.safeParse(req.body);
  if (!raw.success) { res.status(400).json({ error: raw.error.message }); return; }
  const type = raw.data.type;
  const schema = type === 'demo' ? demoRequestSchema : type === 'partner' ? partnerApplicationSchema : null;
  if (!schema || (type !== 'demo' && type !== 'partner')) { res.status(400).json({ error: 'Inquiry type must be demo or partner.' }); return; }
  const parsed = schema.safeParse(raw.data);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const form = new FormData();
  form.set('website', String(raw.data.website ?? ''));
  form.set('_elapsed', String(raw.data.elapsedMs ?? ''));
  const screened = await screen(form, type, parsed.data.email);
  if (screened.verdict === 'bot') { res.status(202).json({ accepted: true }); return; }
  if (screened.verdict === 'limited') {
    res.setHeader('Retry-After', String(screened.retryAfterSeconds));
    res.status(429).json({ error: 'Too many submissions. Please try again later.', retryAfterSeconds: screened.retryAfterSeconds }); return;
  }
  const id = type === 'demo' ? await createDemoRequest(parsed.data as z.infer<typeof demoRequestSchema>) : await createPartnerApplication(parsed.data as z.infer<typeof partnerApplicationSchema>);
  res.status(201).json({ id, accepted: true });
});

router.get('/opero/surveys/:slug', async (req, res): Promise<void> => {
  const slug = String(req.params.slug);
  const preview = req.query.preview === '1';
  if (preview && !(await getSession())) { res.status(401).json({ error: 'Authentication required for preview.' }); return; }
  const view = await publicView(slug, typeof req.query.token === 'string' ? req.query.token : null, preview);
  if (!view) { res.status(404).json({ error: 'Survey not found' }); return; }
  res.json(view);
});

router.post('/opero/surveys/:slug/open', async (req, res): Promise<void> => {
  const parsed = z.object({ token: z.string().min(1).max(500) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invitation token is required.' }); return; }
  const view = await publicView(String(req.params.slug), parsed.data.token, false);
  if (!view || view.kind !== 'form' || view.token !== parsed.data.token) {
    res.status(404).json({ error: 'Invitation not found.' });
    return;
  }
  await markOpened(parsed.data.token);
  res.status(204).end();
});

router.post('/opero/surveys/:slug/respond', async (req, res): Promise<void> => {
  const slug = String(req.params.slug);
  const survey = await getSurveyBySlug(slug);
  if (!survey || survey.status !== 'open') { res.status(404).json({ error: 'Survey is not accepting responses.' }); return; }
  const limited = await hit(`survey:${survey.id}:${await clientIp()}`, 10, 60 * 60);
  if (!limited.ok) { res.status(429).json({ error: 'Too many attempts.' }); return; }
  const questions = await getQuestions(survey.id);
  const submitted = bodyObject.safeParse(req.body);
  if (!submitted.success) { res.status(400).json({ error: submitted.error.message }); return; }
  const rawAnswers = submitted.data.answers;
  if (!rawAnswers || typeof rawAnswers !== 'object' || Array.isArray(rawAnswers)) { res.status(400).json({ error: 'answers must be an object.' }); return; }
  const answers = readAnswers(questions, (field) => {
    const id = field.slice(2);
    const answer = (rawAnswers as Record<string, unknown>)[id];
    if (Array.isArray(answer)) return answer.filter((v): v is string => typeof v === 'string');
    return answer == null ? [] : [String(answer)];
  });
  if (Object.keys(answers.errors).length) { res.status(400).json({ error: 'Please correct the answers.', fields: answers.errors }); return; }
  const token = typeof submitted.data.token === 'string' ? submitted.data.token : null;
  const outcome = await saveResponse(survey.id, token, answers.answers);
  if (outcome !== 'saved') {
    const status = outcome === 'closed' ? 410 : outcome === 'duplicate' ? 409 : 400;
    res.status(status).json({ error: outcome }); return;
  }
  res.status(201).json({ submitted: true });
});

router.post('/opero/admin/login', async (req, res): Promise<void> => {
  const parsed = loginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const ip = await clientIp();
  const limit = await hit(`admin-login:${ip}`, 10, 15 * 60);
  if (!limit.ok) { res.setHeader('Retry-After', String(limit.retryAfterSeconds)); res.status(429).json({ error: 'Too many sign-in attempts.' }); return; }
  const email = parsed.data.email.toLowerCase();
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  const valid = user && !user.disabledAt
    ? await verifyPassword(user.passwordHash, parsed.data.password)
    : (await verifyPassword(await dummyPasswordHash(), parsed.data.password), false);
  if (!user || !valid || user.disabledAt) {
    await audit(null, 'login.failed', { target: email, ip });
    res.status(401).json({ error: 'Email or password is incorrect.' }); return;
  }
  await createSession(user.id);
  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
  await audit({ id: user.id, email: user.email }, 'login', { ip });
  res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

router.get('/opero/admin/session', async (_req, res): Promise<void> => {
  const session = await getSession();
  if (!session) { res.status(401).json({ error: 'Authentication required' }); return; }
  res.json({ user: session.user });
});
router.post('/opero/admin/logout', async (req, res): Promise<void> => {
  const session = await getSession();
  if (session) await audit({ id: session.user.id, email: session.user.email }, 'logout', { ip: await clientIp() });
  await destroySession();
  res.json({ loggedOut: true });
});

router.use('/opero/admin', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (req.path === '/login' || req.path === '/logout' || req.path === '/session') { next(); return; }
  try {
    (req as Request & { admin?: Awaited<ReturnType<typeof requireAdmin>> }).admin = await requireAdmin();
    const origin = req.get('origin');
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      if (!origin) { res.status(403).json({ error: 'Origin header required.' }); return; }
      let host = '';
      try { host = new URL(origin).host; } catch { host = ''; }
      const expected = req.get('x-forwarded-host')?.split(',')[0]?.trim() || req.get('host');
      const allowed = (process.env.ALLOWED_ORIGINS ?? process.env.REPLIT_DOMAINS ?? '').split(',').map((x) => x.trim().replace(/^https?:\/\//, ''));
      if (host !== expected && !allowed.includes(host)) { res.status(403).json({ error: 'Cross-origin request rejected.' }); return; }
    }
    next();
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    res.status(status).json({ error: status === 401 ? 'Authentication required' : 'Unable to authorize request.' });
  }
});

const actor = (req: Request) => (req as Request & { admin: { user: { id: string; email: string } } }).admin.user;

router.get('/opero/admin', async (req, res): Promise<void> => {
  res.json({ user: actor(req), pages: await allPagesStatus(), inquiries: await db.select().from(inquiries).orderBy(desc(inquiries.createdAt)).limit(10), surveys: await listSurveys() });
});
router.get('/opero/admin/inquiries', async (req, res): Promise<void> => {
  const type = typeof req.query.type === 'string' && isInquiryType(req.query.type) ? req.query.type : undefined;
  const status = typeof req.query.status === 'string' && isInquiryStatus(req.query.status) ? req.query.status : undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  res.json(await listInquiries({ type, status, page }));
});
router.get('/opero/admin/inquiries/:id', async (req, res): Promise<void> => {
  const inquiry = await getInquiry(String(req.params.id));
  if (!inquiry) { res.status(404).json({ error: 'Inquiry not found' }); return; }
  res.json(inquiry);
});
router.patch('/opero/admin/inquiries/:id', async (req, res): Promise<void> => {
  const parsed = z.object({ status: z.enum(inquiryStatuses).optional(), notes: z.string().max(10000).optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updates = { ...parsed.data, ...(parsed.data.status ? { statusChangedAt: new Date() } : {}) };
  const [row] = await db.update(inquiries).set(updates).where(eq(inquiries.id, String(req.params.id))).returning();
  if (!row) { res.status(404).json({ error: 'Inquiry not found' }); return; }
  const admin = actor(req);
  await audit(admin, 'inquiry.update' as never, { target: row.id, details: parsed.data, ip: await clientIp() });
  res.json(row);
});

router.get('/opero/admin/content', async (_req, res): Promise<void> => { res.json(await allPagesStatus()); });
router.get('/opero/admin/content/:page', async (req, res): Promise<void> => {
  const result = await pageStatus(String(req.params.page));
  if (!result) { res.status(404).json({ error: 'Content page not found' }); return; }
  res.json(result);
});
router.get('/opero/admin/content/:page/:section', async (req, res): Promise<void> => {
  const result = await sectionForEdit(String(req.params.page), String(req.params.section));
  if (!result) { res.status(404).json({ error: 'Content section not found' }); return; }
  res.json(result);
});
router.put('/opero/admin/content/:page/:section', async (req, res): Promise<void> => {
  const data = bodyObject.safeParse(req.body);
  if (!data.success) { res.status(400).json({ error: data.error.message }); return; }
  const page = String(req.params.page), section = String(req.params.section), admin = actor(req);
  const content = await sectionForEdit(page, section);
  if (!content) { res.status(404).json({ error: 'Content section not found.' }); return; }
  const validated = validateSection(content.def, data.data);
  if (!validated.ok) { res.status(400).json({ error: 'Please correct the highlighted fields.', fields: validated.errors }); return; }
  const publishNow = req.query.publish === 'true' || req.body?.publish === true;
  if (publishNow) {
    const version = await publish(page, section, validated.data, admin.id);
    await audit(admin, 'content.publish', { target: `${page}.${section}`, details: { version }, ip: await clientIp() });
    res.json({ published: true, version }); return;
  }
  await saveDraft(page, section, validated.data, admin.id);
  res.json({ saved: true });
});
router.post('/opero/admin/content/:page/:section/publish', async (req, res): Promise<void> => {
  const parsed = z.object({ data: bodyObject, note: z.string().max(500).optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const admin = actor(req), page = String(req.params.page), section = String(req.params.section);
  const content = await sectionForEdit(page, section);
  if (!content) { res.status(404).json({ error: 'Content section not found.' }); return; }
  const validated = validateSection(content.def, parsed.data.data);
  if (!validated.ok) { res.status(400).json({ error: 'Please correct the highlighted fields.', fields: validated.errors }); return; }
  const version = await publish(page, section, validated.data, admin.id, parsed.data.note);
  await audit(admin, 'content.publish', { target: `${page}.${section}`, details: { version }, ip: await clientIp() });
  res.json({ published: true, version });
});
router.delete('/opero/admin/content/:page/:section/draft', async (req, res): Promise<void> => {
  const draft = await discardDraft(String(req.params.page), String(req.params.section));
  res.json({ discarded: true, draft });
});
router.get('/opero/admin/content/:page/:section/versions/:versionId', async (req, res): Promise<void> => {
  const version = await versionData(String(req.params.page), String(req.params.section), String(req.params.versionId));
  if (!version) { res.status(404).json({ error: 'Version not found' }); return; }
  res.json(version);
});

router.get('/opero/admin/surveys', async (_req, res): Promise<void> => { res.json(await listSurveys()); });
router.post('/opero/admin/surveys', async (req, res): Promise<void> => {
  const parsed = z.object({ title: z.string().trim().min(1).max(120), slug: slugSchema }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  if (await slugTaken(parsed.data.slug)) { res.status(409).json({ error: 'Another survey already uses this address.' }); return; }
  const id = await createSurvey(parsed.data, actor(req).id);
  await audit(actor(req), 'survey.create', { target: id, ip: await clientIp() });
  res.status(201).json(await getSurvey(id));
});
router.get('/opero/admin/surveys/:id', async (req, res): Promise<void> => {
  const id = String(req.params.id), survey = await getSurvey(id);
  if (!survey) { res.status(404).json({ error: 'Survey not found' }); return; }
  res.json({ ...survey, questions: await getQuestions(id), counts: await surveyCounts(id), recipients: await listRecipients(id) });
});
router.put('/opero/admin/surveys/:id/questions', async (req, res): Promise<void> => {
  const parsed = questionListSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const survey = await getSurvey(String(req.params.id));
  if (!survey) { res.status(404).json({ error: 'Survey not found.' }); return; }
  const result = await saveQuestions(survey.id, parsed.data);
  if (!result.ok) { res.status(409).json({ error: result.error }); return; }
  res.json(result);
});
router.patch('/opero/admin/surveys/:id', async (req, res): Promise<void> => {
  const parsed = z.object({
    status: z.enum(['draft', 'open', 'closed']).optional(),
    settings: z.object({
      title: z.string().trim().min(1).max(120).optional(), slug: slugSchema.optional(),
      intro: richDocSchema.optional(), thankYou: richDocSchema.refine((doc) => !isRichEmpty(doc), 'Write a thank-you message.').optional(),
      anonymous: z.boolean().optional(), openLinkEnabled: z.boolean().optional(),
    }).optional(),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const id = String(req.params.id);
  const survey = await getSurvey(id);
  if (!survey) { res.status(404).json({ error: 'Survey not found' }); return; }
  if (parsed.data.status) {
    if (!['open', 'closed'].includes(parsed.data.status) || parsed.data.status === survey.status) { res.status(400).json({ error: 'That status change is not available.' }); return; }
    if (parsed.data.status === 'open' && !(await getQuestions(id)).length) { res.status(400).json({ error: 'Add at least one question before opening the survey.' }); return; }
    await setSurveyStatus(id, parsed.data.status);
    await audit(actor(req), 'survey.status' as never, { target: survey.title, details: { from: survey.status, to: parsed.data.status }, ip: await clientIp() });
  }
  if (parsed.data.settings) {
    const next = { ...survey, ...parsed.data.settings };
    const [responses, sent] = await Promise.all([responseCount(id), invitationsSent(id)]);
    if (next.slug !== survey.slug) {
      if (sent || responses) { res.status(400).json({ error: 'The address cannot change once invitations have gone out or responses have arrived.', fields: { slug: 'Survey links are already in use.' } }); return; }
      if (await slugTaken(next.slug, id)) { res.status(409).json({ error: 'Another survey already uses this address.' }); return; }
    }
    if (next.anonymous !== survey.anonymous && responses) { res.status(400).json({ error: 'Anonymity cannot change once responses have arrived.' }); return; }
    await updateSurveySettings(id, {
      title: next.title, slug: next.slug, intro: next.intro, thankYou: next.thankYou,
      anonymous: next.anonymous, openLinkEnabled: next.openLinkEnabled,
    });
  }
  const updated = await getSurvey(id);
  res.json(updated);
});
router.delete('/opero/admin/surveys/:id', async (req, res): Promise<void> => {
  const id = String(req.params.id);
  await deleteSurvey(id);
  await audit(actor(req), 'survey.delete', { target: id, ip: await clientIp() });
  res.status(204).end();
});
router.get('/opero/admin/surveys/:id/recipients', async (req, res): Promise<void> => { res.json(await listRecipients(String(req.params.id))); });
router.post('/opero/admin/surveys/:id/recipients', async (req, res): Promise<void> => {
  const parsed = z.object({ text: z.string().min(1).max(500_000) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  if (!(await getSurvey(String(req.params.id)))) { res.status(404).json({ error: 'Survey not found.' }); return; }
  const parsedPeople = parseSurveyRecipients(parsed.data.text);
  if (parsedPeople.recipients.length > MAX_RECIPIENTS_PER_PASTE) { res.status(400).json({ error: `Add up to ${MAX_RECIPIENTS_PER_PASTE.toLocaleString('en-US')} people at a time.` }); return; }
  if (!parsedPeople.recipients.length) { res.status(400).json({ error: 'None of those lines has an email address we can use.', invalid: parsedPeople.invalid }); return; }
  const result = await addRecipients(String(req.params.id), parsedPeople.recipients);
  res.status(201).json({ ...result, parsed: parsedPeople.recipients.length, duplicates: parsedPeople.duplicates, invalid: parsedPeople.invalid });
});
router.delete('/opero/admin/surveys/:id/recipients/:recipientId', async (req, res): Promise<void> => {
  const result = await removeRecipient(String(req.params.id), String(req.params.recipientId));
  if (!result) { res.status(404).json({ error: 'Recipient not found' }); return; }
  res.status(204).end();
});

router.get('/opero/admin/settings', async (_req, res): Promise<void> => {
  const [settings] = await db.select().from(siteSettings).limit(1);
  res.json(settings ?? {});
});
router.patch('/opero/admin/settings', async (req, res): Promise<void> => {
  const allowed = z.object({
    siteName: z.string().min(1).max(160).optional(), contactEmail: z.string().email().optional(),
    notificationRecipients: z.array(z.string().email()).max(50).optional(), partnerProgramLabel: z.string().min(1).max(80).optional(),
    homeMetaTitle: z.string().max(200).optional(), homeMetaDescription: z.string().max(500).optional(),
    analyticsSnippet: z.string().max(20000).optional(), maintenanceMode: z.boolean().optional(),
  }).safeParse(req.body);
  if (!allowed.success) { res.status(400).json({ error: allowed.error.message }); return; }
  const admin = actor(req);
  const [row] = await changeContent(async (tx) => tx.update(siteSettings)
    .set({ ...allowed.data, updatedBy: admin.id, updatedAt: new Date() })
    .where(eq(siteSettings.id, 1)).returning());
  if (!row) { res.status(503).json({ error: 'Site settings have not been initialized.' }); return; }
  await audit(admin, 'settings.update', { details: { fields: Object.keys(allowed.data) }, ip: await clientIp() });
  res.json(row);
});
router.get('/opero/admin/activity', async (_req, res): Promise<void> => {
  res.json(await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(100));
});
router.get('/opero/admin/team', async (_req, res): Promise<void> => {
  const users = await db.select({ id: adminUsers.id, email: adminUsers.email, name: adminUsers.name, lastLoginAt: adminUsers.lastLoginAt, disabledAt: adminUsers.disabledAt }).from(adminUsers).orderBy(adminUsers.email);
  const invites = await db.select({ id: adminInvites.id, email: adminInvites.email, name: adminInvites.name, expiresAt: adminInvites.expiresAt, acceptedAt: adminInvites.acceptedAt, revokedAt: adminInvites.revokedAt }).from(adminInvites).orderBy(desc(adminInvites.createdAt));
  res.json({ users, invites });
});

/* Media library */
router.get('/opero/admin/media', async (_req, res): Promise<void> => { res.json(await listMedia()); });

router.post('/opero/admin/media', async (req, res): Promise<void> => {
  const bodyLimit = MAX_UPLOAD_BYTES + 64 * 1024;
  if (!req.is('multipart/form-data')) { res.status(400).json({ error: 'Send the image as multipart form data in the file field.' }); return; }
  if (Number(req.get('content-length') ?? 0) > bodyLimit) { res.status(413).json({ error: 'Images can be up to 8 MB.' }); return; }
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += value.length;
    if (total > bodyLimit) { res.status(413).json({ error: 'Images can be up to 8 MB.' }); return; }
    chunks.push(value);
  }
  let file: unknown;
  try {
    const form = await new Response(Buffer.concat(chunks), { headers: { 'content-type': req.get('content-type') ?? '' } }).formData();
    file = form.get('file');
  } catch {
    res.status(400).json({ error: 'The upload could not be read. Try again.' }); return;
  }
  if (!(file instanceof File)) { res.status(400).json({ error: 'Choose an image to upload.' }); return; }
  const result = await storeUpload(file, actor(req).id);
  if (!result.ok) { res.status(422).json({ error: result.error }); return; }
  await audit(actor(req), 'media.upload', { target: result.filename, details: { url: result.url }, ip: await clientIp() });
  res.status(201).json(result);
});

router.delete('/opero/admin/media/:id', async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!uuidSchema.safeParse(id).success) { res.status(400).json({ error: 'Invalid media id.' }); return; }
  const removed = await removeMedia(id);
  if (!removed) { res.status(404).json({ error: 'Image not found.' }); return; }
  await audit(actor(req), 'media.delete', { target: removed.filename, ip: await clientIp() });
  res.json({ deleted: true, filename: removed.filename });
});

/* Oppie console scenes */
const sceneInput = z.object({
  question: z.string().trim().min(1).max(200),
  thinkingMs: z.coerce.number().int().min(200).max(6000),
  answerTag: z.string().trim().max(80).default(''),
  answerMain: z.string().trim().min(1).max(120),
  answerSupport: z.string().trim().max(240).default(''),
  chips: z.array(z.string().trim().max(60)).max(4).optional(),
  chip1: z.string().trim().max(60).optional(),
  chip2: z.string().trim().max(60).optional(),
  chip3: z.string().trim().max(60).optional(),
  chip4: z.string().trim().max(60).optional(),
  enabled: z.boolean().optional(),
});
function sceneValues(value: z.infer<typeof sceneInput>) {
  const { chip1, chip2, chip3, chip4, ...rest } = value;
  return { ...rest, chips: value.chips ?? [chip1, chip2, chip3, chip4].filter((chip): chip is string => Boolean(chip)) };
}
router.get('/opero/admin/scenes', async (_req, res): Promise<void> => {
  res.json(await db.select().from(consoleScenes).orderBy(asc(consoleScenes.position)));
});
router.post('/opero/admin/scenes', async (req, res): Promise<void> => {
  const parsed = sceneInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const values = sceneValues(parsed.data);
  const [row] = await changeContent(async (tx) => {
    const [last] = await tx.select({ position: max(consoleScenes.position) }).from(consoleScenes);
    return tx.insert(consoleScenes).values({ ...values, position: (last?.position ?? -1) + 1 }).returning();
  });
  await audit(actor(req), 'scenes.update', { target: row!.question, details: { note: `Added "${row!.question}"` }, ip: await clientIp() });
  res.status(201).json(row);
});
router.put('/opero/admin/scenes/:id', async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!uuidSchema.safeParse(id).success) { res.status(400).json({ error: 'Invalid scene id.' }); return; }
  const parsed = sceneInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const current = await db.select().from(consoleScenes).where(eq(consoleScenes.id, id)).limit(1);
  if (!current[0]) { res.status(404).json({ error: 'Scene not found.' }); return; }
  const [row] = await changeContent((tx) => tx.update(consoleScenes).set(sceneValues(parsed.data)).where(eq(consoleScenes.id, id)).returning());
  await audit(actor(req), 'scenes.update', { target: row!.question, details: { note: `Edited "${row!.question}"` }, ip: await clientIp() });
  res.json(row);
});
router.patch('/opero/admin/scenes/:id/enabled', async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const parsed = z.object({ enabled: z.boolean() }).safeParse(req.body);
  if (!uuidSchema.safeParse(id).success || !parsed.success) { res.status(400).json({ error: parsed.success ? 'Invalid scene id.' : parsed.error.flatten() }); return; }
  const [before] = await db.select().from(consoleScenes).where(eq(consoleScenes.id, id)).limit(1);
  if (!before) { res.status(404).json({ error: 'Scene not found.' }); return; }
  const [row] = await changeContent((tx) => tx.update(consoleScenes).set({ enabled: parsed.data.enabled }).where(eq(consoleScenes.id, id)).returning());
  await audit(actor(req), 'scenes.update', { target: before.question, details: { note: `${parsed.data.enabled ? 'Turned on' : 'Turned off'} "${before.question}"` }, ip: await clientIp() });
  res.json(row);
});
router.post('/opero/admin/scenes/:id/move', async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const parsed = z.object({ direction: z.enum(['up', 'down']) }).safeParse(req.body);
  if (!uuidSchema.safeParse(id).success || !parsed.success) { res.status(400).json({ error: parsed.success ? 'Invalid scene id.' : parsed.error.flatten() }); return; }
  const [scene] = await db.select().from(consoleScenes).where(eq(consoleScenes.id, id)).limit(1);
  if (!scene) { res.status(404).json({ error: 'Scene not found.' }); return; }
  const [neighbor] = await db.select().from(consoleScenes)
    .where(parsed.data.direction === 'up' ? lt(consoleScenes.position, scene.position) : gt(consoleScenes.position, scene.position))
    .orderBy(parsed.data.direction === 'up' ? desc(consoleScenes.position) : asc(consoleScenes.position)).limit(1);
  if (!neighbor) { res.json({ moved: false }); return; }
  await changeContent(async (tx) => {
    await tx.update(consoleScenes).set({ position: neighbor.position }).where(eq(consoleScenes.id, scene.id));
    await tx.update(consoleScenes).set({ position: scene.position }).where(eq(consoleScenes.id, neighbor.id));
  });
  await audit(actor(req), 'scenes.update', { target: scene.question, details: { note: `Moved "${scene.question}" ${parsed.data.direction}` }, ip: await clientIp() });
  res.json({ moved: true });
});
router.delete('/opero/admin/scenes/:id', async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!uuidSchema.safeParse(id).success) { res.status(400).json({ error: 'Invalid scene id.' }); return; }
  const [scene] = await db.select().from(consoleScenes).where(eq(consoleScenes.id, id)).limit(1);
  if (!scene) { res.status(404).json({ error: 'Scene not found.' }); return; }
  await changeContent((tx) => tx.delete(consoleScenes).where(eq(consoleScenes.id, id)));
  await audit(actor(req), 'scenes.update', { target: scene.question, details: { note: `Deleted "${scene.question}"` }, ip: await clientIp() });
  res.status(204).end();
});

/* Survey responses, reporting and mail */
router.get('/opero/admin/surveys/:id/responses', async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const survey = await getSurvey(id);
  if (!survey) { res.status(404).json({ error: 'Survey not found.' }); return; }
  const page = Math.max(1, Math.floor(Number(req.query.page) || 1));
  const result = await listResponses(id, page);
  res.json({ ...result, page, pageSize: 50, pages: Math.max(1, Math.ceil(result.total / 50)) });
});
router.get('/opero/admin/surveys/:id/responses/:responseId', async (req, res): Promise<void> => {
  const id = String(req.params.id), responseId = String(req.params.responseId);
  if (!(await getSurvey(id))) { res.status(404).json({ error: 'Survey not found.' }); return; }
  const [response, questions] = await Promise.all([getResponse(id, responseId), getQuestions(id)]);
  if (!response) { res.status(404).json({ error: 'Response not found.' }); return; }
  res.json({ ...response, questions });
});
router.delete('/opero/admin/surveys/:id/responses/:responseId', async (req, res): Promise<void> => {
  const id = String(req.params.id), responseId = String(req.params.responseId), survey = await getSurvey(String(req.params.id));
  if (!survey) { res.status(404).json({ error: 'Survey not found.' }); return; }
  const deleted = await deleteResponse(id, responseId);
  if (!deleted) { res.status(404).json({ error: 'Response not found.' }); return; }
  await audit(actor(req), 'survey.responses.delete', { target: survey.title, details: { note: '1 response' }, ip: await clientIp() });
  res.status(204).end();
});
router.delete('/opero/admin/surveys/:id/responses', async (req, res): Promise<void> => {
  const id = String(req.params.id), survey = await getSurvey(String(req.params.id));
  if (!survey) { res.status(404).json({ error: 'Survey not found.' }); return; }
  const removed = await deleteAllResponses(id);
  if (removed) await audit(actor(req), 'survey.responses.delete', { target: survey.title, details: { note: `${removed} response${removed === 1 ? '' : 's'}` }, ip: await clientIp() });
  res.json({ deleted: removed });
});
router.get('/opero/admin/surveys/:id/results', async (req, res): Promise<void> => {
  const id = String(req.params.id), survey = await getSurvey(String(req.params.id));
  if (!survey) { res.status(404).json({ error: 'Survey not found.' }); return; }
  const [questions, rows, counts] = await Promise.all([getQuestions(id), allResponses(id), surveyCounts(id)]);
  const responses = forStats(rows);
  res.json({
    survey: { id: survey.id, title: survey.title, slug: survey.slug, anonymous: survey.anonymous },
    counts: { responses: rows.length, fromInvites: rows.filter((r) => r.source === 'invite').length, fromOpenLink: rows.filter((r) => r.source === 'open').length, invited: counts.invited, completed: counts.completed },
    questions: questions.map((question) => ({ question, summary: summarize(question, responses) })),
    lastResponseAt: rows[0]?.submittedAt ?? null,
  });
});
router.get('/opero/admin/surveys/:id/export', async (req, res): Promise<void> => {
  const id = String(req.params.id), survey = await getSurvey(String(req.params.id));
  if (!survey) { res.status(404).json({ error: 'Survey not found.' }); return; }
  const [questions, rows] = await Promise.all([getQuestions(id), allResponses(id)]);
  const header = ['Response ID', survey.anonymous ? 'Submitted (date)' : 'Submitted (UTC)', 'Source', ...(survey.anonymous ? [] : ['Name', 'Email']), ...questions.map((q, i) => `${i + 1}. ${q.prompt}`)];
  const body = rows.map((row) => [
    row.id,
    survey.anonymous ? row.submittedAt.toISOString().slice(0, 10) : row.submittedAt.toISOString().replace('T', ' ').slice(0, 19),
    row.source === 'invite' ? 'Invitation' : 'Open link',
    ...(survey.anonymous ? [] : [row.recipientName ?? '', row.recipientEmail ?? '']),
    ...questions.map((q) => formatAnswer(q, row.answers[q.id])),
  ]);
  await audit(actor(req), 'survey.export', { target: survey.title, details: { note: `${rows.length} response${rows.length === 1 ? '' : 's'}` }, ip: await clientIp() });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${survey.slug}-responses-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.setHeader('Cache-Control', 'no-store');
  res.send(toCsv([header, ...body]));
});
router.post('/opero/admin/surveys/:id/send', async (req, res): Promise<void> => {
  const id = String(req.params.id);
  const parsed = z.object({ kind: z.enum(['invite', 'remind']), recipientIds: z.array(z.string().uuid()).max(5000).optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const survey = await getSurvey(id);
  if (!survey) { res.status(404).json({ error: 'Survey not found.' }); return; }
  if (survey.status !== 'open') { res.status(409).json({ error: 'Open the survey before sending emails so links work.' }); return; }
  const outcome = await sendSurveyEmails(survey, parsed.data.kind, parsed.data.recipientIds);
  if (outcome.sent || outcome.failed) {
    await audit(actor(req), 'survey.send', { target: survey.title, details: { kind: parsed.data.kind, ...outcome }, ip: await clientIp() });
  }
  res.json(outcome);
});
router.put('/opero/admin/surveys/:id/email-templates', async (req, res): Promise<void> => {
  const parsed = z.object({
    inviteSubject: z.string().trim().min(1).max(200), inviteMessage: z.string().trim().min(1).max(5000),
    reminderSubject: z.string().trim().min(1).max(200), reminderMessage: z.string().trim().min(1).max(5000),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const id = String(req.params.id), survey = await getSurvey(String(req.params.id));
  if (!survey) { res.status(404).json({ error: 'Survey not found.' }); return; }
  await updateEmailTemplates(id, parsed.data);
  res.json({ saved: true });
});

/* Account password */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: newPasswordSchema,
  confirmPassword: z.string(),
}).refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'The passwords do not match.' })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ['newPassword'], message: 'Choose a password you are not using now.' });
router.post('/opero/admin/account/password', async (req, res): Promise<void> => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const session = await requireAdmin();
  const limit = await hit(`password:${session.user.id}`, 8, 15 * 60);
  if (!limit.ok) { res.setHeader('Retry-After', String(limit.retryAfterSeconds)); res.status(429).json({ error: `Too many attempts. Try again in ${retryWording(limit.retryAfterSeconds)}.` }); return; }
  const [row] = await db.select({ passwordHash: adminUsers.passwordHash }).from(adminUsers).where(eq(adminUsers.id, session.user.id)).limit(1);
  if (!row || !(await verifyPassword(row.passwordHash, parsed.data.currentPassword))) { res.status(400).json({ error: 'Current password is incorrect.', fields: { currentPassword: 'That is not your current password.' } }); return; }
  await db.update(adminUsers).set({ passwordHash: await hashPassword(parsed.data.newPassword), passwordChangedAt: new Date() }).where(eq(adminUsers.id, session.user.id));
  await destroyOtherSessions(session.user.id, session.sessionId);
  await audit(actor(req), 'password.change', { ip: await clientIp() });
  res.json({ changed: true, message: 'Password changed. Other signed-in sessions have been signed out.' });
});

/* Team administration */
const teamInviteSchema = z.object({ name: z.string().trim().max(80).default(''), email: z.string().trim().toLowerCase().email().max(254) });
router.post('/opero/admin/team/invites', async (req, res): Promise<void> => {
  const parsed = teamInviteSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const session = await requireAdmin(), { name, email } = parsed.data;
  const limit = await hit(`invite:${session.user.id}`, 20, 60 * 60);
  if (!limit.ok) { res.setHeader('Retry-After', String(limit.retryAfterSeconds)); res.status(429).json({ error: 'You have sent a lot of invitations recently. Try again in an hour.' }); return; }
  const [existing] = await db.select({ id: adminUsers.id }).from(adminUsers).where(and(eq(adminUsers.email, email), isNull(adminUsers.disabledAt))).limit(1);
  if (existing) { res.status(409).json({ error: 'That person is already an admin.' }); return; }
  await db.update(adminInvites).set({ revokedAt: new Date() }).where(and(eq(adminInvites.email, email), isNull(adminInvites.acceptedAt), isNull(adminInvites.revokedAt)));
  const [invite] = await db.insert(adminInvites).values({
    email, name, invitedBy: session.user.id, tokenHash: sha256(randomToken()), expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000),
  }).returning({ id: adminInvites.id });
  const sent = await issueInviteLink(invite!.id, email, session.user.name || session.user.email);
  await audit(actor(req), 'admin.invite', { target: email, ip: await clientIp() });
  res.status(sent.ok ? 201 : 502).json({ id: invite!.id, email, name, expiresInDays: INVITE_TTL_DAYS, sent: sent.ok, ...(sent.ok ? {} : { error: sent.error }) });
});
router.post('/opero/admin/team/invites/:id/resend', async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!uuidSchema.safeParse(id).success) { res.status(400).json({ error: 'Invalid invite id.' }); return; }
  const session = await requireAdmin();
  const [invite] = await db.select().from(adminInvites).where(and(eq(adminInvites.id, id), isNull(adminInvites.acceptedAt), isNull(adminInvites.revokedAt))).limit(1);
  if (!invite) { res.status(404).json({ error: 'Pending invitation not found.' }); return; }
  const limit = await hit(`invite:${session.user.id}`, 20, 60 * 60);
  if (!limit.ok) { res.status(429).json({ error: 'You have sent a lot of invitations recently. Try again in an hour.' }); return; }
  const sent = await issueInviteLink(invite.id, invite.email, session.user.name || session.user.email);
  await audit(actor(req), 'admin.invite', { target: invite.email, details: { resent: true }, ip: await clientIp() });
  if (!sent.ok) { res.status(502).json({ error: sent.error }); return; }
  res.json({ resent: true });
});
router.delete('/opero/admin/team/invites/:id', async (req, res): Promise<void> => {
  const id = String(req.params.id);
  if (!uuidSchema.safeParse(id).success) { res.status(400).json({ error: 'Invalid invite id.' }); return; }
  const [invite] = await db.select().from(adminInvites).where(and(eq(adminInvites.id, id), isNull(adminInvites.acceptedAt), isNull(adminInvites.revokedAt))).limit(1);
  if (!invite) { res.status(404).json({ error: 'Pending invitation not found.' }); return; }
  await db.update(adminInvites).set({ revokedAt: new Date() }).where(eq(adminInvites.id, id));
  await audit(actor(req), 'admin.invite.revoke', { target: invite.email, ip: await clientIp() });
  res.status(204).end();
});
router.delete('/opero/admin/team/:userId', async (req, res): Promise<void> => {
  const id = String(req.params.userId), session = await requireAdmin();
  if (!uuidSchema.safeParse(id).success) { res.status(400).json({ error: 'Invalid user id.' }); return; }
  if (id === session.user.id) { res.status(400).json({ error: 'You cannot remove your own account.' }); return; }
  const [others] = await db.select({ n: count() }).from(adminUsers).where(and(isNull(adminUsers.disabledAt), ne(adminUsers.id, id)));
  if (!others || others.n < 1) { res.status(409).json({ error: 'At least one active admin account must remain.' }); return; }
  const [target] = await db.update(adminUsers).set({ disabledAt: new Date() }).where(and(eq(adminUsers.id, id), isNull(adminUsers.disabledAt))).returning({ email: adminUsers.email });
  if (!target) { res.status(404).json({ error: 'Admin user not found.' }); return; }
  await destroyAllSessions(id);
  await audit(actor(req), 'admin.remove', { target: target.email, ip: await clientIp() });
  res.json({ removed: true });
});

/* A new admin accepts a one-time invitation without an existing session. */
router.get('/opero/accept-invite', async (req, res): Promise<void> => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!token) { res.status(400).json({ error: 'Invitation token is required.' }); return; }
  const invite = await findUsableInvite(token);
  if (!invite) { res.status(404).json({ error: 'This invitation link is no longer valid.' }); return; }
  res.json({ email: invite.email, name: invite.name, expiresAt: invite.expiresAt });
});
const acceptInviteSchema = z.object({
  token: z.string().min(1).max(500), name: z.string().trim().min(1).max(80),
  password: newPasswordSchema, confirmPassword: z.string(),
}).refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'The passwords do not match.' });
router.post('/opero/accept-invite', async (req, res): Promise<void> => {
  const requestForOriginCheck = { headers: { get: (name: string) => req.get(name) ?? null } } as unknown as globalThis.Request;
  if (!isSameOrigin(requestForOriginCheck)) { res.status(403).json({ error: 'Cross-origin request rejected.' }); return; }
  const limit = await hit(`accept-invite:${await clientIp()}`, 20, 15 * 60);
  if (!limit.ok) { res.setHeader('Retry-After', String(limit.retryAfterSeconds)); res.status(429).json({ error: `Too many attempts. Try again in ${retryWording(limit.retryAfterSeconds)}.` }); return; }
  const parsed = acceptInviteSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  const passwordHash = await hashPassword(parsed.data.password);
  const result = await db.transaction(async (tx) => {
    const [invite] = await tx.select().from(adminInvites).where(and(
      eq(adminInvites.tokenHash, sha256(parsed.data.token)), isNull(adminInvites.acceptedAt), isNull(adminInvites.revokedAt), gt(adminInvites.expiresAt, new Date()),
    )).for('update').limit(1);
    if (!invite) return { ok: false as const, error: 'This invitation link is no longer valid. Ask an admin to send a new one.' };
    const [existing] = await tx.select().from(adminUsers).where(eq(adminUsers.email, invite.email)).limit(1);
    if (existing && !existing.disabledAt) return { ok: false as const, error: 'You already have an account. Sign in instead.' };
    const [user] = existing
      ? await tx.update(adminUsers).set({ name: parsed.data.name, passwordHash, disabledAt: null, passwordChangedAt: new Date() }).where(eq(adminUsers.id, existing.id)).returning({ id: adminUsers.id, email: adminUsers.email })
      : await tx.insert(adminUsers).values({ email: invite.email, name: parsed.data.name, passwordHash, passwordChangedAt: new Date() }).returning({ id: adminUsers.id, email: adminUsers.email });
    await tx.update(adminInvites).set({ acceptedAt: new Date() }).where(eq(adminInvites.id, invite.id));
    return { ok: true as const, user: user! };
  });
  if (!result.ok) { res.status(400).json({ error: result.error }); return; }
  await createSession(result.user.id);
  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, result.user.id));
  await audit(result.user, 'admin.invite.accept', { ip: await clientIp() });
  res.status(201).json({ accepted: true, user: result.user });
});

export default router;