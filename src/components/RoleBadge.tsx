const roleConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  USER: { label: 'Специалист', color: 'text-purple-600', bgColor: 'bg-purple-500', icon: '✦' },
  COMPANY: { label: 'Компания', color: 'text-blue-600', bgColor: 'bg-blue-500', icon: '◆' },
  SUPPLIER: { label: 'Поставщик', color: 'text-emerald-600', bgColor: 'bg-emerald-500', icon: '●' },
  MANUFACTURER: { label: 'Производство', color: 'text-amber-600', bgColor: 'bg-amber-500', icon: '■' },
  CLIENT: { label: 'Клиент', color: 'text-gray-600', bgColor: 'bg-gray-400', icon: '○' },
  ADMIN: { label: 'Админ', color: 'text-red-600', bgColor: 'bg-red-500', icon: '★' },
};

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function RoleBadge({ role, size = 'sm', className = '' }: RoleBadgeProps) {
  const config = roleConfig[role] || roleConfig.USER;

  const sizeClasses = {
    sm: 'w-4 h-4 text-[8px]',
    md: 'w-5 h-5 text-[9px]',
    lg: 'w-6 h-6 text-[10px]',
  };

  return (
    <span
      className={`absolute -bottom-0.5 -right-0.5 ${sizeClasses[size]} ${config.bgColor} text-white rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm z-10 ${className}`}
      title={config.label}
    >
      {config.icon}
    </span>
  );
}

export function RoleLabel({ role, className = '' }: { role: string; className?: string }) {
  const config = roleConfig[role] || roleConfig.USER;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${config.color} ${className}`}>
      {config.icon} {config.label}
    </span>
  );
}
