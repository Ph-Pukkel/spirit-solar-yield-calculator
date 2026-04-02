'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function usePageTracking() {
  const pathname = usePathname();
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: pathname }),
    }).catch(() => {
      // Silently ignore tracking errors
    });
  }, [pathname]);
}
