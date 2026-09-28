'use server';

import { failure, fieldErrors, formValues, success, type FormState } from '@/lib/forms';
import {
  createDemoRequest,
  createInvestorInquiry,
  createPartnerApplication,
  demoRequestSchema,
  investorInquirySchema,
  partnerApplicationSchema,
  screen,
} from '@/server/inquiries';
import { retryWording } from '@/server/rate-limit';

const CHECK_FIELDS = 'Please check the highlighted fields.';
const SERVER_TROUBLE = 'Something went wrong on our side and your details were not sent. Please try again in a moment.';

export async function requestDemo(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ['name', 'firm', 'email', 'phone', 'message']);
  const parsed = demoRequestSchema.safeParse(values);
  if (!parsed.success) return failure(CHECK_FIELDS, { fieldErrors: fieldErrors(parsed.error), values });

  const screening = await screen(formData, 'demo', parsed.data.email);
  // Automated submissions get the same thank-you, so they learn nothing.
  if (screening.verdict === 'bot') return success();
  if (screening.verdict === 'limited') {
    return failure(`We have already received several requests from you. Please try again in ${retryWording(screening.retryAfterSeconds)}.`, { values });
  }

  try {
    await createDemoRequest(parsed.data);
  } catch (error) {
    console.error('[opero] Could not save a demo request', error);
    return failure(SERVER_TROUBLE, { values });
  }
  return success();
}

export async function applyForSeat(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ['name', 'firm', 'role', 'email', 'phone', 'commercialSqft', 'residentialUnits', 'systems', 'interest']);
  const parsed = partnerApplicationSchema.safeParse(values);
  if (!parsed.success) return failure(CHECK_FIELDS, { fieldErrors: fieldErrors(parsed.error), values });

  const screening = await screen(formData, 'partner', parsed.data.email);
  if (screening.verdict === 'bot') return success();
  if (screening.verdict === 'limited') {
    return failure(`We have already received an application from you. Please try again in ${retryWording(screening.retryAfterSeconds)}.`, { values });
  }

  try {
    await createPartnerApplication(parsed.data);
  } catch (error) {
    console.error('[opero] Could not save a partner application', error);
    return failure(SERVER_TROUBLE, { values });
  }
  return success();
}

export async function sendInvestorInquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ['name', 'firm', 'email', 'phone', 'message']);
  const parsed = investorInquirySchema.safeParse(values);
  if (!parsed.success) return failure(CHECK_FIELDS, { fieldErrors: fieldErrors(parsed.error), values });

  const screening = await screen(formData, 'investor', parsed.data.email);
  if (screening.verdict === 'bot') return success();
  if (screening.verdict === 'limited') {
    return failure(`We have already received several messages from you. Please try again in ${retryWording(screening.retryAfterSeconds)}.`, { values });
  }

  try {
    await createInvestorInquiry(parsed.data);
  } catch (error) {
    console.error('[opero] Could not save an investor inquiry', error);
    return failure(SERVER_TROUBLE, { values });
  }
  return success();
}
