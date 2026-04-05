"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRef, useCallback, useState, useEffect, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";
import { DASHBOARD_JOURNAL_SECTIONS } from "@/constants/dashboard-journals";
import type {
  JournalPromptBadge,
  JournalPromptItem,
  JournalPromptSection,
} from "@/types/dashboard-journals";

export type { JournalPromptBadge, JournalPromptItem, JournalPromptSection };

const CARD_DOM_ID = (id: string) => `journal-card-${id}`;
const MAX_VISIBLE = 4;
const CARD_WIDTH_PX = 260;
const KNOWING_YOUR_NEEDS_ID = "knowing-your-needs";

function gapPx(): number {
  if (typeof window === "undefined") return 24;
  return window.matchMedia("(min-width: 768px)").matches ? 24 : 16;
}

function computeVisibleCount(
  availableWidth: number,
  itemCount: number,
  gap: number
): number {
  let v = Math.min(MAX_VISIBLE, Math.max(1, itemCount));
  while (v > 1 && v * CARD_WIDTH_PX + (v - 1) * gap > availableWidth) {
    v -= 1;
  }
  return v;
}

const MAX_SECTION_ITEM_COUNT = Math.max(
  ...DASHBOARD_JOURNAL_SECTIONS.map((s) => s.items.length)
);

export default function DashboardJournalsCarousel() {
  const navMeasureRef = useRef<HTMLDivElement>(null);
  const [navViewportWidth, setNavViewportWidth] = useState(CARD_WIDTH_PX);

  const updateNavLayout = useCallback(() => {
    const el = navMeasureRef.current;
    if (!el) return;
    const g = gapPx();
    const available = el.clientWidth;
    const v = computeVisibleCount(available, MAX_SECTION_ITEM_COUNT, g);
    const vw = v * CARD_WIDTH_PX + Math.max(0, v - 1) * g;
    setNavViewportWidth(Math.min(vw, available));
  }, []);

  useLayoutEffect(() => {
    updateNavLayout();
  }, [updateNavLayout]);

  useEffect(() => {
    const el = navMeasureRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateNavLayout());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateNavLayout]);

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-8 overflow-y-auto pt-2">
      <div ref={navMeasureRef} className="w-full shrink-0">
        <nav
          className="mx-auto flex shrink-0 gap-6 text-sm font-medium"
          style={{ width: navViewportWidth }}
          aria-label="Journal resources"
        >
          <span className="border-b-2 border-teal pb-1 text-text">Journals</span>
          <span className="cursor-default pb-1 text-text-muted">Prompts</span>
          <span className="cursor-default pb-1 text-text-muted">Saved</span>
        </nav>
      </div>

      {DASHBOARD_JOURNAL_SECTIONS.map((section, i) => (
        <CarouselSection key={section.title + i} section={section} />
      ))}
    </div>
  );
}

function CarouselSection({ section }: { section: JournalPromptSection }) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(1);
  const [viewportWidth, setViewportWidth] = useState(CARD_WIDTH_PX);
  const [gap, setGap] = useState(24);

  const itemCount = section.items.length;
  const maxStart = Math.max(0, itemCount - visibleCount);
  const cardStep = CARD_WIDTH_PX + gap;

  const updateLayout = useCallback(() => {
    const el = measureRef.current;
    if (!el) return;
    const g = gapPx();
    setGap(g);
    const available = el.clientWidth;
    const v = computeVisibleCount(available, itemCount, g);
    setVisibleCount(v);
    const vw = v * CARD_WIDTH_PX + Math.max(0, v - 1) * g;
    setViewportWidth(Math.min(vw, available));
  }, [itemCount]);

  useLayoutEffect(() => {
    updateLayout();
  }, [updateLayout]);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateLayout());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateLayout]);

  useEffect(() => {
    setStartIndex((s) => Math.min(s, maxStart));
  }, [maxStart]);

  const goLeft = () => setStartIndex((s) => Math.max(0, s - 1));
  const goRight = () =>
    setStartIndex((s) => Math.min(maxStart, s + 1));

  const atStart = startIndex <= 0;
  const atEnd = startIndex >= maxStart;

  return (
    <div ref={measureRef} className="w-full shrink-0">
      <div className="mx-auto space-y-3" style={{ width: viewportWidth }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className="text-xs font-medium uppercase tracking-widest text-text-muted">
              {section.title}
            </h2>
            <p className="text-sm leading-snug text-text-muted">
              {section.subtitle}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={goLeft}
              disabled={atStart}
              aria-label="Show previous cards"
              aria-disabled={atStart}
              className="rounded-lg border border-border bg-card p-2 text-text transition-colors hover:bg-teal-light hover:text-teal-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={goRight}
              disabled={atEnd}
              aria-label="Show next cards"
              aria-disabled={atEnd}
              className="rounded-lg border border-border bg-card p-2 text-text transition-colors hover:bg-teal-light hover:text-teal-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <div
            className="flex will-change-transform transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(-${startIndex * cardStep}px)`,
              gap: `${gap}px`,
            }}
          >
            {section.items.map((item) => (
              <JournalPromptCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BadgeChip({ badge }: { badge: JournalPromptBadge }) {
  const styles: Record<JournalPromptBadge, string> = {
    recommended: "bg-lavender-light text-lavender ring-1 ring-lavender/30",
    new: "bg-teal-light text-teal-dark ring-1 ring-teal/25",
    popular: "border border-teal/35 bg-card text-teal-dark",
  };
  const labels: Record<JournalPromptBadge, string> = {
    recommended: "Recommended",
    new: "New",
    popular: "Popular",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        styles[badge]
      )}
    >
      {labels[badge]}
    </span>
  );
}

function JournalPromptCard({ item }: { item: JournalPromptItem }) {
  const cardClass = cn(
    "relative flex shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-border bg-card p-4 text-center shadow-sm transition-all duration-200",
    "motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg",
    "hover:border-teal/35 focus-within:ring-2 focus-within:ring-teal",
    item.badge === "recommended" && "ring-2 ring-teal/35"
  );
  const cardStyle = { width: CARD_WIDTH_PX, height: CARD_WIDTH_PX };

  const inner = (
    <>
      {item.badge && (
        <div className="absolute right-2 top-2 max-w-[calc(100%-1rem)]">
          <BadgeChip badge={item.badge} />
        </div>
      )}

      <div
        className="mb-2 flex h-[6.5rem] w-[6.5rem] shrink-0 items-center justify-center rounded-full bg-teal-light/70 text-[2.75rem] leading-none sm:h-28 sm:w-28 sm:text-6xl"
        aria-hidden
      >
        {item.icon}
      </div>

      <h3 className="line-clamp-2 font-medium leading-snug text-text">
        {item.title}
      </h3>
      {item.subtitle.trim() !== "" && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-text-muted">
          {item.subtitle}
        </p>
      )}
    </>
  );

  if (item.id === KNOWING_YOUR_NEEDS_ID) {
    return (
      <Link
        id={CARD_DOM_ID(item.id)}
        href="/journal/prompts/knowing-your-needs"
        className={cardClass}
        style={cardStyle}
        aria-label={`Open guided flow: ${item.title}`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div id={CARD_DOM_ID(item.id)} style={cardStyle} className={cardClass}>
      {inner}
    </div>
  );
}
