'use client';

import { useEffect } from 'react';

interface PageSEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
}

export default function PageSEO({ title, description, image, url }: PageSEOProps) {
  useEffect(() => {
    const fullTitle = `${title} | МебПортал`;
    document.title = fullTitle;

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (tag) {
        tag.setAttribute('content', content);
      } else {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        tag.content = content;
        document.head.appendChild(tag);
      }
    };

    setMeta('description', description);
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:type', 'website', true);
    setMeta('og:site_name', 'МебПортал', true);
    setMeta('og:locale', 'ru_RU', true);

    if (image) setMeta('og:image', image, true);
    if (url) setMeta('og:url', url, true);

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    if (image) setMeta('twitter:image', image);
  }, [title, description, image, url]);

  return null;
}
