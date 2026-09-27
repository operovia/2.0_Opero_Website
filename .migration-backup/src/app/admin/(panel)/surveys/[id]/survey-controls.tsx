'use client';

import { Check, Copy, ExternalLink } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { Button, buttonClasses } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import type { SurveyStatus } from '@/surveys/types';
import { setStatusAction, type ActionResult } from '../actions';

type Props = { surveyId: string; status: SurveyStatus; previewHref: string; openLink: string | null; hasQuestions: boolean };

/** Preview, the open link, and opening or closing the survey. */
export function SurveyControls({ surveyId, status, previewHref, openLink, hasQuestions }: Props) {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const change = (next: SurveyStatus, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    startTransition(async () => setResult(await setStatusAction(surveyId, next)));
  };

  const copyOpenLink = async () => {
    if (!openLink) return;
    try {
      await navigator.clipboard.writeText(openLink);
      setCopied(true);
    } catch {
      window.prompt('Copy this link:', openLink);
    }
  };

  return (
    <div className="flex flex-col items-start gap-3 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <a href={previewHref} target="_blank" rel="noreferrer" className={buttonClasses({ variant: 'secondary' })}>
          <ExternalLink className="size-4" aria-hidden />
          Preview<span className="sr-only"> (opens in a new tab)</span>
        </a>
        {openLink && status === 'open' ? (
          <Button variant="secondary" onClick={copyOpenLink}>
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? 'Copied' : 'Copy open link'}
          </Button>
        ) : null}
        {status === 'open' ? (
          <Button variant="secondary" onClick={() => change('closed', 'Close this survey? People will no longer be able to respond, including anyone who has not finished yet.')} disabled={pending}>
            Close survey
          </Button>
        ) : (
          <Button onClick={() => change('open')} disabled={pending || !hasQuestions} title={hasQuestions ? undefined : 'Add a question first'}>
            {status === 'closed' ? 'Reopen survey' : 'Open survey'}
          </Button>
        )}
      </div>
      <span role="status" className="sr-only">
        {copied ? 'Link copied' : ''}
      </span>
      {result ? (
        <Notice tone={result.ok ? 'success' : 'danger'} className="max-w-sm">
          {result.message}
        </Notice>
      ) : null}
    </div>
  );
}
