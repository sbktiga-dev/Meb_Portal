import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import HotkeysProvider from '@/components/HotkeysProvider';
import ThemeProvider from '@/components/ThemeProvider';
import { CompareProvider } from '@/components/CompareProvider';
import PushRegistration from '@/components/PushRegistration';
import { Toaster } from 'react-hot-toast';

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
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <CompareProvider>
          <PushRegistration />
          <HotkeysProvider>
            <Toaster position="top-center" toastOptions={{ duration: 3000, style: { borderRadius: '12px', padding: '12px 16px', fontSize: '14px' } }} />
            <Header />
            <main className="min-h-screen pb-16 md:pb-0">{children}</main>
            <Footer />
            <MobileBottomNav />
          </HotkeysProvider>
          </CompareProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
