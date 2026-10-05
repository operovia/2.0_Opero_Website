import type { Metadata } from 'next';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ConfirmSubmit } from '@/components/ui/confirm-submit';
import { EmptyState, PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { Time } from '@/components/ui/time';
import { DOOR_PATH, GREETING_MAX, GUEST_ROLE_LABELS } from '@/content/constants';
import { requireAdmin } from '@/server/auth/session';
import { emailConfig, siteUrl } from '@/server/env';
import { guestDocumentCounts } from '@/server/data-room';
import { guestLink, guestLinkPath, listCompanies, listGuests } from '@/server/guests';
import { getSettings } from '@/server/settings';
import {
  makeGuestLinkAction,
  removeCompanyAction,
  removeGuestAction,
  setCompanyGreetingAction,
  setCompanyRoleAction,
  setGuestGreetingAction,
  setGuestRoleAction,
} from './actions';
import { AddCompanyForm } from './add-company-form';
import { AddGuestsForm } from './add-guests-form';
import { DoorLink } from './door-link';

export const metadata: Metadata = { title: 'Guests' };

export default async function GuestsPage() {
  await requireAdmin();
  const [guests, companies, settings, documentCounts] = await Promise.all([listGuests(), listCompanies(), getSettings(), guestDocumentCounts()]);
  const doorLink = `${siteUrl()}${DOOR_PATH}`;
  const suggestedNote = [
    `Here is the link to the Opero site: ${doorLink}`,
    'Please open it in Safari or Chrome rather than inside your mail app, which sometimes opens links in its own browser and forgets them.',
    'Enter this email address when it asks, and the site opens for you. It keeps working on that browser after that.',
  ].join('\n\n');
  const companyNote = [
    `Here is the link to the Opero site: ${doorLink}`,
    'Please open it in Safari or Chrome rather than inside your mail app, which sometimes opens links in its own browser and forgets them.',
    'Enter your work email address when it asks, and we will email you a link to come in. Feel free to forward this to anyone at your company: they can come in the same way with their own address.',
  ].join('\n\n');
  const closes = settings.privateSite ? 'The site' : 'The Data Room';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Guests"
        description={
          settings.privateSite
            ? 'Who can come in. The site is private: a guest gives their address at the front door once, and it opens for them on that browser until you remove the address. Visitors see the site; investors see the Data Room too. People at a company on the list confirm their address by email first.'
            : 'Who can open the Data Room. The site itself is public; a guest invited as an investor gives their address at the front door once, and the Data Room opens for them on that browser until you remove the address. People at a company on the list confirm their address by email first.'
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Invite someone"
            description="Add their address, then send them the door link from your own email: the site does not email the people you add. Each guest also has a personal link, on the list below: it fills in their address, and with a welcome name the door and the home page greet them by it. To let a whole company in, add its domain under Companies."
          />
          <CardBody className="space-y-5">
            <DoorLink link={doorLink} />
            <div className="space-y-2">
              <p className="text-sm font-medium text-fg">A note to paste into your email</p>
              <p className="rounded-md border border-line bg-surface-raised px-4 py-3 text-sm whitespace-pre-wrap text-fg-muted">{suggestedNote}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Add to the list" description="Type or paste email addresses, one person per line, and choose what they may see." />
          <CardBody>
            <AddGuestsForm />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Companies"
          description="Let in everyone with an address at a company, such as everyone at example.com. When someone there enters their work address at the front door, the site emails them a one-time link, and the link lets them in; on another browser later, they get a new one the same way. Each person who comes in joins the list below with the company's access. Email services anyone can sign up for, such as gmail.com, cannot be added."
        />
        <CardBody className="grid grid-cols-1 items-start gap-8 xl:grid-cols-2">
          {emailConfig().apiKey ? null : (
            <Notice tone="warning" title="Email is not set up yet" className="xl:col-span-2">
              Until RESEND_API_KEY is added to the server secrets, the links the door emails are written to the server log instead of being sent, so nobody at a
              company can come in. The README explains how to set it up.
            </Notice>
          )}
          <AddCompanyForm />
          <div className="space-y-2">
            <p className="text-sm font-medium text-fg">A note to paste into your email to someone there</p>
            <p className="rounded-md border border-line bg-surface-raised px-4 py-3 text-sm whitespace-pre-wrap text-fg-muted">{companyNote}</p>
          </div>
        </CardBody>
        {companies.length ? (
          <ul className="divide-y divide-line border-t border-line">
            {companies.map((company) => {
              const other = company.role === 'investor' ? 'visitor' : 'investor';
              return (
                <li key={company.id} className="grid grid-cols-1 gap-3 px-6 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-6">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="truncate font-medium text-fg">@{company.domain}</span>
                      <span className="rounded-full border border-line px-2 py-0.5 text-xs font-medium text-fg-muted">
                        {GUEST_ROLE_LABELS[company.role].label}
                      </span>
                    </p>
                    {company.note ? <p className="mt-0.5 text-sm text-fg-muted">{company.note}</p> : null}
                    <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-muted">
                      <span>Everyone there may see {GUEST_ROLE_LABELS[company.role].sees}</span>
                      <span>
                        Added <Time value={company.createdAt} format="date" />
                      </span>
                      <span>
                        {company.members
                          ? `${company.members.toLocaleString('en-US')} ${company.members === 1 ? 'person has' : 'people have'} come in`
                          : 'Nobody has come in yet'}
                      </span>
                    </p>
                    <form action={setCompanyGreetingAction} className="mt-3 flex max-w-md items-center gap-2">
                      <input type="hidden" name="id" value={company.id} />
                      <label htmlFor={`company-greeting-${company.id}`} className="shrink-0 text-sm text-fg-muted">
                        Welcome name
                      </label>
                      <Input
                        id={`company-greeting-${company.id}`}
                        name="greeting"
                        variant="compact"
                        defaultValue={company.greeting}
                        maxLength={GREETING_MAX}
                        placeholder="The firm's name, for example"
                        autoComplete="off"
                      />
                      <SubmitButton variant="secondary" size="sm" pendingLabel="Saving">
                        Save
                      </SubmitButton>
                    </form>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={setCompanyRoleAction}>
                      <input type="hidden" name="id" value={company.id} />
                      <input type="hidden" name="role" value={other} />
                      <SubmitButton variant="secondary" size="sm" pendingLabel="Changing">
                        {other === 'investor' ? 'Make investors' : 'Make visitors'}
                      </SubmitButton>
                    </form>
                    <form action={removeCompanyAction}>
                      <input type="hidden" name="id" value={company.id} />
                      <ConfirmSubmit
                        variant="ghost"
                        size="sm"
                        confirm={`Remove @${company.domain}? ${closes} closes at once for everyone who came in through it${company.members ? ` (${company.members.toLocaleString('en-US')})` : ''}, and the links already emailed stop working.`}
                      >
                        Remove
                      </ConfirmSubmit>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </Card>

      <Card>
        <CardHeader title="On the list" description={guests.length ? `${guests.length.toLocaleString('en-US')} on the list.` : undefined} />
        {guests.length ? (
          <ul className="divide-y divide-line">
            {guests.map((guest) => {
              const other = guest.role === 'investor' ? 'visitor' : 'investor';
              return (
                <li key={guest.id} className="grid grid-cols-1 gap-3 px-6 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-6">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="truncate font-medium text-fg">{guest.email}</span>
                      <span className="rounded-full border border-line px-2 py-0.5 text-xs font-medium text-fg-muted">
                        {GUEST_ROLE_LABELS[guest.role].label}
                      </span>
                    </p>
                    {guest.company ? (
                      <p className="mt-0.5 text-sm text-fg-muted">Came in through @{guest.company}. What they see and their welcome name follow the company.</p>
                    ) : guest.note ? (
                      <p className="mt-0.5 text-sm text-fg-muted">{guest.note}</p>
                    ) : null}
                    <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-muted">
                      <span>Sees {GUEST_ROLE_LABELS[guest.role].sees}</span>
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
                      {documentCounts.get(guest.id) ? (
                        <span>
                          Opened {documentCounts.get(guest.id)} {documentCounts.get(guest.id) === 1 ? 'document' : 'documents'}
                        </span>
                      ) : null}
                      {(guest.lastSeenAt ?? guest.lastEnteredAt) ? (
                        <span>
                          Last visited <Time value={guest.lastSeenAt ?? guest.lastEnteredAt!} format="relative" />
                        </span>
                      ) : null}
                    </p>
                    {/* The welcome name, and the personal link that greets them by it. Someone who came in through a company has the company's. */}
                    {guest.company ? null : (
                      <div className="mt-3 space-y-2">
                        <form action={setGuestGreetingAction} className="flex max-w-md items-center gap-2">
                          <input type="hidden" name="id" value={guest.id} />
                          <label htmlFor={`greeting-${guest.id}`} className="shrink-0 text-sm text-fg-muted">
                            Welcome name
                          </label>
                          <Input
                            id={`greeting-${guest.id}`}
                            name="greeting"
                            variant="compact"
                            defaultValue={guest.greeting}
                            maxLength={GREETING_MAX}
                            placeholder="Fifth Wall, for example"
                            autoComplete="off"
                          />
                          <SubmitButton variant="secondary" size="sm" pendingLabel="Saving">
                            Save
                          </SubmitButton>
                        </form>
                        {guest.linkToken ? (
                          <DoorLink link={guestLink(guest.linkToken)} preview={guestLinkPath(guest.linkToken)} compact />
                        ) : (
                          <form action={makeGuestLinkAction}>
                            <input type="hidden" name="id" value={guest.id} />
                            <SubmitButton variant="secondary" size="sm" pendingLabel="Making">
                              Make a personal link
                            </SubmitButton>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {guest.company ? null : (
                      <form action={setGuestRoleAction}>
                        <input type="hidden" name="id" value={guest.id} />
                        <input type="hidden" name="role" value={other} />
                        <SubmitButton variant="secondary" size="sm" pendingLabel="Changing">
                          {other === 'investor' ? 'Make an investor' : 'Make a visitor'}
                        </SubmitButton>
                      </form>
                    )}
                    <form action={removeGuestAction}>
                      <input type="hidden" name="id" value={guest.id} />
                      <ConfirmSubmit
                        variant="ghost"
                        size="sm"
                        confirm={
                          guest.company
                            ? `Remove ${guest.email} from the list? ${closes} closes for them at once, but while @${guest.company} is on the list they can come back in with a new emailed link.`
                            : `Remove ${guest.email} from the list? ${closes} closes for them at once.`
                        }
                      >
                        Remove
                      </ConfirmSubmit>
                    </form>
                  </div>
                </li>
              );
            })}
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
