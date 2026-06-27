import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HotkeysProvider from '@/components/HotkeysProvider';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: {
    default: 'Мебельный портал — Библиотека мебельщика',
    template: '%s | МебПортал',
  },
  description: 'Бесплатная библиотека изображений мебели, документы, справочники, каталог поставщиков и производств для специалистов мебельной отрасли',
  keywords: ['мебель', 'кухни', 'фурнитура', 'ЛДСП', 'дизайн интерьер', 'мебельное производство', 'поставщики мебели', 'шаблоны договоров'],
  authors: [{ name: 'МебПортал' }],
  creator: 'МебПортал',
  publisher: 'МебПортал',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'МебПортал',
    title: 'Мебельный портал — Библиотека мебельщика',
    description: 'Бесплатная библиотека изображений мебели, документы, справочники, каталог поставщиков',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Мебельный портал — Библиотека мебельщика',
    description: 'Бесплатная библиотека изображений мебели, документы, справочники, каталог поставщиков',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <HotkeysProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </HotkeysProvider>
      </body>
    </html>
  );
}
