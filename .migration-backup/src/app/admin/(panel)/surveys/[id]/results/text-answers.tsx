'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Time } from '@/components/ui/time';

type Answer = { responseId: string; text: string; submittedAt: string; respondent: string | null };

const FIRST = 10;

/** Every written answer, newest first, a few at a time. */
export function TextAnswers({ surveyId, answers }: { surveyId: string; answers: Answer[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? answers : answers.slice(0, FIRST);
  return (
    <div className="space-y-4">
      <ul className="divide-y divide-line">
        {shown.map((answer) => (
          <li key={answer.responseId} className="py-3 first:pt-0">
            <p className="whitespace-pre-line text-fg">{answer.text}</p>
            <p className="mt-1 text-xs text-fg-subtle">
              <Link href={`/admin/surveys/${surveyId}/responses/${answer.responseId}`} className="underline underline-offset-4 hover:text-fg">
                {answer.respondent ?? 'View response'}
              </Link>
              {' · '}
              <Time value={answer.submittedAt} format="date" />
            </p>
          </li>
        ))}
      </ul>
      {answers.length > FIRST ? (
        <Button variant="secondary" size="sm" onClick={() => setAll((v) => !v)}>
          {all ? 'Show fewer' : `Show all ${answers.length.toLocaleString('en-US')} answers`}
        </Button>
      ) : null}
    </div>
  );
}
