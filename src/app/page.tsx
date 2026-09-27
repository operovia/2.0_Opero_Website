import { BrandMark } from '@/components/brand/brand-mark';

const modules = ['build', 'studios', 'playbook', 'university', 'compass'] as const;

const jewelClass = {
  studios: 'jewel-studios',
  playbook: 'jewel-playbook',
  university: 'jewel-university',
  compass: 'jewel-compass',
  build: 'jewel-build',
} as const;

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-content flex-col gap-16 px-gutter py-16">
      <BrandMark name="opero-small" className="h-9 self-start" />
      <div>
        <p className="text-eyebrow font-medium uppercase text-fg-subtle">Brand check</p>
        <h1 className="mt-4 max-w-4xl text-display-lg font-medium text-metal">
          The AI-driven operating platform for real estate companies.
        </h1>
        <p className="mt-6 max-w-prose text-lg text-fg-muted">
          Temporary page to verify the supplied artwork, fonts, and colors.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {modules.map((m) => (
          <li key={m} className="rounded-xl border border-line bg-surface p-6 shadow-md">
            <span className={`block size-5 rounded-full ${jewelClass[m]}`} aria-hidden />
            <BrandMark name={`module-${m}`} className="mt-6 h-6" />
          </li>
        ))}
      </ul>
      <div data-theme="light" className="rounded-2xl p-10">
        <BrandMark name="opero" on="light" className="h-16" />
        <BrandMark name="operovia-small" on="light" className="mt-8 h-7" />
      </div>
      <BrandMark name="opero" className="h-24 self-start" />
      <BrandMark name="operovia" className="h-10 self-start" />
    </main>
  );
}
