'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

export function SurveyTabs({ id }: { id: string }) {
  const pathname = usePathname();
  const base = `/admin/surveys/${id}`;
  const tabs = [
    { href: base, label: 'Questions', active: pathname === base },
    { href: `${base}/recipients`, label: 'Recipients', active: pathname.startsWith(`${base}/recipients`) },
    { href: `${base}/results`, label: 'Results', active: pathname.startsWith(`${base}/results`) || pathname.startsWith(`${base}/responses`) },
    { href: `${base}/settings`, label: 'Settings', active: pathname.startsWith(`${base}/settings`) },
  ];
  return (
    <nav aria-label="Survey sections" className="-mx-1 overflow-x-auto border-b border-line">
      <ul className="flex min-w-max gap-1 px-1">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={tab.active ? 'page' : undefined}
              className={cn(
                '-mb-px inline-flex h-11 items-center border-b-2 px-3 text-sm font-medium transition-colors duration-150',
                tab.active ? 'border-fg text-fg' : 'border-transparent text-fg-muted hover:border-line-strong hover:text-fg',
              )}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
