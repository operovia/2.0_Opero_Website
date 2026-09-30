import { Notice } from '@/components/ui/notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { Time } from '@/components/ui/time';
import { databaseNeedsAttention, databaseStatus } from '@/server/database-status';
import { updateDatabaseAction } from './database-actions';

/**
 * Shown at the top of every admin page while the database is behind the
 * code, with the reason and a way to try again. Nothing renders otherwise.
 */
export async function DatabaseNotice() {
  const status = await databaseStatus();
  if (!databaseNeedsAttention(status)) return null;
  const { pending, unreachable, report } = status;

  return (
    <Notice tone="danger" title="The database is not up to date" className="mb-8">
      <div className="space-y-3">
        <p>
          {unreachable
            ? `The database did not answer: ${unreachable}`
            : pending.length
              ? `${pending.length === 1 ? 'One update the site needs has' : `${pending.length} updates the site needs have`} not run yet: ${pending.join(', ')}. Pages that depend on ${pending.length === 1 ? 'it' : 'them'}, such as Guests, cannot load until ${pending.length === 1 ? 'it does' : 'they do'}.`
              : 'The last attempt to prepare it did not finish.'}
        </p>
        <p>
          {report ? (
            <>
              The last attempt, <Time value={report.at} format="relative" />, {report.ok ? 'succeeded.' : `failed: ${report.message}`}
            </>
          ) : (
            'This server has not tried to prepare it yet.'
          )}
        </p>
        <form action={updateDatabaseAction}>
          <SubmitButton variant="secondary" size="sm" pendingLabel="Updating">
            Update the database now
          </SubmitButton>
        </form>
      </div>
    </Notice>
  );
}
