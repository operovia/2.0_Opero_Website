'use client';

import { Send } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { sendEmailsAction, type ActionResult } from '../../actions';

type Props = { surveyId: string; open: boolean; notInvited: number; waiting: number; emailReady: boolean };

const people = (n: number) => `${n.toLocaleString('en-US')} ${n === 1 ? 'person' : 'people'}`;

export function SendPanel({ surveyId, open, notInvited, waiting, emailReady }: Props) {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const send = (kind: 'invite' | 'remind', count: number) => {
    const what = kind === 'invite' ? `Send the invitation to ${people(count)}?` : `Send a reminder to ${people(count)} who have not finished?`;
    if (!window.confirm(what)) return;
    startTransition(async () => setResult(await sendEmailsAction(surveyId, kind)));
  };

  return (
    <div className="space-y-5">
      {!open ? <Notice tone="warning">Open the survey before sending, so the links work when people click them.</Notice> : null}
      {!emailReady ? (
        <Notice tone="warning" title="Email is not set up yet">
          Until RESEND_API_KEY is added to the server secrets, emails are written to the server log instead of being sent. The README explains how to set it up.
        </Notice>
      ) : null}
      {result ? <Notice tone={result.ok ? 'success' : 'danger'}>{result.message}</Notice> : null}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-fg-muted">
            <span className="font-semibold text-fg">{people(notInvited)}</span> not invited yet
          </p>
          <Button onClick={() => send('invite', notInvited)} disabled={pending || !open || !notInvited}>
            <Send className="size-4" aria-hidden />
            Send invitations
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-sm text-fg-muted">
            <span className="font-semibold text-fg">{people(waiting)}</span> invited, not finished
          </p>
          <Button variant="secondary" onClick={() => send('remind', waiting)} disabled={pending || !open || !waiting}>
            Send reminders
          </Button>
        </div>
      </div>
    </div>
  );
}
