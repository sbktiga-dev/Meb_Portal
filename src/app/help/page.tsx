'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

type Section = 'profile' | 'posts' | 'promotion' | 'portfolio' | 'messages' | 'catalog' | 'subscription' | 'reviews';

const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: 'profile', label: 'Мой профиль', icon: '👤' },
  { key: 'posts', label: 'Публикации', icon: '📝' },
  { key: 'portfolio', label: 'Портфолио', icon: '🖼' },
  { key: 'catalog', label: 'Каталоги', icon: '📋' },
  { key: 'messages', label: 'Сообщения', icon: '💬' },
  { key: 'reviews', label: 'Отзывы', icon: '⭐' },
  { key: 'subscription', label: 'Подписки и тарифы', icon: '💳' },
  { key: 'promotion', label: 'Продвижение', icon: '🚀' },
];

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState<Section>('profile');

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto">
        <div className="max-w-4xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Помощь и инструкции</h1>
          <p className="text-gray-500 mb-6">Подробное руководство по использованию портала</p>

          {/* Навигация по секциям */}
          <div className="flex flex-wrap gap-2 mb-6">
            {SECTIONS.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeSection === s.key
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>

          {/* Контент */}
          <div className="space-y-6">
            {activeSection === 'profile' && <ProfileHelp />}
            {activeSection === 'posts' && <PostsHelp />}
            {activeSection === 'portfolio' && <PortfolioHelp />}
            {activeSection === 'catalog' && <CatalogHelp />}
            {activeSection === 'messages' && <MessagesHelp />}
            {activeSection === 'reviews' && <ReviewsHelp />}
            {activeSection === 'subscription' && <SubscriptionHelp />}
            {activeSection === 'promotion' && <PromotionHelp />}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">{num}</div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 flex items-start gap-2">
      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      {children}
    </div>
  );
}

function ProfileHelp() {
  return (
    <div className="space-y-6">
      <SectionTitle>Настройка профиля</SectionTitle>
      <p className="text-gray-600 text-sm">Ваш профиль — это визитная карточка на портале. Заполните его полностью, чтобы привлечь больше внимания.</p>

      <div className="space-y-4">
        <Step num={1} title="Перейдите в настройки профиля">
          <p>Нажмите <strong>«Моя страница»</strong> в сайдбаре → <strong>«Редактировать»</strong> в шапке профиля</p>
          <div className="mt-2 bg-gray-100 rounded-lg p-3 font-mono text-xs">
            <span className="text-gray-400">Сайдбар:</span> Моя страница → <span className="text-brand-600">Редактировать</span>
          </div>
        </Step>

        <Step num={2} title="Заполните основную информацию">
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li><strong>Фото профиля</strong> — загрузите профессиональное фото</li>
            <li><strong>Обложка</strong> — баннер в верхней части профиля</li>
            <li><strong>О себе</strong> — краткое описание (до 500 символов)</li>
            <li><strong>Город</strong> — укажите местоположение</li>
            <li><strong>Сайт</strong> — ссылка на ваш сайт или портфолио</li>
          </ul>
        </Step>

        <Step num={3} title="Добавьте соцсети">
          <p>Укажите ссылки на Telegram, WhatsApp, VK, YouTube — посетители смогут связаться с вами</p>
        </Step>

        <Step num={4} title="Настройте баннеры и тему">
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li><strong>Hero-баннер</strong> — широкий баннер в шапке профиля (1920×600)</li>
            <li><strong>Боковые баннеры</strong> — до 10 слотов по бокам (500×400)</li>
            <li><strong>Тема оформления</strong> — 8 готовых градиентов или загрузите своё фоновое изображение</li>
          </ul>
        </Step>

        <Tip>Заполненный профиль получает больше просмотров и подписчиков. Загрузите фото, добавьте описание и настройте баннеры!</Tip>
      </div>
    </div>
  );
}

function PostsHelp() {
  return (
    <div className="space-y-6">
      <SectionTitle>Создание публикаций</SectionTitle>
      <p className="text-gray-600 text-sm">Публикации — основной контент портала. Делитесь проектами, статьями, новостями.</p>

      <div className="space-y-4">
        <Step num={1} title="Создайте новый пост">
          <p>Нажмите <strong>«Создать пост»</strong> в шапке ленты или в сайдбаре</p>
          <div className="mt-2 bg-gray-100 rounded-lg p-3 font-mono text-xs">
            <span className="text-gray-400">Лента:</span> <span className="text-brand-600">Создать пост</span> → Форма создания
          </div>
        </Step>

        <Step num={2} title="Заполните форму">
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li><strong>Заголовок</strong> — кратко опишите суть (обязательно)</li>
            <li><strong>Текст</strong> — подробное описание (обязательно)</li>
            <li><strong>Категория</strong> — выберите: Новость, Проект, Статья, Товар</li>
            <li><strong>Фото/Видео</strong> — загрузите до 10 файлов (JPG, PNG, MP4, WebM)</li>
            <li><strong>Теги</strong> — через запятую: мебель, кухня, проект</li>
          </ul>
        </Step>

        <Step num={3} title="Опубликуйте">
          <p>Нажмите <strong>«Опубликовать»</strong> — пост появится в ленте для всех пользователей</p>
        </Step>

        <Tip>Посты с фото получают в 3 раза больше просмотров. Загружайте качественные изображения!</Tip>
      </div>
    </div>
  );
}

