'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Notice } from '@/components/ui/notice';
import { deleteAllResponsesAction, type ActionResult } from '../../actions';

export function DeleteResponses({ surveyId, responses }: { surveyId: string; responses: number }) {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const label = responses === 1 ? 'the 1 response' : `all ${responses.toLocaleString('en-US')} responses`;

  return (
    <div className="space-y-3 border-b border-line pb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-prose">
          <p className="font-medium text-fg">Delete responses</p>
          <p className="text-sm text-fg-muted">
            Useful after testing. Everyone invited can respond again, and the questions can be restructured once there are no responses.
          </p>
        </div>
        <Button
          variant="danger"
          disabled={pending || responses === 0}
          onClick={() => {
            if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
            startTransition(async () => setResult(await deleteAllResponsesAction(surveyId)));
          }}
        >
          {responses ? `Delete ${label}` : 'No responses yet'}
        </Button>
      </div>
      {result ? <Notice tone={result.ok ? 'success' : 'danger'}>{result.message}</Notice> : null}
    </div>
  );
}
