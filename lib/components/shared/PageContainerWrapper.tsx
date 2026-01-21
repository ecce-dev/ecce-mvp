'use client';

import { useState, useEffect } from 'react';
import { useDevice } from '@/lib/hooks/useDevice';
import { cn } from '../../utils/utils';

export default function PageContainerWrapper({ 
  children,
  className
}: { 
  children: React.ReactNode,
  className?: string
}) {
  const { isPWA } = useDevice();
  const [mounted, setMounted] = useState(false);
  
  // Only update after hydration to prevent mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Use default (non-PWA) class during SSR and initial render to match server
  const containerClass = mounted && isPWA
    ? 'fixed top-0 left-0 right-0 bottom-0 w-full'
    : 'min-h-dvh h-dvh w-full';
  
  const safeAreaClass = mounted && isPWA
    ? 'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]'
    : 'safe-area-content';

  return (
    <div 
      data-scroll-container="true"
      className={cn('flex', containerClass, safeAreaClass, 'justify-center max-w-screen min-w-screen', className)}
    >
      {children}
    </div>
  );
}

