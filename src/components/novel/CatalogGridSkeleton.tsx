export default function CatalogGridSkeleton({
  count = 12,
}: {
  count?: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {/* Cover */}
          <div className="aspect-[2/3] rounded-lg skeleton" />
          {/* Title line 1 */}
          <div className="mt-2 h-4 w-4/5 rounded skeleton" />
          {/* Title line 2 */}
          <div className="mt-1 h-4 w-3/5 rounded skeleton" />
        </div>
      ))}
    </div>
  );
}
