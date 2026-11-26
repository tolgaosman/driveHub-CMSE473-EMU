'use client';

import React from 'react';
import { MotionConfig } from 'framer-motion';
import { AppProvider } from '@/context/AppContext';
import { DemoDirectorDock } from '@/components/demo/DemoDirectorDock';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AppProvider>
        {children}
        <DemoDirectorDock />
      </AppProvider>
    </MotionConfig>
  );
}

