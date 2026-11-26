'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { useApp } from '@/context/AppContext';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !user) {
      router.replace('/');
    }
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-canvas)] text-sm text-[var(--ink-muted)]">
        Loading DriveHub workspace…
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}

