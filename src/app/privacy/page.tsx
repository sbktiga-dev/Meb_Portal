import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности — МебПортал',
  description: 'Политика конфиденциальности платформы МебПортал для специалистов мебельной индустрии.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        <Link href="/" className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 text-sm font-medium mb-8">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          На главную
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Политика конфиденциальности</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Дата вступления в силу: 17 июля 2026 г.</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">1. Введение</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Настоящая Политика конфиденциальности описывает, какие персональные данные собирает платформа МебПортал (далее — Платформа), как они используются и защищаются. Используя Платформу, вы соглашаетесь с условиями данной Политики.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">2. Какие данные мы собираем</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400 leading-relaxed">
              <p><strong className="text-gray-900 dark:text-gray-100">При регистрации:</strong> имя, адрес электронной почты, пароль (хранится в захешированном виде), ИНН (необязательно), роль на платформе.</p>
              <p><strong className="text-gray-900 dark:text-gray-100">В профиле:</strong> фотография, обложка, описание, город, сайт, ссылки на социальные сети, тема оформления.</p>
              <p><strong className="text-gray-900 dark:text-gray-100">При использовании:</strong> публикации, комментарии, сообщения, загруженные файлы, изображения, портфолио, товары.</p>
              <p><strong className="text-gray-900 dark:text-gray-100">Технические данные:</strong> IP-адрес, тип браузера, операционная система, время посещения, cookie-файлы.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">3. Переписки и сообщения</h2>
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-3">
              <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">Важно: все переписки на платформе хранятся на сервере.</p>
            </div>
            <div className="space-y-3 text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>Личные сообщения между пользователями хранятся на серверах Платформы и доступны участникам диалога.</p>
              <p>Администраторы Платформы имеют техническую возможность просмотра переписок для целей модерации, урегулирования споров и обеспечения безопасности. Переписки могут быть использованы при необходимости разрешения конфликтных ситуаций или по 요청у правоохранительных органов.</p>
              <p>Переписки хранятся на протяжении всего срока существования аккаунтов участников. При удалении аккаунта переписка анонимизируется.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">4. Загруженные файлы</h2>
            <div className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-3">
              <p>Изображения, документы и другие файлы, загруженные пользователями, хранятся в защищённом Object Storage (облачное хранилище Яндекс Облака).</p>
              <p>Файлы доступны другим пользователям Платформы в соответствии с настройками приватности владельца.</p>
              <p>Мы не несём ответственности за contenido, размещённое пользователями, но оставляем за собой право удалять материалы, нарушающие правила платформы.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">5. Cookies и авторизация</h2>
            <div className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-3">
              <p>Платформа использует cookie-файлы для обеспечения авторизации пользователей. JWT-токен сохраняется в cookie для поддержания сессии.</p>
              <p>Cookie-файлы не используются для отслеживания поведения пользователей на сторонних ресурсах.</p>
              <p>Вы можете отключить cookie в настройках браузера, однако это может привести к невозможности использования платформы.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">6. Использование данных</h2>
            <div className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-3">
              <p>Мы используем собранные данные для:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Предоставления и улучшения услуг Платформы</li>
                <li>Обеспечения безопасности и предотвращения мошенничества</li>
                <li>Модерации контента и урегулирования споров</li>
                <li>Отправки уведомлений, связанных с активностью на платформе</li>
                <li>Сбора статистики использования (в обезличенной форме)</li>
              </ul>
              <p>Мы не передаём персональные данные третьим лицам, за исключением случаев, предусмотренных законодательством.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">7. Ваши права</h2>
            <div className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-3">
              <p>Вы имеете право:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Получить доступ к своим персональным данным</li>
                <li>Изменить или обновить информацию в профиле</li>
                <li>Удалить свой аккаунт и связанные данные</li>
                <li>Получить копию своих данных</li>
                <li>Отозвать согласие на обработку данных</li>
              </ul>
              <p>Для удаления аккаунта обратитесь к администратору через форму обратной связи или по электронной почте.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">8. Безопасность</h2>
            <div className="text-gray-600 dark:text-gray-400 leading-relaxed space-y-3">
              <p>Мы принимаем разумные меры для защиты ваших данных:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Шифрование передачи данных (HTTPS)</li>
                <li>Хеширование паролей (bcrypt)</li>
                <li>Ограниченный доступ сотрудников к персональным данным</li>
                <li>Регулярное резервное копирование данных</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">9. Изменения в политике</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Мы можем обновлять данную Политику конфиденциальности. О существенных изменениях мы уведомим вас по электронной почте или через уведомления на платформе. Продолжая использовать Платформу после внесения изменений, вы подтверждаете своё согласие с обновлённой Политикой.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">10. Контакты</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              По вопросам, связанным с конфиденциальностью и обработкой персональных данных, обращайтесь:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mt-3">
              <p className="text-gray-700 dark:text-gray-300">Email: admin@mebportal.online</p>
              <p className="text-gray-700 dark:text-gray-300 mt-1">Сайт: mebportal.online</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
