import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { BrandMark } from '@/components/brand/brand-mark';
import { AdminShell } from '@/components/admin/shell';
import type { NavKey } from '@/components/admin/nav';
import { FieldInput } from '@/components/admin/content/field-inputs';
import { RichTextEditor } from '@/components/admin/content/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/field';
import { api } from '@/lib/opero-api';
import { getPageDef, getSectionDef } from '@/content/registry';
import { questionTypes, questionTypeLabels, hasOptions, type SurveyQuestion, type QuestionType } from '@/surveys/types';
import { newId } from '@/surveys/questions';
import { emptyRichDoc } from '@/lib/rich-text';
import { Account, Console, Media, Team, Responses, Results, SurveyMail, DeleteAllResponses } from '@/pages/admin-extras';

const nav: NavKey[] = ['dashboard', 'inquiries', 'content', 'console', 'surveys', 'media', 'settings', 'team', 'activity'];
const input = 'w-full rounded-lg border border-line-input bg-surface px-4 py-3 text-sm text-fg outline-none focus:border-accent';
const date = (value: unknown) => value ? new Date(String(value)).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function Notice({ children, danger = false }: { children: ReactNode; danger?: boolean }) {
  return <div role="status" className={`rounded-lg border px-4 py-3 text-sm ${danger ? 'border-danger/40 bg-danger-soft text-danger' : 'border-success/40 bg-success-soft text-fg'}`}>{children}</div>;
}
function Header({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <header className="flex flex-wrap items-end justify-between gap-5"><div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-fg-subtle">Opero / Admin</p><h1 className="text-display-sm font-medium text-metal">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm text-fg-muted">{description}</p>}</div>{actions}</header>;
}
function Empty({ title, children }: { title: string; children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-line-strong px-6 py-12 text-center"><h2 className="font-semibold text-fg">{title}</h2><p className="mt-2 text-sm text-fg-muted">{children}</p></div>;
}
function useAdminData<T = any>(path: string) {
  const [data, setData] = useState<T | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const reload = () => { setLoading(true); setError(''); api<T>(path).then(setData).catch(e => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(() => { reload(); }, [path]);
  return { data, loading, error, reload };
}
function State({ loading, error, retry, children }: { loading: boolean; error: string; retry: () => void; children: ReactNode }) {
  if (loading) return <div className="animate-pulse space-y-3">{[0, 1, 2].map(n => <div key={n} className="h-20 rounded-xl bg-surface-raised" />)}</div>;
  if (error) return <Notice danger>{error} <button className="ml-3 underline" onClick={retry}>Retry</button></Notice>;
  return <>{children}</>;
}
function useAction(reload?: () => void) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const run = async (path: string, method: string, body?: unknown) => {
    setBusy(true); setError(''); setMessage('');
    try { const result = await api(path, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }); setMessage('Changes saved.'); reload?.(); return result; }
    catch (e) { setError((e as Error).message); return null; }
    finally { setBusy(false); }
  };
  return { busy, message, error, run };
}
function Feedback({ action }: { action: ReturnType<typeof useAction> }) {
  return <>{action.error && <Notice danger>{action.error}</Notice>}{action.message && <Notice>{action.message}</Notice>}</>;
}
function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); setError(''); try { await api('/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }); onDone(); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } }
  return <main className="flex min-h-dvh items-center justify-center px-gutter py-16"><div className="w-full max-w-sm"><BrandMark name="opero-small" on="auto" className="mx-auto h-10" /><div className="mt-10 rounded-2xl border border-line bg-surface p-8 shadow-lg"><h1 className="text-xl font-semibold text-fg">Sign in</h1><p className="mt-1 text-sm text-fg-muted">Admin access for the Opero site.</p><form onSubmit={submit} className="mt-6 space-y-5">{error && <Notice danger>{error}</Notice>}<label className="block space-y-2 text-sm font-medium">Email<Input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required autoFocus /></label><label className="block space-y-2 text-sm font-medium">Password<Input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label><Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button></form></div></div></main>;
}
function Dashboard() {
  const q = useAdminData<any>('/admin');
  return <div className="space-y-8"><Header title="Dashboard" description="A view of what needs your attention." /><State {...q} retry={q.reload}><div className="grid gap-5 md:grid-cols-2">{[['Inquiries', q.data?.inquiries, 'inquiries'], ['Surveys', q.data?.surveys, 'surveys']].map(([title, items, path]) => <Card key={String(path)}><CardHeader title={String(title)} /><ul className="divide-y divide-line">{(items as any[] || []).slice(0, 5).map((item: any) => <li key={item.id}><Link href={`/admin/${path}/${item.id}`} className="block px-6 py-3 text-sm hover:bg-accent-soft">{item.title || item.name || item.email}<span className="ml-2 text-fg-muted">{item.status}</span></Link></li>)}{!items?.length && <li className="px-6 py-5 text-sm text-fg-muted">Nothing new.</li>}</ul></Card>)}</div><Card><CardHeader title="Content" description="Drafts and pages awaiting review." /><ul className="divide-y divide-line">{(q.data?.pages || []).map((page: any) => <li key={page.key}><Link href={`/admin/content/${page.key}`} className="flex justify-between px-6 py-4 hover:bg-accent-soft"><span>{page.label}</span><span className="text-sm text-fg-muted">{page.drafts} drafts · {page.needsReview} to review</span></Link></li>)}</ul></Card></State></div>;
}
function Content({ parts }: { parts: string[] }) {
  const page = parts[0], section = parts[1];
  const q = useAdminData<any>(page ? `/admin/content/${page}${section ? `/${section}` : ''}` : '/admin/content');
  const def = page ? getPageDef(page) : null, sectionDef = page && section ? getSectionDef(page, section) : null;
  if (section && def && sectionDef) return <ContentEditor key={`${page}/${section}`} page={page} section={section} content={q.data} loading={q.loading} error={q.error} reload={q.reload} />;
  return <div className="space-y-8"><Header title={def?.label || 'Content'} description={def?.description || 'Every word on the public site.'} /><State {...q} retry={q.reload}><Card><ul className="divide-y divide-line">{!page ? (q.data || []).map((item: any) => <li key={item.key}><Link href={`/admin/content/${item.key}`} className="flex items-center justify-between px-6 py-5 hover:bg-accent-soft"><span><strong className="block">{item.label}</strong><span className="text-sm text-fg-muted">{item.description}</span></span><span className="text-sm text-fg-muted">{item.drafts} drafts · {item.needsReview} to review</span></Link></li>) : (q.data?.sections || []).map((item: any) => <li key={item.key}><Link href={`/admin/content/${page}/${item.key}`} className="flex items-center justify-between px-6 py-5 hover:bg-accent-soft"><span><strong className="block">{item.label}</strong><span className="text-sm text-fg-muted">{item.description}</span></span><span className="text-sm text-fg-muted">{item.hasDraft ? 'Draft' : item.needsReview ? 'Needs review' : 'Live'} · v{item.version}</span></Link></li>)}</ul></Card></State></div>;
}
type ContentEditData = {
  row: { draft: Record<string, unknown>; published: Record<string, unknown>; version: number; needsReview: boolean; publishedAt: string | null } | null;
  versions: { id: string; version: number; note: string; publishedAt: string; publishedBy: string | null }[];
};
function ContentEditor({ page, section, content, loading, error, reload }: { page: string; section: string; content: ContentEditData | null; loading: boolean; error: string; reload: () => void }) {
  const def = getSectionDef(page, section)!;
  const path = `/admin/content/${page}/${section}`;
  const initialized = useRef(false);
  const [values, setValues] = useState<Record<string, unknown> | null>(null);
  const [lastSaved, setLastSaved] = useState('');
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [problem, setProblem] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [restoreVersion, setRestoreVersion] = useState<number | null>(null);
  const published = { ...def.seed, ...(content?.row?.published || {}) };
  const differsFromLive = values !== null && JSON.stringify(values) !== JSON.stringify(published);
  const unsaved = values !== null && JSON.stringify(values) !== lastSaved;

  // Only initialize once per mounted section. A refetch must not erase unsaved edits.
  useEffect(() => {
    if (!content || initialized.current) return;
    const draft = { ...def.seed, ...(content.row?.draft || {}) };
    initialized.current = true;
    setValues(draft);
    setLastSaved(JSON.stringify(draft));
  }, [content, def]);
  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [unsaved]);

  async function request(target: string, method: string, body?: unknown) {
    setBusy(true); setProblem(''); setMessage(''); setFieldErrors({});
    try {
      const result = await api<any>(target, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      return result;
    } catch (err) {
      const issue = err as Error & { fields?: Record<string, string> };
      setProblem(issue.message);
      setFieldErrors(issue.fields || {});
      return null;
    } finally { setBusy(false); }
  }
  async function save(publishNow: boolean) {
    if (!values) return;
    const snapshot = values;
    const result = await request(publishNow ? `${path}/publish` : path, publishNow ? 'POST' : 'PUT', publishNow ? { data: snapshot } : snapshot);
    if (result === null) return;
    setLastSaved(JSON.stringify(snapshot));
    setRestoreVersion(null);
    setMessage(publishNow ? `Version ${result.version} is now live.` : 'Draft saved.');
    reload();
  }
  async function discard() {
    if (!window.confirm('Discard your draft and go back to the live version? This cannot be undone.')) return;
    const result = await request(`${path}/draft`, 'DELETE');
    if (result === null) return;
    const fresh = { ...def.seed, ...(result.draft || published) };
    setValues(fresh); setLastSaved(JSON.stringify(fresh)); setRevision(n => n + 1);
    setRestoreVersion(null); setMessage('Draft discarded. Live content restored.');
    reload();
  }
  async function restore(id: string, version: number) {
    if (unsaved && !window.confirm('Replace your unsaved edits with this version?')) return;
    const result = await request(`${path}/versions/${id}`, 'GET');
    if (result === null) return;
    if (!result?.data || typeof result.data !== 'object' || Array.isArray(result.data)) {
      setProblem('The selected version could not be loaded.'); return;
    }
    setValues({ ...def.seed, ...result.data }); setRevision(n => n + 1);
    setRestoreVersion(version); setMessage(`Version ${version} loaded into the editor. Review it, then publish to make it live.`);
  }
  return <div className="space-y-8">
    <nav aria-label="Breadcrumb" className="flex gap-2 text-sm text-fg-muted"><Link href="/admin/content" className="hover:text-fg">Content</Link><span>/</span><Link href={`/admin/content/${page}`} className="hover:text-fg">{getPageDef(page)?.label}</Link></nav>
    <Header title={def.label} description={def.description} />
    <State loading={loading && !initialized.current} error={error} retry={reload}>
      {content?.row?.needsReview && <Notice>This section uses drafted copy. Review it before publishing.</Notice>}
      {problem && <Notice danger>{problem}</Notice>}
      {message && <Notice>{message}</Notice>}
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <Card>
          <CardHeader title="Content" actions={<span className={`text-xs font-medium ${unsaved || differsFromLive ? 'text-warning' : 'text-success'}`}>{unsaved ? 'Unsaved changes' : differsFromLive ? 'Draft not yet published' : 'Live version'}</span>} />
          <CardBody><div key={revision} className="space-y-7">{values && Object.entries(def.fields).map(([name, field]) => <FieldInput key={name} name={name} field={field} value={values[name]} onChange={v => setValues(old => ({ ...old!, [name]: v }))} errors={fieldErrors} />)}</div></CardBody>
          <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface/95 px-6 py-4 backdrop-blur">
            <Button variant="secondary" disabled={busy || !values || (!differsFromLive && !unsaved)} onClick={discard}>Discard changes</Button>
            <div className="flex flex-wrap gap-2"><a href={getPageDef(page)?.path || '/'} target="_blank" rel="noreferrer" className="rounded-full border border-line-strong px-4 py-2 text-sm"><ExternalLink className="mr-2 inline size-4" />View live page</a><Button variant="secondary" disabled={busy || !values} onClick={() => void save(false)}>Save draft</Button><Button disabled={busy || !values} onClick={() => void save(true)}>{restoreVersion ? `Publish version ${restoreVersion}` : 'Publish'}</Button></div>
          </div>
        </Card>
        <aside aria-label="Version history"><Card><CardHeader title="History" description={`Version ${content?.row?.version || 0} is live. Up to twenty versions are kept.`} /><ol className="divide-y divide-line">{content?.versions?.length ? content.versions.map((item, index) => <li key={item.id} className="px-6 py-4"><div className="flex justify-between gap-2"><strong className="text-sm">Version {item.version}{index === 0 && <span className="ml-2 font-normal text-success">Live</span>}</strong>{index > 0 && <button type="button" disabled={busy} onClick={() => void restore(item.id, item.version)} className="text-sm underline disabled:opacity-50">Restore</button>}</div><p className="mt-1 text-xs text-fg-muted">{date(item.publishedAt)}{item.publishedBy ? ` · ${item.publishedBy}` : ''}</p>{item.note && <p className="mt-1 text-xs text-fg-muted">{item.note}</p>}</li>) : <li className="px-6 py-4 text-sm text-fg-muted">No published versions yet.</li>}</ol></Card></aside>
      </div>
    </State>
  </div>;
}
function Inquiries({ id }: { id?: string }) {
  const [type, setType] = useState(''), [status, setStatus] = useState(''), [page, setPage] = useState(1);
  const q = useAdminData<any>(id ? `/admin/inquiries/${id}` : `/admin/inquiries?${new URLSearchParams({ ...(type && { type }), ...(status && { status }), page: String(page) })}`);
  const action = useAction(q.reload);
  const [notes, setNotes] = useState('');
  useEffect(() => { if (id && q.data) setNotes(q.data.notes || ''); }, [id, q.data]);
  return <div className="space-y-8"><Header title={id ? 'Inquiry' : 'Inquiries'} description={id ? 'Review the request and keep your follow-up in one place.' : 'Demo requests and partner applications.'} /><Feedback action={action} /><State {...q} retry={q.reload}>{id && q.data ? <><Link href="/admin/inquiries" className="text-sm text-fg-muted underline">← All inquiries</Link><Card><CardHeader title={q.data.name || q.data.email} description={`${q.data.type} · ${date(q.data.createdAt)}`} /><CardBody className="space-y-5"><dl className="grid gap-4 sm:grid-cols-2">{Object.entries(q.data).filter(([k]) => !['id', 'notes', 'status', 'createdAt', 'updatedAt', 'statusChangedAt'].includes(k)).map(([key, val]) => <div key={key}><dt className="text-xs uppercase tracking-wider text-fg-subtle">{key.replace(/([A-Z])/g, ' $1')}</dt><dd className="mt-1 break-words text-sm text-fg">{String(val ?? '—')}</dd></div>)}</dl><label className="block space-y-2 text-sm font-medium">Status<select className={input} value={q.data.status} onChange={e => action.run(`/admin/inquiries/${id}`, 'PATCH', { status: e.target.value })}>{['new', 'contacted', 'closed'].map(s => <option key={s}>{s}</option>)}</select></label><label className="block space-y-2 text-sm font-medium">Private notes<Textarea rows={5} value={notes} onChange={e => setNotes(e.target.value)} /></label><Button disabled={action.busy} onClick={() => action.run(`/admin/inquiries/${id}`, 'PATCH', { notes })}>Save notes</Button></CardBody></Card></> : <><div className="flex flex-wrap gap-3"><select className={input + ' !w-auto'} value={type} onChange={e => { setType(e.target.value); setPage(1); }}><option value="">All types</option><option value="demo">Demo requests</option><option value="partner">Partner applications</option></select><select className={input + ' !w-auto'} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{['new', 'contacted', 'closed'].map(s => <option key={s}>{s}</option>)}</select></div>{q.data?.rows?.length ? <Card><ul className="divide-y divide-line">{q.data.rows.map((row: any) => <li key={row.id}><Link href={`/admin/inquiries/${row.id}`} className="flex flex-wrap justify-between gap-2 px-6 py-4 hover:bg-accent-soft"><span><strong className="block">{row.name || row.email}</strong><span className="text-sm text-fg-muted">{row.email} · {row.type}</span></span><span className="text-sm text-fg-muted">{row.status} · {date(row.createdAt)}</span></Link></li>)}</ul></Card> : <Empty title="No inquiries found">Try a different filter, or check back later.</Empty>}<div className="flex items-center gap-3 text-sm"><Button variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page} · {q.data?.total || 0} total</span><Button variant="secondary" disabled={page * 50 >= (q.data?.total || 0)} onClick={() => setPage(page + 1)}>Next</Button></div></>}</State></div>;
}
function SurveyList() {
  const q = useAdminData<any[]>('/admin/surveys');
  return <div className="space-y-8"><Header title="Surveys" description="Write a survey, invite people, and read the results. Surveys are never linked from the public site." actions={<Link href="/admin/surveys/new" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent"><Plus className="mr-2 inline size-4" />New survey</Link>} /><State {...q} retry={q.reload}>{q.data?.length ? <Card><ul className="divide-y divide-line">{q.data.map(s => <li key={s.id}><Link href={`/admin/surveys/${s.id}`} className="flex flex-wrap justify-between gap-3 px-6 py-4 hover:bg-accent-soft"><span><strong className="block">{s.title} <span className="ml-2 text-xs font-normal uppercase text-fg-muted">{s.status}</span></strong><span className="text-sm text-fg-muted">{s.questions} questions · {s.responses} responses · {s.recipients} recipients{s.anonymous ? ' · Anonymous' : ''}</span></span><span className="text-sm text-fg-subtle">{date(s.createdAt)}</span></Link></li>)}</ul></Card> : <Empty title="No surveys yet">Create a survey, add questions, then invite people or share an open link.</Empty>}</State></div>;
}
function SurveyNew() {
  const [, navigate] = useLocation(), action = useAction();
  const [title, setTitle] = useState(''), [slug, setSlug] = useState(''), [customSlug, setCustomSlug] = useState(false);
  async function submit(e: FormEvent) { e.preventDefault(); const result = await action.run('/admin/surveys', 'POST', { title, slug }); if (result?.id) navigate(`/admin/surveys/${result.id}`); }
  return <div className="space-y-8"><Header title="New survey" description="Start with a title and web address. You can add questions next." /><Feedback action={action} /><Card><CardHeader title="The basics" /><CardBody><form onSubmit={submit} className="max-w-xl space-y-5"><label className="block space-y-2 text-sm font-medium">Title<Input value={title} maxLength={160} required onChange={e => { setTitle(e.target.value); if (!customSlug) setSlug(slugify(e.target.value)); }} /></label><label className="block space-y-2 text-sm font-medium">Web address<Input value={slug} maxLength={80} required pattern="[a-z0-9-]+" onChange={e => { setCustomSlug(true); setSlug(slugify(e.target.value)); }} /></label><p className="text-sm text-fg-muted">/s/{slug || 'your-survey'}</p><Button type="submit" disabled={action.busy}>Create survey</Button></form></CardBody></Card></div>;
}
const freshQuestion = (type: QuestionType): SurveyQuestion => ({ id: `new-${newId()}`, type, prompt: '', helpText: '', required: false, options: hasOptions(type) ? [0, 1].map(() => ({ id: newId(), label: '' })) : [] });
function QuestionBuilder({ survey, reload }: { survey: any; reload: () => void }) {
  const [questions, setQuestions] = useState<SurveyQuestion[]>(survey.questions || []);
  const action = useAction(reload), locked = survey.counts?.responses > 0;
  const change = (i: number, patch: Partial<SurveyQuestion>) => setQuestions(q => q.map((item, n) => n === i ? { ...item, ...patch } : item));
  const move = (i: number, by: number) => setQuestions(q => { const next = [...q]; next.splice(i + by, 0, next.splice(i, 1)[0]); return next; });
  const save = async () => { actionError(''); const result = await action.run(`/admin/surveys/${survey.id}/questions`, 'PUT', questions.map(q => ({ ...q, options: q.options.map(o => ({ ...o, id: o.id.length > 24 ? o.id.replace(/-/g, '').slice(0, 20) : o.id })) }))); if (result?.ok === false) actionError(result.error); else if (result?.questions) setQuestions(result.questions); };
  const [localError, actionError] = useState('');
  return <div className="space-y-6">{locked && <Notice>Responses have arrived. Only wording can change; the question structure is locked.</Notice>}{localError && <Notice danger>{localError}</Notice>}<Feedback action={action} />{questions.length ? <ol className="space-y-5">{questions.map((question, i) => <li key={question.id}><Card><CardHeader title={`${i + 1}. ${question.prompt || 'Untitled question'}`} actions={!locked && <span className="flex gap-2"><button aria-label="Move up" disabled={!i} onClick={() => move(i, -1)}><ArrowUp className="size-4" /></button><button aria-label="Move down" disabled={i === questions.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" /></button><button aria-label="Remove question" onClick={() => { if (window.confirm('Remove this question?')) setQuestions(q => q.filter((_, n) => n !== i)); }}><Trash2 className="size-4" /></button></span>} /><CardBody className="space-y-4"><label className="block space-y-2 text-sm font-medium">Question<Input value={question.prompt} maxLength={500} onChange={e => change(i, { prompt: e.target.value })} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-2 text-sm font-medium">Type<select className={input} disabled={locked} value={question.type} onChange={e => { const type = e.target.value as QuestionType; change(i, { type, options: hasOptions(type) ? [0, 1].map(() => ({ id: crypto.randomUUID(), label: '' })) : [] }); }}>{questionTypes.map(t => <option key={t} value={t}>{questionTypeLabels[t]}</option>)}</select></label><label className="flex items-center gap-3 pt-7 text-sm font-medium"><input type="checkbox" checked={question.required} disabled={locked} onChange={e => change(i, { required: e.target.checked })} />Required</label></div><label className="block space-y-2 text-sm font-medium">Help text<Input value={question.helpText || ''} onChange={e => change(i, { helpText: e.target.value })} /></label>{hasOptions(question.type) && <div className="space-y-3"><p className="text-sm font-medium">Choices</p>{question.options.map((opt, n) => <div key={opt.id} className="flex gap-2"><Input aria-label={`Choice ${n + 1}`} value={opt.label} onChange={e => change(i, { options: question.options.map((o, index) => index === n ? { ...o, label: e.target.value } : o) })} />{!locked && <Button variant="secondary" disabled={question.options.length <= 2} onClick={() => change(i, { options: question.options.filter(o => o.id !== opt.id) })}>Remove</Button>}</div>)}{!locked && <Button variant="secondary" disabled={question.options.length >= 30} onClick={() => change(i, { options: [...question.options, { id: crypto.randomUUID(), label: '' }] })}>Add choice</Button>}</div>}</CardBody></Card></li>)}</ol> : <Empty title="No questions yet">Choose a question type below to start.</Empty>}{!locked && <Card><CardHeader title="Add a question" /><CardBody className="flex flex-wrap gap-2">{questionTypes.map(t => <Button key={t} variant="secondary" disabled={questions.length >= 100} onClick={() => setQuestions(q => [...q, freshQuestion(t)])}><Plus className="mr-1 size-4" />{questionTypeLabels[t]}</Button>)}</CardBody></Card>}<div className="flex flex-wrap justify-end gap-2"><a href={`/s/${survey.slug}`} target="_blank" rel="noreferrer" className="rounded-full border border-line-strong px-4 py-2 text-sm">View survey</a><Button disabled={action.busy} onClick={save}>Save questions</Button></div></div>;
}
function SurveySettings({ survey, reload }: { survey: any; reload: () => void }) {
  const action = useAction(reload), [value, setValue] = useState<any>({ title: survey.title, slug: survey.slug, intro: survey.intro || emptyRichDoc(), thankYou: survey.thankYou || emptyRichDoc(), anonymous: survey.anonymous, openLinkEnabled: survey.openLinkEnabled });
  const set = (patch: any) => setValue((v: any) => ({ ...v, ...patch }));
  return <div className="space-y-6"><Feedback action={action} /><Card><CardHeader title="Survey" description="What respondents see." /><CardBody className="space-y-5"><label className="block space-y-2 text-sm font-medium">Title<Input value={value.title} onChange={e => set({ title: e.target.value })} /></label><label className="block space-y-2 text-sm font-medium">Web address<Input value={value.slug} disabled={survey.counts?.invited > 0 || survey.counts?.responses > 0} onChange={e => set({ slug: slugify(e.target.value) })} /></label><div><p id="survey-intro" className="mb-2 text-sm font-medium">Introduction</p><RichTextEditor value={value.intro} onChange={intro => set({ intro })} labelId="survey-intro" /></div><div><p id="survey-thanks" className="mb-2 text-sm font-medium">Thank-you message</p><RichTextEditor value={value.thankYou} onChange={thankYou => set({ thankYou })} labelId="survey-thanks" /></div></CardBody></Card><Card><CardHeader title="Responses" /><CardBody className="space-y-5"><label className="flex gap-3 text-sm"><input type="checkbox" checked={value.anonymous} disabled={survey.counts?.responses > 0} onChange={e => set({ anonymous: e.target.checked })} /><span><strong>Anonymous</strong><br />Answers are not linked to the people who gave them.</span></label><label className="flex gap-3 text-sm"><input type="checkbox" checked={value.openLinkEnabled} onChange={e => set({ openLinkEnabled: e.target.checked })} /><span><strong>Open link</strong><br />Anyone with the link can respond.</span></label></CardBody></Card><Button disabled={action.busy} onClick={() => action.run(`/admin/surveys/${survey.id}`, 'PATCH', { settings: value })}>Save settings</Button><Card><CardHeader title="Delete survey" description="Permanently removes this survey and its recipients and responses." /><CardBody><Button variant="danger" disabled={action.busy} onClick={async () => { if (window.confirm(`Delete “${survey.title}” permanently?`)) { const result = await action.run(`/admin/surveys/${survey.id}`, 'DELETE'); if (result !== null) window.location.href = '/admin/surveys'; } }}>Delete survey</Button></CardBody></Card></div>;
}
function Recipients({ survey, reload }: { survey: any; reload: () => void }) {
  const [text, setText] = useState(''), action = useAction(reload), rows = survey.recipients || [];
  return <div className="space-y-6"><Feedback action={action} /><Card><CardHeader title="Add recipients" description="Paste one email per line, optionally followed by a name. Duplicates are ignored." /><CardBody><form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (await action.run(`/admin/surveys/${survey.id}/recipients`, 'POST', { text })) setText(''); }}><Textarea rows={6} value={text} onChange={e => setText(e.target.value)} placeholder={'alex@example.com, Alex Rivera\nsam@example.com, Sam Lee'} required /><Button type="submit" disabled={action.busy}>Add recipients</Button></form></CardBody></Card><Card><CardHeader title={`Recipients (${rows.length})`} /><ul className="divide-y divide-line">{rows.map((r: any) => <li key={r.id} className="flex items-center justify-between gap-3 px-6 py-4"><span className="text-sm"><strong>{r.name || r.email}</strong><span className="ml-2 text-fg-muted">{r.name ? r.email : ''} {r.completedAt ? '· Completed' : r.invitedAt ? '· Invited' : ''}</span></span><Button variant="secondary" disabled={action.busy || Boolean(r.invitedAt)} onClick={() => { if (window.confirm(`Remove ${r.email}?`)) void action.run(`/admin/surveys/${survey.id}/recipients/${r.id}`, 'DELETE'); }}>Remove</Button></li>)}{!rows.length && <li className="px-6 py-8 text-sm text-fg-muted">No recipients yet.</li>}</ul></Card><SurveyMail survey={survey} reload={reload} /></div>;
}
function SurveyDetail({ id, tab }: { id: string; tab?: string }) {
  const q = useAdminData<any>(`/admin/surveys/${id}`), action = useAction(q.reload);
  const [location] = useLocation();
  const responseId = location.split('/')[5];
  return <div className="space-y-8">
    <State {...q} retry={q.reload}>{q.data && <>
      <Header title={q.data.title} description={`${q.data.status} · ${q.data.counts?.responses || 0} responses · ${q.data.counts?.recipients || 0} recipients`} actions={<div className="flex flex-wrap gap-2">{(['open', 'closed'] as const).filter(s => s !== q.data.status).map(status => <Button key={status} variant="secondary" disabled={action.busy} onClick={() => void action.run(`/admin/surveys/${id}`, 'PATCH', { status })}>{status === 'open' ? 'Open survey' : 'Close survey'}</Button>)}</div>} />
      <Feedback action={action} />
      <nav className="flex flex-wrap gap-2 border-b border-line pb-3">
        {[['', 'Questions'], ['recipients', 'Recipients'], ['responses', 'Responses'], ['results', 'Results'], ['settings', 'Settings']].map(([path, label]) => <Link key={path} href={`/admin/surveys/${id}${path ? `/${path}` : ''}`} className={`rounded-full px-4 py-2 text-sm ${(!tab && !path) || tab === path ? 'bg-accent text-on-accent' : 'text-fg-muted hover:bg-accent-soft'}`}>{label}</Link>)}
      </nav>
      {!tab || tab === 'questions' ? <QuestionBuilder key={id} survey={q.data} reload={q.reload} />
        : tab === 'settings' ? <div className="space-y-6"><SurveySettings key={id} survey={q.data} reload={q.reload} /><DeleteAllResponses survey={q.data} reload={q.reload} /></div>
        : tab === 'recipients' ? <Recipients survey={q.data} reload={q.reload} />
        : tab === 'results' ? <Results survey={q.data} />
        : tab === 'responses' ? <Responses key={`${id}/${responseId || ''}`} survey={q.data} responseId={responseId} reload={q.reload} />
        : <Empty title="Page not found"><Link href={`/admin/surveys/${id}`}>Return to questions</Link></Empty>}
    </>}</State>
  </div>;
}
function Settings() {
  const q = useAdminData<any>('/admin/settings'), action = useAction(q.reload), [values, setValues] = useState<any>(null);
  useEffect(() => { if (q.data && !values) setValues({ ...q.data, notificationRecipients: (q.data.notificationRecipients || []).join('\n') }); }, [q.data]);
  const set = (name: string, value: unknown) => setValues((old: any) => ({ ...old, [name]: value }));
  const fields = [
    ['siteName', 'Site name', 'text'], ['contactEmail', 'Contact email', 'email'], ['partnerProgramLabel', 'Partner program label', 'text'],
    ['notificationRecipients', 'Notification recipients (one email per line)', 'textarea'], ['homeMetaTitle', 'Home page title', 'text'],
    ['homeMetaDescription', 'Home page description', 'textarea'], ['analyticsSnippet', 'Analytics snippet', 'textarea'],
  ];
  return <div className="space-y-8"><Header title="Settings" description="Site identity, notifications, search appearance, and maintenance." /><State {...q} retry={q.reload}>{values && <form className="space-y-6" onSubmit={e => { e.preventDefault(); const { siteName, contactEmail, partnerProgramLabel, notificationRecipients, homeMetaTitle, homeMetaDescription, analyticsSnippet, maintenanceMode } = values; action.run('/admin/settings', 'PATCH', { siteName, contactEmail, partnerProgramLabel, notificationRecipients: notificationRecipients.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean), homeMetaTitle, homeMetaDescription, analyticsSnippet, maintenanceMode }); }}><Feedback action={action} /><Card><CardHeader title="Site" description="Basics used across the public site." /><CardBody className="grid gap-5 sm:grid-cols-2">{fields.slice(0, 3).map(([name, label, type]) => <label key={name} className="block space-y-2 text-sm font-medium">{label}<Input type={type} value={values[name] || ''} onChange={e => set(name, e.target.value)} required /></label>)}</CardBody></Card><Card><CardHeader title="Notifications" description="Who receives new demo requests and partner applications." /><CardBody><label className="block space-y-2 text-sm font-medium">{fields[3][1]}<Textarea rows={4} value={values.notificationRecipients} onChange={e => set('notificationRecipients', e.target.value)} /></label></CardBody></Card><Card><CardHeader title="Search and sharing" /><CardBody className="space-y-5">{fields.slice(4, 6).map(([name, label, type]) => <label key={name} className="block space-y-2 text-sm font-medium">{label}{type === 'textarea' ? <Textarea value={values[name] || ''} onChange={e => set(name, e.target.value)} rows={3} /> : <Input value={values[name] || ''} onChange={e => set(name, e.target.value)} />}</label>)}</CardBody></Card><Card><CardHeader title="Analytics" /><CardBody><label className="block space-y-2 text-sm font-medium">Analytics snippet<Textarea rows={5} className="font-mono" value={values.analyticsSnippet || ''} onChange={e => set('analyticsSnippet', e.target.value)} /></label></CardBody></Card><Card><CardHeader title="Maintenance" /><CardBody><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={Boolean(values.maintenanceMode)} onChange={e => set('maintenanceMode', e.target.checked)} /><span><strong>Maintenance mode</strong><br />Visitors see a holding page until this is switched off.</span></label></CardBody></Card><Button type="submit" disabled={action.busy}>Save settings</Button></form>}</State></div>;
}
function Activity() {
  const q = useAdminData<any[]>('/admin/activity');
  return <div className="space-y-8"><Header title="Activity" description="A record of changes to the site." /><State {...q} retry={q.reload}>{q.data?.length ? <Card><ul className="divide-y divide-line">{q.data.map((row: any) => <li key={row.id} className="flex flex-wrap justify-between gap-3 px-6 py-4 text-sm"><span><strong>{row.action}</strong><span className="ml-2 text-fg-muted">{row.target || row.actorEmail || ''}</span></span><time className="text-fg-muted">{date(row.createdAt)}</time></li>)}</ul></Card> : <Empty title="No activity yet">Changes will appear here.</Empty>}</State></div>;
}
export function Admin() {
  const [location, navigate] = useLocation();
  const [session, setSession] = useState<any>(null), [loading, setLoading] = useState(true);
  const refresh = () => api<{ user: any }>('/admin/session').then(data => setSession(data.user)).catch(() => setSession(null)).finally(() => setLoading(false));
  useEffect(() => { void refresh(); }, []);
  useEffect(() => { document.title = `${location === '/admin/login' ? 'Sign in' : 'Admin'} | Opero`; }, [location]);
  const parts = location.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
  if (loading) return <div className="min-h-dvh p-12"><div className="h-12 w-60 animate-pulse rounded bg-surface-raised" /></div>;
  if (!session) return <Login onDone={() => { void refresh(); navigate('/admin'); }} />;
  const section = parts[0];
  return <div data-theme="dark"><AdminShell enabled={nav} account={<div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-fg">{session.name || session.email}</p><Link href="/admin/account" className="text-xs text-fg-muted hover:text-fg">My account</Link></div><button className="text-xs text-fg-muted underline" onClick={async () => { await api('/admin/logout', { method: 'POST' }); setSession(null); navigate('/admin/login'); }}>Sign out</button></div>}>
    {!section || section === 'dashboard' || section === 'login' ? <Dashboard /> : section === 'inquiries' ? <Inquiries key={parts.join('/')} id={parts[1]} /> : section === 'content' ? <Content key={parts.join('/')} parts={parts.slice(1)} /> : section === 'surveys' ? parts[1] === 'new' ? <SurveyNew /> : parts[1] ? <SurveyDetail key={parts[1]} id={parts[1]} tab={parts[2]} /> : <SurveyList /> : section === 'settings' ? <Settings /> : section === 'team' ? <Team selfId={session.id} /> : section === 'activity' ? <Activity /> : section === 'console' ? <Console /> : section === 'media' ? <Media /> : section === 'account' ? <Account user={session} /> : <Empty title="Page not found"><Link href="/admin">Return to dashboard</Link></Empty>}
  </AdminShell></div>;
}