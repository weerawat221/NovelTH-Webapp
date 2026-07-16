"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/types/novel";

// ─── Mock banners (will be replaced by promotion table query) ───
const mockBanners: Banner[] = [
  {
    id: "1",
    title: "มนตราแห่งดวงดาว",
    subtitle: "เปิดประตูสู่โลกเวทมนตร์ที่คุณไม่เคยจินตนาการ",
    image_url: null,
    link: "/novel/1",
    gradient: "from-violet-600 via-purple-500 to-indigo-600",
  },
  {
    id: "2",
    title: "รักนี้ที่ปลายฟ้า",
    subtitle: "เรื่องราวรักโรแมนติกที่จะทำให้คุณหัวใจเต้นแรง",
    image_url: null,
    link: "/novel/2",
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
  },
  {
    id: "3",
    title: "คดีลับใต้เงาจันทร์",
    subtitle: "ปริศนาที่ซ่อนอยู่ในความมืด...คุณกล้าไขมันไหม?",
    image_url: null,
    link: "/novel/3",
    gradient: "from-slate-700 via-gray-600 to-zinc-700",
  },
  {
    id: "4",
    title: "เสียงกระซิบจากบ้านร้าง",
    subtitle: "เรื่องสยองที่จะทำให้คุณขนลุกตั้งแต่หน้าแรก",
    image_url: null,
    link: "/novel/4",
    gradient: "from-emerald-700 via-teal-600 to-cyan-700",
  },
  {
    id: "5",
    title: "วันพรุ่งนี้ยังมีเรา",
    subtitle: "นิยายดราม่าที่สะท้อนชีวิตจริงอย่างลึกซึ้ง",
    image_url: null,
    link: "/novel/5",
    gradient: "from-amber-500 via-orange-500 to-yellow-500",
  },
];

export default function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-play
  useEffect(() => {
    if (!emblaApi || isHovered) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [emblaApi, isHovered]);

  return (
    <section
      className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex">
          {mockBanners.map((banner) => (
            <div
              key={banner.id}
              className="flex-[0_0_100%] min-w-0 md:flex-[0_0_33.333%] px-1.5"
            >
              <a
                href={banner.link}
                className={`
                  block relative overflow-hidden rounded-xl
                  aspect-[16/9] md:aspect-[4/3]
                  bg-gradient-to-br ${banner.gradient}
                  group cursor-pointer
                `}
              >
                {/* Overlay content */}
                <div className="absolute inset-0 flex flex-col justify-end p-5 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                  <h3 className="text-white text-lg md:text-base font-bold drop-shadow-lg line-clamp-1">
                    {banner.title}
                  </h3>
                  <p className="text-white/80 text-sm mt-1 line-clamp-2 drop-shadow-md">
                    {banner.subtitle}
                  </p>
                </div>

                {/* Hover shine effect */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Prev / Next arrows (desktop hover) ─── */}
      <button
        onClick={scrollPrev}
        className={`
          absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10
          h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm
          text-white flex items-center justify-center
          hover:bg-black/60 transition-all duration-300
          ${isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90"}
          hidden md:flex
        `}
        aria-label="Previous"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={scrollNext}
        className={`
          absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10
          h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm
          text-white flex items-center justify-center
          hover:bg-black/60 transition-all duration-300
          ${isHovered ? "opacity-100 scale-100" : "opacity-0 scale-90"}
          hidden md:flex
        `}
        aria-label="Next"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* ─── Pagination dots ─── */}
      <div className="flex justify-center gap-1.5 mt-3">
        {mockBanners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => emblaApi?.scrollTo(idx)}
            className={`
              h-1.5 rounded-full transition-all duration-300
              ${
                idx === selectedIndex
                  ? "w-6 bg-accent"
                  : "w-1.5 bg-muted/40 hover:bg-muted"
              }
            `}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
