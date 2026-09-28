import { asc } from 'drizzle-orm';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { Metadata } from 'next';
import { MotionRoot } from '@/components/motion/motion-root';
import { OppieConsole } from '@/components/site/oppie-console';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { ConfirmSubmit } from '@/components/ui/confirm-submit';
import { EmptyState, PageHeader } from '@/components/ui/page-header';
import { SubmitButton } from '@/components/ui/submit-button';
import { getPage } from '@/content/store';
import { db } from '@/db/client';
import { consoleScenes } from '@/db/schema';
import { requireAdmin } from '@/server/auth/session';
import { deleteScene, moveScene, toggleScene } from './actions';
import { SceneForm } from './scene-form';

export const metadata: Metadata = { title: 'Oppie console' };

export default async function ConsolePage() {
  await requireAdmin();
  const [scenes, home] = await Promise.all([db.select().from(consoleScenes).orderBy(asc(consoleScenes.position)), getPage('home')]);
  const active = scenes.filter((s) => s.enabled);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Oppie console"
        description="The scripted questions and answers that play in the home page hero. Changes go live as soon as you save. The console's badge and footer lines are edited under Content, Home page, Hero."
      />

      <Card>
        <CardHeader title="Preview" description={`${active.length} of ${scenes.length} scenes are on. This is exactly what visitors see.`} />
        <div data-theme="dark" className="rounded-b-xl px-4 py-8 sm:px-10">
          <div className="mx-auto max-w-lg">
            {active.length ? (
              <MotionRoot>
                <OppieConsole
                  scenes={active}
                  labels={{
                    badge: home.hero.consoleBadge,
                    footerLeft: home.hero.consoleFooterLeft,
                    footerRight: home.hero.consoleFooterRight,
                    note: home.hero.consoleNote,
                  }}
                />
              </MotionRoot>
            ) : (
              <p className="text-center text-sm text-fg-muted">No scenes are on, so the console is hidden on the site.</p>
            )}
          </div>
        </div>
      </Card>

      <section aria-labelledby="scenes-title" className="space-y-4">
        <h2 id="scenes-title" className="text-lg font-semibold text-fg">
          Scenes, in the order they play
        </h2>
        {scenes.length ? (
          <ol className="space-y-4">
            {scenes.map((scene, index) => (
              <li key={scene.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
                    <div className="min-w-0 space-y-1.5">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-fg">
                        <span className="text-fg-subtle">{index + 1}.</span> {scene.question}
                        {scene.enabled ? null : <Badge>Off</Badge>}
                      </p>
                      <p className="text-sm text-fg-muted">
                        {scene.answerMain}
                        {scene.chips.length ? ` · ${scene.chips.join(' · ')}` : ''}
                        {scene.answerTable ? ` · Table of ${scene.answerTable.rows.length} ${scene.answerTable.rows.length === 1 ? 'row' : 'rows'}` : ''}
                      </p>
                      <p className="text-xs text-fg-subtle">Thinks for {scene.thinkingMs} ms</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <form action={toggleScene}>
                        <input type="hidden" name="id" value={scene.id} />
                        <SubmitButton variant="secondary" size="sm">
                          {scene.enabled ? 'Turn off' : 'Turn on'}
                        </SubmitButton>
                      </form>
                      <form action={moveScene}>
                        <input type="hidden" name="id" value={scene.id} />
                        <input type="hidden" name="direction" value="up" />
                        <SubmitButton variant="ghost" size="sm" disabled={index === 0} aria-label={`Move scene ${index + 1} up`}>
                          <ArrowUp className="size-4" aria-hidden />
                        </SubmitButton>
                      </form>
                      <form action={moveScene}>
                        <input type="hidden" name="id" value={scene.id} />
                        <input type="hidden" name="direction" value="down" />
                        <SubmitButton variant="ghost" size="sm" disabled={index === scenes.length - 1} aria-label={`Move scene ${index + 1} down`}>
                          <ArrowDown className="size-4" aria-hidden />
                        </SubmitButton>
                      </form>
                      <form action={deleteScene}>
                        <input type="hidden" name="id" value={scene.id} />
                        <ConfirmSubmit variant="ghost" size="sm" confirm={`Delete the scene "${scene.question}"? This cannot be undone.`}>
                          Delete
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </div>
                  <details className="group border-t border-line">
                    <summary className="cursor-pointer list-none px-6 py-3 text-sm font-medium text-fg-muted hover:text-fg [&::-webkit-details-marker]:hidden">
                      <span className="group-open:hidden">Edit this scene</span>
                      <span className="hidden group-open:inline">Close editor</span>
                    </summary>
                    <div className="px-6 pb-6">
                      <SceneForm
                        scene={{
                          id: scene.id,
                          question: scene.question,
                          thinkingMs: scene.thinkingMs,
                          answerTag: scene.answerTag,
                          answerMain: scene.answerMain,
                          answerSupport: scene.answerSupport,
                          chips: scene.chips,
                          answerTable: scene.answerTable,
                          followUp: scene.followUp,
                        }}
                      />
                    </div>
                  </details>
                </Card>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState title="No scenes yet">Add a scene below to start the console.</EmptyState>
        )}
      </section>

      <Card>
        <CardHeader title="Add a scene" description="It is added at the end of the list and switched on." />
        <CardBody>
          <SceneForm />
        </CardBody>
      </Card>
    </div>
  );
}
