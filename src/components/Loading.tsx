export default function Loading({ text = 'Загрузка...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative mb-5">
        <div className="w-14 h-14 border-4 border-brand-100 rounded-full" />
        <div className="absolute inset-0 w-14 h-14 border-4 border-transparent border-t-brand-500 rounded-full animate-spin" />
      </div>
      <p className="text-gray-400 text-sm font-medium">{text}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card-base overflow-hidden animate-pulse">
      <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer h-48" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 rounded-full w-16" />
          <div className="h-5 bg-gray-200 rounded-full w-20" />
        </div>
        <div className="h-3 bg-gray-200 rounded-lg w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 bg-white rounded-2xl shadow-card p-4 animate-pulse">
          <div className="w-20 h-20 bg-gray-200 rounded-xl shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 rounded-lg w-1/3" />
            <div className="h-3 bg-gray-200 rounded-lg w-1/4" />
          </div>
          <div className="w-24 h-10 bg-gray-200 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonFeed({ count = 3 }: { count?: number }) {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-base overflow-hidden animate-pulse">
          <div className="flex items-center gap-3 p-5 pb-0">
            <div className="w-11 h-11 bg-gray-200 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded-lg w-1/3" />
              <div className="h-3 bg-gray-200 rounded-lg w-1/5" />
            </div>
          </div>
          <div className="px-5 pt-4 pb-3 space-y-2">
            <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
            <div className="h-3 bg-gray-200 rounded-lg w-full" />
            <div className="h-3 bg-gray-200 rounded-lg w-2/3" />
          </div>
          <div className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer h-64" />
          <div className="flex items-center gap-1 px-5 py-3 border-t border-gray-100 mt-3">
            <div className="h-8 bg-gray-200 rounded-xl w-20" />
            <div className="h-8 bg-gray-200 rounded-xl w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonDocument({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-5 bg-white rounded-2xl shadow-card p-5 animate-pulse">
          <div className="w-12 h-12 bg-gray-200 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded-lg w-1/3" />
            <div className="flex gap-2">
              <div className="h-4 bg-gray-200 rounded-full w-16" />
              <div className="h-4 bg-gray-200 rounded-full w-12" />
            </div>
          </div>
          <div className="w-28 h-10 bg-gray-200 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="section-container py-12">
        <div className="animate-pulse space-y-8">
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded-lg w-64" />
            <div className="h-4 bg-gray-100 rounded-lg w-96" />
          </div>
          <div className="h-16 bg-gray-100 rounded-2xl" />
          <SkeletonGrid count={6} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-5">
        <div className="w-24 h-24 bg-gray-200 rounded-full" />
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded-lg w-48" />
          <div className="h-4 bg-gray-200 rounded-lg w-32" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="h-20 bg-gray-200 rounded-xl" />
        <div className="h-20 bg-gray-200 rounded-xl" />
        <div className="h-20 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}
