import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { BrandMark } from '@/components/brand/brand-mark';
import { AdminShell } from '@/components/admin/shell';
import type { NavKey } from '@/components/admin/nav';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/field';
import { api } from '@/lib/opero-api';
import { pages } from '@/content/registry';

const nav: NavKey[] = ['dashboard', 'inquiries', 'content', 'console', 'surveys', 'media', 'settings', 'team', 'activity'];
const labels: Record<string, string> = { inquiries: 'Inquiries', content: 'Content', console: 'Oppie console', surveys: 'Surveys', media: 'Media', settings: 'Settings', team: 'Team', activity: 'Activity', account: 'Account' };
const classes = 'w-full rounded-lg border border-line-input bg-surface px-4 py-3 text-sm text-fg outline-none focus:border-accent';

function Notice({ children, danger = false }: { children: React.ReactNode; danger?: boolean }) {
  return <div role="status" className={`rounded-lg border px-4 py-3 text-sm ${danger ? 'border-danger/40 bg-danger-soft text-danger' : 'border-success/40 bg-success-soft text-fg'}`}>{children}</div>;
}

function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try { await api('/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }); onDone(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-dvh items-center justify-center px-gutter py-16">
    <div className="w-full max-w-sm">
      <BrandMark name="opero-small" on="auto" className="mx-auto h-10" />
      <div className="mt-10 rounded-2xl border border-line bg-surface p-8 shadow-lg">
        <h1 className="text-xl font-semibold text-fg">Sign in</h1>
        <p className="mt-1 text-sm text-fg-muted">Admin access for the Opero site.</p>
        <form onSubmit={submit} className="mt-6 space-y-5">
          {error && <Notice danger>{error}</Notice>}
          <label className="block space-y-2 text-sm font-medium text-fg">Email<Input name="email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required autoFocus /></label>
          <label className="block space-y-2 text-sm font-medium text-fg">Password<Input name="password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
        </form>
      </div>
    </div>
  </main>;
}

function DataPanel({ section, parts }: { section: string; parts: string[] }) {
  const path = `/${section}${parts.length ? `/${parts.join('/')}` : ''}`;
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<any>(null);
  const [newItem, setNewItem] = useState(false);
  const reload = () => {
    setBusy(true); setError('');
    api(`/admin${path}`).then(setData).catch(e => setError(e.message)).finally(() => setBusy(false));
  };
  useEffect(reload, [path]);
  async function mutate(method: string, target: string, payload?: any) {
    setError(''); setMessage('');
    try {
      await api(`/admin${target}`, { method, ...(payload !== undefined ? { body: JSON.stringify(payload) } : {}) });
      setEditing(null); setNewItem(false); setMessage('Changes saved.'); reload();
    } catch (e) { setError((e as Error).message); }
  }
  const title = section ? labels[section] || section.replace(/-/g, ' ') : 'Dashboard';
  const collection = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.[section]) ? data[section] : null;
  const detail = data?.item || data?.record || (collection ? null : data);
  return <div className="space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-fg-subtle">Opero / Admin</p><h1 className="text-display-sm font-medium text-metal">{title}</h1><p className="mt-2 text-sm text-fg-muted">{parts.length ? parts.join(' / ') : section === 'content' ? 'Every word on the public site.' : `Manage ${title.toLowerCase()}.`}</p></div>
      {section === 'surveys' && !parts.length && <Link href="/admin/surveys/new" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent">New survey</Link>}
      {section === 'team' && !parts.length && <Button onClick={() => setNewItem(true)}>Invite teammate</Button>}
      {section === 'media' && <label className="cursor-pointer rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent">Upload media<input className="sr-only" type="file" accept="image/*" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; const form = new FormData(); form.append('file', file); try { await api('/admin/media/upload', { method: 'POST', body: form }); setMessage('Media uploaded.'); reload(); } catch (err) { setError((err as Error).message); } }} /></label>}
    </header>
    {error && <Notice danger>{error} <button onClick={reload} className="ml-2 underline">Retry</button></Notice>}
    {message && <Notice>{message}</Notice>}
    {section === 'content' && !parts.length && <div className="grid gap-3">{Object.entries(pages).map(([key, page]) => <Link key={key} href={`/admin/content/${key}`} className="flex items-center justify-between rounded-xl border border-line bg-surface px-6 py-5 text-fg hover:bg-accent-soft"><span><strong className="block">{page.label}</strong><span className="text-sm text-fg-muted">{page.description}</span></span><span aria-hidden>→</span></Link>)}</div>}
    {section === 'content' && parts.length === 1 && parts[0] in pages && <div className="grid gap-3">{Object.entries((pages as any)[parts[0]].sections).map(([key, value]: [string, any]) => <Link key={key} href={`/admin/content/${parts[0]}/${key}`} className="flex items-center justify-between rounded-xl border border-line bg-surface px-6 py-5 text-fg hover:bg-accent-soft"><span><strong className="block">{value.label}</strong><span className="text-sm text-fg-muted">{value.description}</span></span><span aria-hidden>→</span></Link>)}</div>}
    {busy ? <div className="animate-pulse space-y-3">{[0, 1, 2].map(n => <div key={n} className="h-20 rounded-xl bg-surface-raised" />)}</div> :
      collection ? <div className="overflow-hidden rounded-xl border border-line bg-surface"><ul className="divide-y divide-line">{collection.map((item: any, i: number) => {
        const id = item.id || item.key || i;
        return <li key={id} className="flex items-center justify-between gap-4 px-6 py-5">
          <Link href={`/admin/${section}/${id}`} className="min-w-0 flex-1 hover:text-accent"><strong className="block truncate text-fg">{item.title || item.name || item.email || item.label || `Item ${i + 1}`}</strong><span className="mt-1 block truncate text-sm text-fg-muted">{item.status || item.description || item.type || item.createdAt || ''}</span></Link>
          <button onClick={() => setEditing(item)} className="text-sm text-fg-muted underline hover:text-fg">Edit</button>
        </li>;
      })}</ul></div> : section !== 'content' && detail ? <div className="rounded-xl border border-line bg-surface p-6">
        <div className="space-y-5">{Object.entries(detail).filter(([key, value]) => !['id', 'passwordHash'].includes(key) && (typeof value !== 'object' || value === null)).map(([key, value]) => <div key={key} className="border-b border-line pb-4"><dt className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">{key.replace(/([A-Z])/g, ' $1')}</dt><dd className="mt-1 break-words text-fg">{String(value ?? '—')}</dd></div>)}</div>
        <Button variant="secondary" className="mt-6" onClick={() => setEditing(detail)}>Edit</Button>
      </div> : section !== 'content' && !error ? <div className="rounded-xl border border-line bg-surface px-6 py-12 text-center text-fg-muted">Nothing here yet.</div> : null}
    {section === 'inquiries' && parts.length > 0 && detail && <div className="flex flex-wrap gap-2">{['new', 'contacted', 'qualified', 'closed'].map(status => <Button key={status} variant="secondary" onClick={() => mutate('PATCH', path, { status })}>{status}</Button>)}</div>}
    {section === 'surveys' && parts.length > 0 && parts[0] !== 'new' && <div className="flex flex-wrap gap-3">{['questions', 'recipients', 'responses', 'results', 'settings'].map(tab => <Link key={tab} href={`/admin/surveys/${parts[0]}/${tab}`} className="rounded-full border border-line-strong px-4 py-2 text-sm text-fg hover:bg-accent-soft">{tab}</Link>)}<Button variant="secondary" onClick={() => mutate('PATCH', `/surveys/${parts[0]}`, { status: 'open' })}>Open survey</Button><Button variant="secondary" onClick={() => mutate('PATCH', `/surveys/${parts[0]}`, { status: 'closed' })}>Close survey</Button></div>}
    {(editing || newItem || (section === 'surveys' && parts[0] === 'new')) && <Editor key={JSON.stringify(editing || {}) + newItem + path} title={newItem || parts[0] === 'new' ? 'Create' : 'Edit'} initial={editing || { title: '', description: '' }} onCancel={() => { setEditing(null); setNewItem(false); }} onSave={value => mutate(newItem || parts[0] === 'new' ? 'POST' : 'PATCH', newItem || parts[0] === 'new' ? `/${section}` : path, value)} onDelete={editing?.id ? () => { if (window.confirm('Delete this item permanently?')) mutate('DELETE', `/${section}/${editing.id}`); } : undefined} />}
  </div>;
}

function Editor({ title, initial, onSave, onCancel, onDelete }: { title: string; initial: any; onSave: (data: any) => void; onCancel: () => void; onDelete?: () => void }) {
  const [value, setValue] = useState<any>(initial);
  const fields = useMemo(() => Object.entries(initial).filter(([key, val]) => !['id', 'createdAt', 'updatedAt', 'passwordHash'].includes(key) && (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean')), [initial]);
  return <div className="rounded-xl border border-line-strong bg-surface p-6 shadow-lg"><h2 className="text-xl font-semibold text-fg">{title}</h2><form className="mt-6 space-y-5" onSubmit={e => { e.preventDefault(); onSave(value); }}>{fields.map(([key, original]) => <label key={key} className="block space-y-2 text-sm font-medium text-fg"><span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>{typeof original === 'boolean' ? <input type="checkbox" checked={Boolean(value[key])} onChange={e => setValue({ ...value, [key]: e.target.checked })} className="ml-3 accent-[var(--o-accent)]" /> : key.toLowerCase().match(/body|description|message|intro|notes/) ? <Textarea className={classes} value={String(value[key] ?? '')} onChange={e => setValue({ ...value, [key]: e.target.value })} rows={4} /> : <Input className={classes} value={String(value[key] ?? '')} onChange={e => setValue({ ...value, [key]: typeof original === 'number' ? Number(e.target.value) : e.target.value })} />}</label>)}<div className="flex flex-wrap gap-3"><Button type="submit">Save changes</Button><Button variant="secondary" onClick={onCancel}>Cancel</Button>{onDelete && <Button variant="danger" onClick={onDelete}>Delete</Button>}</div></form></div>;
}

export function Admin() {
  const [location, navigate] = useLocation();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const refresh = () => api('/admin/session').then(setSession).catch(() => setSession(null)).finally(() => setLoading(false));
  useEffect(() => { void refresh(); }, []);
  useEffect(() => { document.title = `${location === '/admin/login' ? 'Sign in' : 'Admin'} | Opero`; }, [location]);
  const parts = location.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
  if (loading) return <div className="min-h-dvh p-12"><div className="h-12 w-60 animate-pulse rounded bg-surface-raised" /></div>;
  if (!session) return <Login onDone={() => { refresh(); navigate('/admin'); }} />;
  if (parts[0] === 'login') { navigate('/admin'); return null; }
  return <div data-theme="system"><AdminShell enabled={nav} account={<div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-fg">{session.name || session.email || 'Administrator'}</p><Link href="/admin/account" className="text-xs text-fg-muted hover:text-fg">My account</Link></div><button className="text-xs text-fg-muted underline" onClick={async () => { await api('/admin/logout', { method: 'POST' }); setSession(null); navigate('/admin/login'); }}>Sign out</button></div>}><DataPanel key={location} section={parts[0] || ''} parts={parts.slice(1)} /></AdminShell></div>;
}