function PortfolioHelp() {
  return (
    <div className="space-y-6">
      <SectionTitle>Портфолио</SectionTitle>
      <p className="text-gray-600 text-sm">Портфолио — витрина ваших работ. Покажите лучшие проекты клиентам.</p>

      <div className="space-y-4">
        <Step num={1} title="Добавьте работу">
          <p>Перейдите в <strong>Личный кабинет → Портфолио → Добавить работу</strong></p>
          <div className="mt-2 bg-gray-100 rounded-lg p-3 font-mono text-xs">
            <span className="text-gray-400">Сайдбар:</span> Портфолио → <span className="text-brand-600">+</span> Добавить
          </div>
        </Step>

        <Step num={2} title="Загрузите фотографии">
          <p>Загрузите до 20 фото работ. Первое фото станет обложкой.</p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Форматы: JPG, PNG, GIF</li>
            <li>Рекомендуемое разрешение: от 800×600</li>
            <li>Можно перетаскивать файлы</li>
          </ul>
        </Step>

        <Step num={3} title="Добавьте описание">
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li><strong>Название</strong> — например: «Кухня в стиле минимализм»</li>
            <li><strong>Описание</strong> — материалы, размеры, особенности</li>
            <li><strong>Категория</strong> — Кухни, Шкафы, Столы и т.д.</li>
          </ul>
        </Step>

        <Tip>Портфолио с 5+ фотографиями привлекает внимание потенциальных клиентов.</Tip>
      </div>
    </div>
  );
}

function CatalogHelp() {
  return (
    <div className="space-y-6">
      <SectionTitle>Каталоги и поиск</SectionTitle>
      <p className="text-gray-600 text-sm">Портал содержит каталоги поставщиков, производств, специалистов и компаний.</p>

      <div className="space-y-4">
        <Step num={1} title="Найдите нужного участника">
          <p>Используйте верхнее меню или сайдбар для перехода в каталог:</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-gray-50 rounded-lg p-2 text-xs"><strong>Поставщики</strong> — фурнитура, материалы</div>
            <div className="bg-gray-50 rounded-lg p-2 text-xs"><strong>Производства</strong> — мебельные цеха</div>
            <div className="bg-gray-50 rounded-lg p-2 text-xs"><strong>Компании</strong> — мебельные фирмы</div>
            <div className="bg-gray-50 rounded-lg p-2 text-xs"><strong>Специалисты</strong> — дизайнеры, технологи</div>
          </div>
        </Step>

        <Step num={2} title="Используйте фильтры">
          <p>Каждый каталог поддерживает поиск по названию и фильтрацию по категориям.</p>
        </Step>

        <Step num={3} title="Перейдите на профиль">
          <p>Нажмите на карточку участника, чтобы увидеть его профиль с контактами, портфолио и постами.</p>
        </Step>

        <Tip>Участники с бейджами <strong>PRO</strong> и <strong>PREMIUM</strong> показываются первыми в каталогах.</Tip>
      </div>
    </div>
  );
}

function MessagesHelp() {
  return (
    <div className="space-y-6">
      <SectionTitle>Личные сообщения</SectionTitle>
      <p className="text-gray-600 text-sm">Общайтесь с другими участниками напрямую.</p>

      <div className="space-y-4">
        <Step num={1} title="Начните диалог">
          <p>Перейдите на профиль нужного человека и нажмите <strong>«Написать»</strong></p>
          <div className="mt-2 bg-gray-100 rounded-lg p-3 font-mono text-xs">
            Профиль → <span className="text-brand-600">Написать</span> → Автоматическое создание диалога
          </div>
        </Step>

        <Step num={2} title="Отправьте сообщение">
          <p>Введите текст в поле ввода внизу чата и нажмите кнопку отправки (или Enter)</p>
        </Step>

        <Tip>Непрочитанные сообщения отмечены красным числом в сайдбаре.</Tip>
      </div>
    </div>
  );
}

