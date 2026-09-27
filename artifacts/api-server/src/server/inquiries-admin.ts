import { and, count, desc, eq, type SQL } from 'drizzle-orm';
import { db } from '@workspace/db';
import { inquiries, inquiryStatuses, inquiryTypes } from '@workspace/db';

export type Inquiry = typeof inquiries.$inferSelect;
export type InquiryType = (typeof inquiryTypes)[number];
export type InquiryStatus = (typeof inquiryStatuses)[number];

export const PAGE_SIZE = 50;

export const isInquiryType = (v: unknown): v is InquiryType => inquiryTypes.includes(v as InquiryType);
export const isInquiryStatus = (v: unknown): v is InquiryStatus => inquiryStatuses.includes(v as InquiryStatus);

export async function newInquiryCount(): Promise<number> {
  const [row] = await db.select({ n: count() }).from(inquiries).where(eq(inquiries.status, 'new'));
  return row?.n ?? 0;
}

export async function listInquiries({ type, status, page }: { type?: InquiryType; status?: InquiryStatus; page: number }) {
  const filters: SQL[] = [];
  if (type) filters.push(eq(inquiries.type, type));
  if (status) filters.push(eq(inquiries.status, status));
  const where = filters.length ? and(...filters) : undefined;
  const [rows, [total]] = await Promise.all([
    db
      .select()
      .from(inquiries)
      .where(where)
      .orderBy(desc(inquiries.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ n: count() }).from(inquiries).where(where),
  ]);
  return { rows, total: total?.n ?? 0 };
}

export async function getInquiry(id: string): Promise<Inquiry | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
  return row ?? null;
}

export async function recentNewInquiries(limit = 5) {
  return db.select().from(inquiries).where(eq(inquiries.status, 'new')).orderBy(desc(inquiries.createdAt)).limit(limit);
}

export const statusLabels: Record<InquiryStatus, string> = { new: 'New', contacted: 'Contacted', closed: 'Closed' };

export function typeLabel(type: InquiryType, partnerLabel: string): string {
  if (type === 'demo') return 'Demo request';
  return `${partnerLabel.charAt(0).toUpperCase()}${partnerLabel.slice(1)} application`;
}
