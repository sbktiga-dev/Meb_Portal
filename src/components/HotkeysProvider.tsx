'use client';

import { useGlobalHotkeys } from '@/hooks/useHotkeys';

export default function HotkeysProvider({ children }: { children: React.ReactNode }) {
  useGlobalHotkeys();
  return <>{children}</>;
}