function SubscriptionHelp() {
  return (
    <div className="space-y-6">
      <SectionTitle>Подписки и тарифы</SectionTitle>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800 font-medium">Бесплатно до 30 сентября 2026 года</p>
        <p className="text-green-600 text-sm mt-1">Все функции продвижения доступны бесплатно до окончания бесплатного периода.</p>
      </div>

      <p className="text-gray-600 text-sm">Подписка открывает дополнительные возможности для продвижения.</p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 font-medium">Возможность</th>
              <th className="text-center p-3 font-medium">Lite</th>
              <th className="text-center p-3 font-medium text-brand-600">Pro</th>
              <th className="text-center p-3 font-medium text-amber-600">Premium</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr><td className="p-3">Цена/мес</td><td className="text-center p-3"><span className="text-green-600 font-medium">Бесплатно</span><br/><span className="text-gray-400 line-through text-xs">1 500 ₽</span></td><td className="text-center p-3"><span className="text-green-600 font-medium">Бесплатно</span><br/><span className="text-gray-400 line-through text-xs">4 000 ₽</span></td><td className="text-center p-3"><span className="text-green-600 font-medium">Бесплатно</span><br/><span className="text-gray-400 line-through text-xs">8 000 ₽</span></td></tr>
            <tr><td className="p-3">Продвижение постов</td><td className="text-center p-3">✅</td><td className="text-center p-3">✅</td><td className="text-center p-3">✅</td></tr>
            <tr><td className="p-3">Баннеры</td><td className="text-center p-3">1 шт.</td><td className="text-center p-3">2/нед.</td><td className="text-center p-3">4/нед.</td></tr>
            <tr><td className="p-3">Приоритет в каталогах</td><td className="text-center p-3">—</td><td className="text-center p-3">✅</td><td className="text-center p-3">✅ макс.</td></tr>
            <tr><td className="p-3">Рекламные посты на профиле</td><td className="text-center p-3">—</td><td className="text-center p-3">—</td><td className="text-center p-3">✅</td></tr>
            <tr><td className="p-3">Аналитика профиля</td><td className="text-center p-3">—</td><td className="text-center p-3">—</td><td className="text-center p-3">✅</td></tr>
          </tbody>
        </table>
      </div>

      <div className="space-y-4">
        <Step num={1} title="Выберите тариф">
          <p>Перейдите в <strong>Личный кабинет → Тарифы</strong></p>
        </Step>
        <Step num={2} title="Оформите заявку">
          <p>Выберите план и период (месяц/год). Нажмите «Оформить»</p>
        </Step>
        <Step num={3} title="Оплатите">
          <p>Сейчас всё бесплатно! После 30 сентября 2026 — позвоните по телефону для оплаты. Администратор активирует подписку в течение 24 часов.</p>
        </Step>
      </div>
    </div>
  );
}

