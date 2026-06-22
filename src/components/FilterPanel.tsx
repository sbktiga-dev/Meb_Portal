'use client';

interface FilterPanelProps {
  styles: string[];
  categories: string[];
  selectedStyle: string;
  selectedCategory: string;
  onStyleChange: (style: string) => void;
  onCategoryChange: (category: string) => void;
}

export default function FilterPanel({
  styles,
  categories,
  selectedStyle,
  selectedCategory,
  onStyleChange,
  onCategoryChange,
}: FilterPanelProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Стиль</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onStyleChange('')}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              selectedStyle === '' ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-300'
            }`}
          >
            Все
          </button>
          {styles.map((style) => (
            <button
              key={style}
              onClick={() => onStyleChange(style)}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                selectedStyle === style ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-300'
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Категория</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCategoryChange('')}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              selectedCategory === '' ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-300'
            }`}
          >
            Все
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                selectedCategory === cat ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
