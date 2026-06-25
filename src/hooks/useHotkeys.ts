'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface HotkeyConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useHotkeys(hotkeys: HotkeyConfig[]) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;

    for (const hotkey of hotkeys) {
      const ctrlMatch = hotkey.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
      const shiftMatch = hotkey.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = hotkey.alt ? e.altKey : !e.altKey;

      if (e.key.toLowerCase() === hotkey.key.toLowerCase() && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault();
        hotkey.action();
        return;
      }
    }
  }, [hotkeys]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function useGlobalHotkeys() {
  const router = useRouter();

  useHotkeys([
    {
      key: 'k',
      ctrl: true,
      action: () => {
        window.dispatchEvent(new CustomEvent('open-search'));
      },
      description: 'Открыть поиск',
    },
    {
      key: 'n',
      ctrl: true,
      action: () => router.push('/feed/new'),
      description: 'Новый пост',
    },
    {
      key: '/',
      ctrl: true,
      action: () => router.push('/shortcuts'),
      description: 'Справка по горячим клавишам',
    },
  ]);
}

export const HOTKEY_LIST = [
  { keys: ['Ctrl', 'K'], description: 'Открыть глобальный поиск' },
  { keys: ['Ctrl', 'N'], description: 'Создать новый пост' },
  { keys: ['Ctrl', '/'], description: 'Открыть справку по горячим клавишам' },
  { keys: ['Esc'], description: 'Закрыть модальное окно' },
];
