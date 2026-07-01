export default function PromotionBadge() {
  return (
    <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-medium">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
      Продвижение
    </div>
  );
}
