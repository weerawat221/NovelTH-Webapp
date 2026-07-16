export default function NovelCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] md:w-[calc(20%-10px)] lg:w-[calc(16.666%-10px)]">
      {/* Cover */}
      <div className="aspect-[2/3] rounded-xl skeleton" />
      {/* Title */}
      <div className="mt-2 mx-1 h-4 w-3/4 rounded skeleton" />
      {/* Author */}
      <div className="mt-1.5 mx-1 h-3 w-1/2 rounded skeleton" />
    </div>
  );
}

export function NovelSectionSkeleton() {
  return (
    <section className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="h-6 w-40 rounded skeleton mb-4" />
        {/* Cards */}
        <div className="flex gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <NovelCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
