export default function GalleryItem({ image, onClick }) {
  return (
    <button
      onClick={() => onClick?.(image)}
      className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <img
        src={image.thumbnail || image.url}
        alt={image.filename}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
    </button>
  )
}
