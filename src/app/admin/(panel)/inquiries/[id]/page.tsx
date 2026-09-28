import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ConfirmSubmit } from '@/components/ui/confirm-submit';
import { PageHeader } from '@/components/ui/page-header';
import { Time } from '@/components/ui/time';
import { requireAdmin } from '@/server/auth/session';
import { getInquiry, inquirerName, statusLabels, typeLabel } from '@/server/inquiries-admin';
import { getSettings } from '@/server/settings';
import { deleteInquiry } from '../actions';
import { StatusForm } from './status-form';

export const metadata: Metadata = { title: 'Inquiry' };

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6">
      <dt className="text-sm text-fg-subtle">{label}</dt>
      <dd className="text-base whitespace-pre-line text-fg">{value || <span className="text-fg-subtle">Not provided</span>}</dd>
    </div>
  );
}

export default async function InquiryPage({ params }: PageProps<'/admin/inquiries/[id]'>) {
  await requireAdmin();
  const { id } = await params;
  const [inquiry, settings] = await Promise.all([getInquiry(id), getSettings()]);
  if (!inquiry) notFound();
  const number = (n: number | null) => (n === null ? '' : n.toLocaleString('en-US'));

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
        <Link href="/admin/inquiries" className="hover:text-fg">
          Inquiries
        </Link>
      </nav>
      <PageHeader
        title={inquirerName(inquiry)}
        description={
          <>
            {typeLabel(inquiry.type, settings.partnerProgramLabel)}, received <Time value={inquiry.createdAt} />
          </>
        }
        actions={<Badge tone={inquiry.status === 'new' ? 'accent' : 'neutral'}>{statusLabels[inquiry.status]}</Badge>}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader title="Details" />
          <CardBody>
            <dl className="divide-y divide-line">
              <Detail label="Name" value={inquiry.name} />
              <Detail label={inquiry.type === 'investor' ? 'Firm or fund' : 'Firm'} value={inquiry.firm} />
              {inquiry.type === 'partner' ? <Detail label="Role" value={inquiry.role} /> : null}
              <Detail
                label="Email"
                value={
                  <a href={`mailto:${inquiry.email}`} className="underline underline-offset-4">
                    {inquiry.email}
                  </a>
                }
              />
              <Detail
                label="Phone"
                value={
                  inquiry.phone ? (
                    <a href={`tel:${inquiry.phone.replace(/[^\d+]/g, '')}`} className="underline underline-offset-4">
                      {inquiry.phone}
                    </a>
                  ) : (
                    ''
                  )
                }
              />
              {inquiry.type !== 'partner' ? <Detail label="Message" value={inquiry.message} /> : null}
              {inquiry.type === 'partner' ? (
                <>
                  <Detail label="Commercial square feet" value={number(inquiry.commercialSqft)} />
                  <Detail label="Residential units" value={number(inquiry.residentialUnits)} />
                  <Detail label="Systems today" value={inquiry.systems} />
                  <Detail label="Why interested" value={inquiry.interest} />
                </>
              ) : null}
            </dl>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Follow-up" />
            <CardBody>
              <StatusForm id={inquiry.id} status={inquiry.status} notes={inquiry.notes} />
            </CardBody>
          </Card>
          <form action={deleteInquiry} className="text-right">
            <input type="hidden" name="id" value={inquiry.id} />
            <ConfirmSubmit variant="ghost" size="sm" confirm={`Delete this inquiry from ${inquiry.name}? This cannot be undone.`}>
              Delete inquiry
            </ConfirmSubmit>
          </form>
        </div>
      </div>
    </div>
  );
}
