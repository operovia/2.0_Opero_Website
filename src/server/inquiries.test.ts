import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { demoRequestSchema, investorInquirySchema, partnerApplicationSchema } = await import('./inquiries');
const { investorInquiryNotification } = await import('./email/templates');

const base = { name: 'Jordan Rivera', firm: 'Lakeshore', email: 'Jordan@Example.com ' };

describe('demo request validation', () => {
  it.each(['(734) 555-0100', '+1 734.555.0100', '734-555-0100 ext. 12', '7345550100', ''])('accepts phone %j', (phone) => {
    expect(demoRequestSchema.safeParse({ ...base, phone }).success).toBe(true);
  });

  it.each(['call me', '12', 'abc-defg-hijk'])('rejects phone %j', (phone) => {
    expect(demoRequestSchema.safeParse({ ...base, phone }).success).toBe(false);
  });

  it('normalizes email and requires name and firm', () => {
    const parsed = demoRequestSchema.parse(base);
    expect(parsed.email).toBe('jordan@example.com');
    expect(demoRequestSchema.safeParse({ ...base, name: '  ' }).success).toBe(false);
  });
});

describe('partner application validation', () => {
  const application = { ...base, role: 'COO', interest: 'We run 40 buildings.' };

  it.each([
    ['2,500,000', 2_500_000],
    [' 1 240 ', 1240],
    ['', null],
  ])('parses square feet %j', (input, expected) => {
    expect(partnerApplicationSchema.parse({ ...application, commercialSqft: input }).commercialSqft).toBe(expected);
  });

  it.each(['2.5 million', '-4', '12.5'])('rejects square feet %j', (input) => {
    expect(partnerApplicationSchema.safeParse({ ...application, commercialSqft: input }).success).toBe(false);
  });

  it('requires role and interest', () => {
    expect(partnerApplicationSchema.safeParse({ ...application, role: '' }).success).toBe(false);
    expect(partnerApplicationSchema.safeParse({ ...application, interest: '' }).success).toBe(false);
  });
});

describe('investor inquiry validation', () => {
  it('lets an investor leave the firm and message empty', () => {
    const parsed = investorInquirySchema.parse({ name: 'Avery Chen', firm: '  ', email: 'Avery@Example.com' });
    expect(parsed).toEqual({ name: 'Avery Chen', firm: '', email: 'avery@example.com', phone: '', message: '' });
  });

  it('still requires a name and a valid email', () => {
    expect(investorInquirySchema.safeParse({ name: '', email: 'avery@example.com' }).success).toBe(false);
    expect(investorInquirySchema.safeParse({ name: 'Avery Chen', email: 'avery' }).success).toBe(false);
  });

  it('names the firm in the notification only when there is one', () => {
    const inquiry = { name: 'Avery Chen', firm: '', email: 'avery@example.com', phone: '', message: 'Hello' };
    expect(investorInquiryNotification(inquiry, 'https://example.com/admin').subject).toBe('Investor inquiry from Avery Chen');
    expect(investorInquiryNotification({ ...inquiry, firm: 'Example Capital' }, 'https://example.com/admin').subject).toBe(
      'Investor inquiry from Avery Chen, Example Capital',
    );
  });
});
