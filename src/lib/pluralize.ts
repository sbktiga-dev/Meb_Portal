export function pluralize(count: number, one: string, few: string, many: string): string {
  const abs = Math.abs(count) % 100;
  const lastDigit = abs % 10;
  if (abs > 10 && abs < 20) return `${count} ${many}`;
  if (lastDigit > 1 && lastDigit < 5) return `${count} ${few}`;
  if (lastDigit === 1) return `${count} ${one}`;
  return `${count} ${many}`;
}

export function pluralizeLikes(count: number): string {
  return pluralize(count, 'лайк', 'лайка', 'лайков');
}

export function pluralizeComments(count: number): string {
  return pluralize(count, 'комментарий', 'комментария', 'комментариев');
}

export function pluralizeNew(count: number): string {
  return pluralize(count, 'новое', 'новых', 'новых');
}