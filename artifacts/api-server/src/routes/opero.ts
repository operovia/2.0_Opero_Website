import { desc, eq } from 'drizzle-orm';
import { Router, type IRouter, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { db, adminUsers, auditLog, contentSections, inquiries, siteSettings, consoleScenes, surveys, surveyQuestions } from '@workspace/db';
import { getPage, getScenes, getPublicSettings } from '@/content/store';
import { audit } from '@/server/audit';
import { adminSessions, adminInvites } from '@workspace/db';
import { dummyPasswordHash, verifyPassword } from '@/server/auth/password';
import { SESSION_COOKIE, SESSION_COOKIE_INSECURE } from '@/server/auth/constants';
import { createSession, destroySession, getSession, requireAdmin } from '@/server/auth/session';
import { clientIp } from '@/server/request';
import { hit } from '@/server/rate-limit';
import { demoRequestSchema, partnerApplicationSchema, createDemoRequest, createPartnerApplication, screen } from '@/server/inquiries';
import { inquiryStatuses, inquiryTypes } from '@workspace/db';
import { listInquiries, getInquiry, isInquiryStatus, isInquiryType } from '@/server/inquiries-admin';
import { pageStatus, allPagesStatus, publish, saveDraft, discardDraft, versionData } from '@/server/content-admin';
import { changeContent } from '@/server/content-version';
import { listSurveys, createSurvey, getSurvey, getQuestions, saveQuestions, setSurveyStatus, updateSurveySettings, deleteSurvey, listRecipients, addRecipients, removeRecipient, surveyCounts } from '@/server/surveys';
import { readAnswers } from '@/surveys/answers';
import { saveResponse, publicView } from '@/server/survey-responses';
import { getSurveyBySlug } from '@/server/surveys';
import { parseRecipients as parseSurveyRecipients } from '@/surveys/recipients';

const router: IRouter = Router();
const bodyObject = z.record(z.string(), z.unknown());
const loginBody = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(200) });

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
  if (!schema) { res.status(400).json({ error: 'Inquiry type must be demo or partner.' }); return; }
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
  const view = await publicView(slug, typeof req.query.token === 'string' ? req.query.token : null, false);
  if (!view) { res.status(404).json({ error: 'Survey not found' }); return; }
  res.json(view);
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
router.put('/opero/admin/content/:page/:section', async (req, res): Promise<void> => {
  const data = bodyObject.safeParse(req.body);
  if (!data.success) { res.status(400).json({ error: data.error.message }); return; }
  const page = String(req.params.page), section = String(req.params.section), admin = actor(req);
  const publishNow = req.query.publish === 'true' || req.body?.publish === true;
  if (publishNow) {
    const version = await publish(page, section, data.data, admin.id);
    await audit(admin, 'content.publish', { target: `${page}.${section}`, details: { version }, ip: await clientIp() });
    res.json({ published: true, version }); return;
  }
  await saveDraft(page, section, data.data, admin.id);
  res.json({ saved: true });
});
router.post('/opero/admin/content/:page/:section/publish', async (req, res): Promise<void> => {
  const parsed = z.object({ data: bodyObject, note: z.string().max(500).optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const admin = actor(req), page = String(req.params.page), section = String(req.params.section);
  const version = await publish(page, section, parsed.data.data, admin.id, parsed.data.note);
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
  const parsed = z.object({ title: z.string().trim().min(1).max(160), slug: z.string().trim().min(1).max(80) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
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
  const result = await saveQuestions(String(req.params.id), req.body);
  res.json(result);
});
router.patch('/opero/admin/surveys/:id', async (req, res): Promise<void> => {
  const parsed = z.object({
    status: z.enum(['draft', 'open', 'closed']).optional(),
    settings: z.object({ title: z.string().max(160).optional(), slug: z.string().max(80).optional(), intro: z.unknown().optional(), thankYou: z.unknown().optional(), anonymous: z.boolean().optional(), openLinkEnabled: z.boolean().optional() }).optional(),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const id = String(req.params.id);
  if (parsed.data.status) await setSurveyStatus(id, parsed.data.status);
  if (parsed.data.settings) await updateSurveySettings(id, parsed.data.settings);
  const survey = await getSurvey(id);
  if (!survey) { res.status(404).json({ error: 'Survey not found' }); return; }
  res.json(survey);
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
  const people = parseSurveyRecipients(parsed.data.text);
  const result = await addRecipients(String(req.params.id), people);
  res.status(201).json({ ...result, parsed: people.length });
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
  const [row] = await changeContent(async (tx) => tx.insert(siteSettings).values({ id: 1, ...allowed.data, updatedBy: admin.id })
    .onConflictDoUpdate({ target: siteSettings.id, set: { ...allowed.data, updatedBy: admin.id, updatedAt: new Date() } }).returning());
  await audit(admin, 'settings.update', { details: Object.keys(allowed.data), ip: await clientIp() });
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

export default router;