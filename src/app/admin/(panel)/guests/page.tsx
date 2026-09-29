import type { Metadata } from 'next';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ConfirmSubmit } from '@/components/ui/confirm-submit';
import { EmptyState, PageHeader } from '@/components/ui/page-header';
import { Time } from '@/components/ui/time';
import { DOOR_PATH } from '@/content/constants';
import { requireAdmin } from '@/server/auth/session';
import { siteUrl } from '@/server/env';
import { listGuests } from '@/server/guests';
import { removeGuestAction } from './actions';
import { AddGuestsForm } from './add-guests-form';
import { DoorLink } from './door-link';

export const metadata: Metadata = { title: 'Guests' };

export default async function GuestsPage() {
  await requireAdmin();
  const guests = await listGuests();
  const doorLink = `${siteUrl()}${DOOR_PATH}`;
  const suggestedNote = [
    `Here is the link to the Investor Hub: ${doorLink}`,
    'Please open it in Safari or Chrome rather than inside your mail app, which sometimes opens links in its own browser and forgets them.',
    'Enter this email address when it asks, and the site opens for you. It keeps working on that browser after that.',
  ].join('\n\n');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Guests"
        description="Who can open the Investor Hub. A guest gives their address at the front door once, and the site opens for them on that browser until you remove the address."
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Invite someone" description="Add their address below, then send them the door link from your own email. The site sends nothing." />
          <CardBody className="space-y-5">
            <DoorLink link={doorLink} />
            <div className="space-y-2">
              <p className="text-sm font-medium text-fg">A note to paste into your email</p>
              <p className="rounded-md border border-line bg-surface-raised px-4 py-3 text-sm whitespace-pre-wrap text-fg-muted">{suggestedNote}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Add to the list" description="Type or paste email addresses, one person per line." />
          <CardBody>
            <AddGuestsForm />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="On the list" description={guests.length ? `${guests.length.toLocaleString('en-US')} on the list.` : undefined} />
        {guests.length ? (
          <ul className="divide-y divide-line">
            {guests.map((guest) => (
              <li key={guest.id} className="grid grid-cols-1 gap-3 px-6 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-6">
                <div className="min-w-0">
                  <p className="truncate font-medium text-fg">{guest.email}</p>
                  {guest.note ? <p className="mt-0.5 text-sm text-fg-muted">{guest.note}</p> : null}
                  <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-muted">
                    <span>
                      Added <Time value={guest.createdAt} format="date" />
                    </span>
                    {guest.firstEnteredAt ? (
                      <span>
                        First entered <Time value={guest.firstEnteredAt} format="relative" />
                      </span>
                    ) : (
                      <span>Has not entered yet</span>
                    )}
                    {(guest.lastSeenAt ?? guest.lastEnteredAt) ? (
                      <span>
                        Last visited <Time value={guest.lastSeenAt ?? guest.lastEnteredAt!} format="relative" />
                      </span>
                    ) : null}
                  </p>
                </div>
                <form action={removeGuestAction}>
                  <input type="hidden" name="id" value={guest.id} />
                  <ConfirmSubmit variant="ghost" size="sm" confirm={`Remove ${guest.email} from the list? The Investor Hub closes for them at once.`}>
                    Remove
                  </ConfirmSubmit>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6">
            <EmptyState title="Nobody on the list yet.">Add addresses above, then send each person the door link.</EmptyState>
          </div>
        )}
      </Card>
    </div>
  );
}
