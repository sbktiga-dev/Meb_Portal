interface ContactInfoProps {
  phone: string | null;
  website: string | null;
  location: string | null;
  socialLinks: Record<string, string>;
}

const socialIcons: Record<string, string> = {
  telegram: '✈',
  whatsapp: '💬',
  vk: 'V',
  youtube: '▶',
  instagram: '📷',
};

export default function ContactInfo({ phone, website, location, socialLinks }: ContactInfoProps) {
  const hasContent = phone || website || location || Object.keys(socialLinks).length > 0;
  if (!hasContent) return null;

  return (
    <div className="card-base p-5 space-y-3">
      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Контакты</h3>
      {phone && (
        <div className="flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
          <a href={`tel:${phone}`} className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300">{phone}</a>
        </div>
      )}
      {website && (
        <div className="flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
          <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 truncate">{website}</a>
        </div>
      )}
      {location && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {location}
        </div>
      )}
      {Object.keys(socialLinks).length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {Object.entries(socialLinks).map(([key, url]) => url && (
            <a key={key} href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-brand-50 dark:hover:bg-brand-500/10 text-xs text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              <span>{socialIcons[key] || '🔗'}</span>
              <span className="capitalize">{key}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
