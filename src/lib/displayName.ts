export function getDisplayName(name: string | null | undefined, role?: string): string {
  if (role === 'ADMIN') return 'Мебельный портал';
  return name || 'Аноним';
}

export function getDisplayInitial(name: string | null | undefined, role?: string): string {
  if (role === 'ADMIN') return 'М';
  return name?.charAt(0) || '?';
}
