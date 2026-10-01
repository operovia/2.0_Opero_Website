import { sql } from 'drizzle-orm';
import { bigint, boolean, check, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import type { SceneTable } from '../content/scene-table';
import type { RichDoc } from '../lib/rich-text/types';
import { questionTypes, surveyStatuses, type SurveyAnswers, type SurveyOption } from '../surveys/types';
import { GUEST_ROLES } from '@/content/constants';

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/* ------------------------------------------------------------------------ */
/* Admin accounts and access                                                */
/* ------------------------------------------------------------------------ */

export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Always stored lowercase. */
    email: text('email').notNull(),
    name: text('name').notNull().default(''),
    passwordHash: text('password_hash').notNull(),
    /** Set when an admin is removed; removed admins cannot sign in. */
    disabledAt: timestamp('disabled_at', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    passwordChangedAt: timestamp('password_changed_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('admin_users_email_key').on(t.email)],
);

export const adminSessions = pgTable(
  'admin_sessions',
  {
    /** SHA-256 of the session token; the token itself only lives in the cookie. */
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    ip: text('ip').notNull().default(''),
    userAgent: text('user_agent').notNull().default(''),
    createdAt: createdAt(),
  },
  (t) => [index('admin_sessions_user_idx').on(t.userId)],
);

export const adminInvites = pgTable(
  'admin_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    name: text('name').notNull().default(''),
    /** SHA-256 of the one-time token sent by email. */
    tokenHash: text('token_hash').notNull(),
    invitedBy: uuid('invited_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('admin_invites_token_key').on(t.tokenHash), index('admin_invites_email_idx').on(t.email)],
);

export const auditLog = pgTable(
  'audit_log',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    actorId: uuid('actor_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    /** Kept alongside the id so history survives an admin's removal. */
    actorEmail: text('actor_email').notNull().default(''),
    action: text('action').notNull(),
    target: text('target').notNull().default(''),
    details: jsonb('details').$type<Record<string, unknown>>().notNull().default({}),
    ip: text('ip').notNull().default(''),
    createdAt: createdAt(),
  },
  (t) => [index('audit_log_created_idx').on(t.createdAt.desc()), index('audit_log_action_idx').on(t.action)],
);

/** Fixed-window counters for login and public form rate limits. */
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
});

/* ------------------------------------------------------------------------ */
/* Guests: the addresses the front door lets in, and their sessions        */
/* ------------------------------------------------------------------------ */

export const guestInvites = pgTable(
  'guest_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Always stored lowercase. */
    email: text('email').notNull(),
    /** The owner's note to himself about who this is. */
    note: text('note').notNull().default(''),
    /** What the guest may see: a visitor the site, an investor the site and the Investor Hub. */
    role: text('role', { enum: GUEST_ROLES }).notNull().default('visitor'),
    invitedBy: uuid('invited_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    /** The first and the latest time this address came through the door. */
    firstEnteredAt: timestamp('first_entered_at', { withTimezone: true }),
    lastEnteredAt: timestamp('last_entered_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('guest_invites_email_key').on(t.email)],
);

export const guestSessions = pgTable(
  'guest_sessions',
  {
    /** SHA-256 of the guest token; the token itself only lives in the cookie. */
    id: text('id').primaryKey(),
    /** Removing the invite removes its sessions, so access ends everywhere at once. */
    inviteId: uuid('invite_id')
      .notNull()
      .references(() => guestInvites.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    ip: text('ip').notNull().default(''),
    userAgent: text('user_agent').notNull().default(''),
    createdAt: createdAt(),
  },
  (t) => [index('guest_sessions_invite_idx').on(t.inviteId)],
);

/* ------------------------------------------------------------------------ */
/* Site settings                                                            */
/* ------------------------------------------------------------------------ */

export const siteSettings = pgTable(
  'site_settings',
  {
    id: integer('id').primaryKey().default(1),
    siteName: text('site_name').notNull(),
    contactEmail: text('contact_email').notNull(),
    /** Who receives demo requests and partner applications. */
    notificationRecipients: text('notification_recipients')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** "design partner" by default; flows into copy through the {partner} tokens. */
    partnerProgramLabel: text('partner_program_label').notNull(),
    socialImageId: uuid('social_image_id').references(() => media.id, { onDelete: 'set null' }),
    homeMetaTitle: text('home_meta_title').notNull(),
    homeMetaDescription: text('home_meta_description').notNull(),
    analyticsSnippet: text('analytics_snippet').notNull().default(''),
    maintenanceMode: boolean('maintenance_mode').notNull().default(false),
    /** Everyone enters through the front door with an address on the guest list; off, the site is public. */
    privateSite: boolean('private_site').notNull().default(true),
    updatedBy: uuid('updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    updatedAt: updatedAt(),
  },
  (t) => [check('site_settings_single_row', sql`${t.id} = 1`)],
);

/**
 * One row holding the public content version. Every publish, scene change,
 * or settings change bumps it, which tells each server instance to refresh
 * its cached copy of the public content.
 */
export const siteState = pgTable(
  'site_state',
  {
    id: integer('id').primaryKey().default(1),
    contentVersion: integer('content_version').notNull().default(1),
    updatedAt: updatedAt(),
  },
  (t) => [check('site_state_single_row', sql`${t.id} = 1`)],
);

/* ------------------------------------------------------------------------ */
/* Content                                                                  */
/* ------------------------------------------------------------------------ */

export const contentSections = pgTable(
  'content_sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    page: text('page').notNull(),
    section: text('section').notNull(),
    draft: jsonb('draft').$type<Record<string, unknown>>().notNull(),
    published: jsonb('published').$type<Record<string, unknown>>().notNull(),
    /** Number of the currently published version. */
    version: integer('version').notNull().default(1),
    /** Seeded copy that was drafted rather than approved; cleared on publish. */
    needsReview: boolean('needs_review').notNull().default(false),
    draftUpdatedAt: timestamp('draft_updated_at', { withTimezone: true }),
    draftUpdatedBy: uuid('draft_updated_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
    publishedBy: uuid('published_by').references(() => adminUsers.id, { onDelete: 'set null' }),
  },
  (t) => [uniqueIndex('content_sections_page_section_key').on(t.page, t.section)],
);

/** The last published versions of each section (kept to twenty), for rollback. */
export const contentVersions = pgTable(
  'content_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sectionId: uuid('section_id')
      .notNull()
      .references(() => contentSections.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    data: jsonb('data').$type<Record<string, unknown>>().notNull(),
    note: text('note').notNull().default(''),
    publishedBy: uuid('published_by').references(() => adminUsers.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('content_versions_section_version_key').on(t.sectionId, t.version)],
);

/** Scripted scenes for the Oppie console in the hero. */
export const consoleScenes = pgTable(
  'console_scenes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    position: integer('position').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    question: text('question').notNull(),
    thinkingMs: integer('thinking_ms').notNull().default(1200),
    answerTag: text('answer_tag').notNull().default(''),
    answerMain: text('answer_main').notNull(),
    answerSupport: text('answer_support').notNull().default(''),
    chips: text('chips')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** An optional small grid in the answer, such as a rent roll (src/content/scene-table.ts). */
    answerTable: jsonb('answer_table').$type<SceneTable>(),
    /** Oppie's optional question after the answer, such as offering an export. */
    followUp: text('follow_up').notNull().default(''),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('console_scenes_position_idx').on(t.position)],
);

export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  storageKey: text('storage_key').notNull().unique(),
  filename: text('filename').notNull(),
  contentType: text('content_type').notNull(),
  size: integer('size').notNull(),
  width: integer('width'),
  height: integer('height'),
  alt: text('alt').notNull().default(''),
  uploadedBy: uuid('uploaded_by').references(() => adminUsers.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
});

/* ------------------------------------------------------------------------ */
/* Inquiries: demo requests, partner applications, investor inquiries       */
/* ------------------------------------------------------------------------ */

export const inquiryTypes = ['demo', 'partner', 'investor'] as const;
export const inquiryStatuses = ['new', 'contacted', 'closed'] as const;

export const inquiries = pgTable(
  'inquiries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: text('type', { enum: inquiryTypes }).notNull(),
    status: text('status', { enum: inquiryStatuses }).notNull().default('new'),
    name: text('name').notNull(),
    firm: text('firm').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull().default(''),
    role: text('role').notNull().default(''),
    message: text('message').notNull().default(''),
    commercialSqft: integer('commercial_sqft'),
    residentialUnits: integer('residential_units'),
    systems: text('systems').notNull().default(''),
    interest: text('interest').notNull().default(''),
    notes: text('notes').notNull().default(''),
    statusChangedAt: timestamp('status_changed_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('inquiries_created_idx').on(t.createdAt.desc()), index('inquiries_type_status_idx').on(t.type, t.status)],
);

/* ------------------------------------------------------------------------ */
/* Surveys                                                                  */
/* ------------------------------------------------------------------------ */

export const surveys = pgTable('surveys', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  intro: jsonb('intro').$type<RichDoc>().notNull(),
  thankYou: jsonb('thank_you').$type<RichDoc>().notNull(),
  status: text('status', { enum: surveyStatuses }).notNull().default('draft'),
  /** Answers are stored without a link to the recipient. Locked once responses exist. */
  anonymous: boolean('anonymous').notNull().default(false),
  /** Whether /s/[slug] accepts responses without a personal link. */
  openLinkEnabled: boolean('open_link_enabled').notNull().default(false),
  inviteSubject: text('invite_subject').notNull().default(''),
  inviteMessage: text('invite_message').notNull().default(''),
  reminderSubject: text('reminder_subject').notNull().default(''),
  reminderMessage: text('reminder_message').notNull().default(''),
  createdBy: uuid('created_by').references(() => adminUsers.id, { onDelete: 'set null' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const surveyQuestions = pgTable(
  'survey_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    surveyId: uuid('survey_id')
      .notNull()
      .references(() => surveys.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    type: text('type', { enum: questionTypes }).notNull(),
    prompt: text('prompt').notNull(),
    helpText: text('help_text').notNull().default(''),
    required: boolean('required').notNull().default(false),
    options: jsonb('options').$type<SurveyOption[]>().notNull().default([]),
    createdAt: createdAt(),
  },
  (t) => [index('survey_questions_survey_idx').on(t.surveyId, t.position)],
);

export const surveyRecipients = pgTable(
  'survey_recipients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    surveyId: uuid('survey_id')
      .notNull()
      .references(() => surveys.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default(''),
    email: text('email').notNull(),
    /** Personal link token, at least 32 random bytes. Kept so links can be resent. */
    token: text('token').notNull().unique(),
    invitedAt: timestamp('invited_at', { withTimezone: true }),
    lastSentAt: timestamp('last_sent_at', { withTimezone: true }),
    sendCount: integer('send_count').notNull().default(0),
    remindedAt: timestamp('reminded_at', { withTimezone: true }),
    /** First time the personal link was opened. */
    openedAt: timestamp('opened_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('survey_recipients_survey_email_key').on(t.surveyId, t.email)],
);

export const responseSources = ['invite', 'open'] as const;

export const surveyResponses = pgTable(
  'survey_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    surveyId: uuid('survey_id')
      .notNull()
      .references(() => surveys.id, { onDelete: 'cascade' }),
    /** Null for open-link responses and for every response to an anonymous survey. */
    recipientId: uuid('recipient_id').references(() => surveyRecipients.id, { onDelete: 'set null' }),
    source: text('source', { enum: responseSources }).notNull(),
    answers: jsonb('answers').$type<SurveyAnswers>().notNull(),
    /** Hashed browser fingerprint for best-effort duplicate checks on open links. */
    clientKey: text('client_key').notNull().default(''),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('survey_responses_survey_idx').on(t.surveyId, t.submittedAt)],
);