function PromotionHelp() {
  return (
    <div className="space-y-6">
      <SectionTitle>Продвижение</SectionTitle>
      <p className="text-gray-600 text-sm">Продвижение помогает вашему контенту увидеть больше людей. Сейчас все функции доступны бесплатно до 30 сентября 2026 года.</p>

      {/* Блок: Как получить доступ */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-bold text-blue-800 mb-2">Как получить доступ к продвижению</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
          <li>Перейдите в <strong>Личный кабинет → Тарифы</strong></li>
          <li>Выберите любой тариф (Lite, Pro или Premium) и нажмите «Оформить»</li>
          <li>Перейдите в <strong>Админ-панель → Подписки</strong> и активируйте свою заявку</li>
          <li>После активации перейдите в <strong>Личный кабинет → Продвижение</strong></li>
        </ol>
      </div>

      <div className="space-y-4">
        <Step num={1} title="Продвижение поста">
          <p>Пост закрепляется вверху ленты новостей с меткой <strong>«Рекомендовано»</strong>. Все пользователи увидят его первым при входе на сайт.</p>

          <div className="mt-3 space-y-2">
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="font-medium text-gray-900 mb-1">Как это работает:</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Выбираете пост из списка ваших опубликованных постов</li>
                <li>Нажимаете кнопку «Продвинуть»</li>
                <li>Пост автоматически закрепляется в верхней части ленты</li>
                <li>К посту добавляется заметная метка «Рекомендовано»</li>
                <li>Срок действия: 30 дней с момента активации</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <span className="font-medium">Лимиты по тарифам:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li><strong>Lite</strong> — 1 пост в продвижении одновременно</li>
                <li><strong>Pro</strong> — до 2 постов в неделю</li>
                <li><strong>Premium</strong> — до 4 постов в неделю</li>
              </ul>
            </div>
          </div>
        </Step>

        <Step num={2} title="Создание баннера">
          <p>Рекламный баннер отображается между постами в ленте или над каталогом изображений. Помогает привлечь внимание к вашему продукту или акции.</p>

          <div className="mt-3 space-y-2">
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="font-medium text-gray-900 mb-1">Параметры баннера:</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li><strong>Название</strong> — краткое описание баннера (видно только вам в списке заявок)</li>
                <li><strong>Изображение</strong> — загрузите картинку или укажите URL. Рекомендуемый размер: 1200×400 пикселей</li>
                <li><strong>Ссылка</strong> — URL, куда перейдёт пользователь при клике на баннер</li>
                <li><strong>Размещение</strong> — где будет показываться баннер (см. ниже)</li>
                <li><strong>Аудитория</strong> — категория пользователей, которым показывается баннер</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="font-medium text-gray-900 mb-1">Размещение баннера:</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                  <div className="text-xs font-medium text-gray-500 mb-1">Лента</div>
                  <div className="text-xs text-gray-600">Баннер между постами в ленте новостей. Пользователи видят его при прокрутке.</div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                  <div className="text-xs font-medium text-gray-500 mb-1">Каталог</div>
                  <div className="text-xs text-gray-600">Баннер над сеткой изображений в каталоге. Пользователи видят его при входе в раздел.</div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-gray-200 text-center">
                  <div className="text-xs font-medium text-gray-500 mb-1">Лента + Каталог</div>
                  <div className="text-xs text-gray-600">Баннер показывается одновременно в обоих разделах. Максимальный охват.</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="font-medium text-gray-900 mb-1">Целевая аудитория:</h5>
              <p className="text-sm text-gray-600 mb-2">Выберите категорию товаров, соответствующую вашему баннеру. Баннер будет показываться пользователям, которые просматривают соответствующий контент.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {['Все категории', 'Кухни', 'Гардеробные', 'Столы', 'Стеллажи', 'Диваны', 'Кровати', 'Фурнитура', 'Материалы'].map(cat => (
                  <div key={cat} className="bg-white rounded px-2 py-1 text-xs text-center border border-gray-200">{cat}</div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="font-medium text-gray-900 mb-1">Лимиты баннеров:</h5>
              <ul className="list-disc list-inside space-y-0.5 text-sm text-gray-600">
                <li><strong>Lite</strong> — 1 баннер одновременно</li>
                <li><strong>Pro</strong> — до 2 баннеров в неделю</li>
                <li><strong>Premium</strong> — до 4 баннеров в неделю</li>
              </ul>
            </div>
          </div>
        </Step>

        <Step num={3} title="Статус заявки">
          <p>После создания заявки она получает статус <strong>«Ожидает»</strong>. Администратор проверяет и активирует продвижение.</p>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs font-medium">Ожидает</span>
              <span className="text-gray-600">— заявка создана, ожидает активации администратором</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-medium">Активно</span>
              <span className="text-gray-600">— продвижение работает, контент продвигается</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs font-medium">Истекло</span>
              <span className="text-gray-600">— срок действия продвижения закончился</span>
            </div>
          </div>
        </Step>

        <Tip>Для Premium-подписчиков: создавайте рекламные посты (акции), которые отображаются на вашем профиле для посетителей. Это помогает продавать товары и привлекать клиентов напрямую.</Tip>
      </div>
    </div>
  );
}

function ReviewsHelp() {
  return (
    <div className="space-y-6">
      <SectionTitle>Система отзывов</SectionTitle>
      <p className="text-gray-600 text-sm">Отзывы помогают установить репутацию и получить обратную связь от клиентов и коллег.</p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-amber-800 font-medium">Модерация отзывов</p>
        <p className="text-amber-700 text-sm mt-1">Все отзывы проходят проверку перед публикацией. Это защищает от недобросовестных отзывов.</p>
      </div>

      <div className="space-y-4">
        <Step num={1} title="Оставить отзыв">
          <p>Перейдите на профиль пользователя и нажмите <strong>«Оставить отзыв»</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Оцените работу от 1 до 5 звёзд</li>
            <li>Напишите текст отзыва (обязательно)</li>
            <li>Прикрепите фото работ (необязательно)</li>
          </ul>
        </Step>

        <Step num={2} title="Модерация">
          <p>Отзыв отправляется на проверку. Адресат уведомлён о новом отзыве.</p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li><strong>Одобрение</strong> — адресат подтверждает отзыв, он публикуется</li>
            <li><strong>Оспаривание</strong> — адресат не согласен, спор передаётся админу</li>
            <li><strong>Авто-одобрение</strong> — если адресат не отреагировал за 24 часа</li>
          </ul>
        </Step>

        <Step num={3} title="Публикация">
          <p>Одобренный отзыв отображается на профиле автора и адресата. Оценки влияют на рейтинг.</p>
        </Step>

        <Tip>Пишите подробные отзывы с фото — они помогают другим пользователям сделать выбор и повышают ваш авторитет.</Tip>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">{children}</h2>;
}
