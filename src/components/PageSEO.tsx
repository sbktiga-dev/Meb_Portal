'use client';

import { useEffect } from 'react';

export default function PageSEO({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    document.title = `${title} | МебПортал`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', description);
    } else {
      const tag = document.createElement('meta');
      tag.name = 'description';
      tag.content = description;
      document.head.appendChild(tag);
    }
  }, [title, description]);

  return null;
}
