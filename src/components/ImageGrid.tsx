import ImageCard from './ImageCard';

interface ImageGridProps {
  images: {
    id: string;
    title: string;
    style: string | null;
    category: string | null;
    thumbnail: string | null;
    downloads: number;
  }[];
}

export default function ImageGrid({ images }: ImageGridProps) {
  if (images.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🖼️</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Изображения не найдены</h3>
        <p className="text-gray-500">Попробуйте изменить параметры поиска или фильтры</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {images.map((image) => (
        <ImageCard key={image.id} {...image} />
      ))}
    </div>
  );
}
