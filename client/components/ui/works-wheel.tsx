"use client";

// A portfolio index built as a wheel you turn.
//
// At rest the work sits in a ring around a title, each card tangent to the
// circle. The first notch of scroll blows the ring open into a vertical drum:
// the card at the front lies flat and full size, the ones above and below
// rotate away into hard perspective and run off the top and bottom of the
// frame. Keep turning and the drum carries the next piece round to the front.
//
// The whole thing is one number - `turn` - read by a single rAF pass that writes
// transforms straight to the DOM. 0 is the ring, 1 is the drum with item 0 at
// the front, and every whole number after that is one more item turned past.
import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface WorksWheelItem {
  /** Project/Thought title. Shown beside the front card and in the index. */
  title: string;
  /** Cover art or screenshot. Any src an <img> takes. */
  image: string;
  /** Where the card links to. Omit for a wheel that only browses. */
  href?: string;
  /** Optional summary or excerpt */
  summary?: string;
}

export interface WorksWheelProps extends Omit<
  React.ComponentPropsWithoutRef<"section">,
  "children"
> {
  items: WorksWheelItem[];
  /** Sits in the middle of the ring. @default "Thoughts '26" */
  label?: string;
  /** Label on the card's hover affordance. Omit to drop it. @default "Read" */
  action?: string;
}

/* Geometry. The card is measured against the stage; everything else is measured
   against the card, so a narrow stage - where the card is capped by width, not
   height - scales the whole wheel down with it instead of leaving a small card
   swinging on a huge drum. */
const CARD_H = 0.38; // front card height, of the stage
const CARD_MAX_W = 0.34; // ... but never wider than this much of the stage
const CARD_RATIO = 1.45; // card width / height
const STEP = 40; // degrees between cards on the drum
const DRUM = 2.22; // drum radius, in card heights
const LENS = 2.7; // perspective distance
const RING_R = 1.14; // ring radius
const BOW = 1.82;
const TITLE = 0.124; // ring label and front-card title
const INDEX = 0.04; // the index down the right-hand side
const CULL = 1.6;

const WHEEL_UNITS = 900;
const DRAG_UNITS = 420;
const SETTLE = 140;
const EASE = 0.12;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Stage = { w: number; h: number };

const rad = (deg: number) => (deg * Math.PI) / 180;

const bowAt = (drumDeg: number, bow: number) =>
  -bow * (1 - Math.cos(rad(drumDeg)));

function place(
  ringDeg: number,
  drumDeg: number,
  ringR: number,
  drumR: number,
  bow: number,
  m: number,
) {
  return (
    `translateX(${m * bowAt(drumDeg, bow)}px)` +
    ` rotateZ(${(1 - m) * ringDeg}deg) translateY(${-(1 - m) * ringR}px)` +
    ` rotateX(${m * drumDeg}deg) translateZ(${m * drumR}px)`
  );
}

export function WorksWheel({
  items,
  label = "Thoughts '26",
  action = "Read",
  className,
  ...props
}: WorksWheelProps) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const wheelRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLElement | null)[]>([]);
  const labelRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLDivElement>(null);

  const turn = React.useRef(0);
  const target = React.useRef(0);
  const [active, setActive] = React.useState(0);
  const [stage, setStage] = React.useState<Stage>({ w: 0, h: 0 });

  const count = items.length;
  const last = Math.max(count - 1, 0);

  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const read = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const metrics = React.useMemo(() => {
    const { w, h } = stage;
    const cardW = Math.min(h * CARD_H * CARD_RATIO, w * CARD_MAX_W);
    const cardH = cardW / CARD_RATIO;
    const drumR = cardH * DRUM;
    const ringR = cardH * RING_R;
    const ringScale = count
      ? clamp((((2 * Math.PI * ringR) / count) * 0.82) / (cardW || 1), 0.16, 1)
      : 1;
    return {
      cardW,
      cardH,
      ringR,
      ringScale,
      drumR,
      bow: cardH * BOW,
      depth: cardH * LENS,
      title: cardH * TITLE,
      index: cardH * INDEX,
    };
  }, [stage, count]);

  React.useEffect(() => {
    if (!stage.h) return;
    let frame = 0;
    const { ringR, ringScale, drumR, bow } = metrics;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      const gap = target.current - turn.current;
      if (Math.abs(gap) < 0.0005) turn.current = target.current;
      else turn.current += gap * (reduced ? 1 : EASE);

      const t = turn.current;
      const m = clamp(t, 0, 1);
      const pos = Math.max(0, t - 1);

      if (wheelRef.current) {
        wheelRef.current.style.transform = `translateZ(${-m * drumR}px)`;
      }

      for (let i = 0; i < count; i++) {
        const d = i - pos;
        const drumDeg = d * STEP;
        const card = cardRefs.current[i];
        if (card) {
          card.style.transform = place(
            d * (360 / count),
            drumDeg,
            ringR,
            drumR,
            bow,
            m,
          );
          card.style.opacity = m > 0.5 && Math.abs(d) > CULL ? "0" : "1";
          card.style.zIndex = String(Math.round(100 - Math.abs(d) * 2));
        }
        const face = card?.firstElementChild as HTMLElement | null;
        if (face) face.style.transform = `scale(${lerp(ringScale, 1, m)})`;
      }

      if (labelRef.current) labelRef.current.style.opacity = String(1 - m);
      if (titleRef.current) titleRef.current.style.opacity = String(m);
      const near = clamp(Math.round(pos), 0, last);
      setActive((prev) => (prev === near ? prev : near));
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [metrics, stage.h, count, last, reduced]);

  const to = React.useCallback(
    (next: number) => {
      target.current = clamp(next, 0, last + 1);
    },
    [last],
  );

  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      const next = target.current + event.deltaY / WHEEL_UNITS;
      if (next > 0 && next < last + 1) event.preventDefault();
      to(next);
      window.clearTimeout(settling.current);
      settling.current = window.setTimeout(
        () => to(Math.round(target.current)),
        SETTLE,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(settling.current);
    };
  }, [to, last]);

  const drag = React.useRef<number | null>(null);
  const settling = React.useRef(0);

  return (
    <section
      aria-label={label}
      data-lenis-prevent="true"
      className={cn(
        "relative h-full min-h-[30rem] w-full overflow-hidden select-none bg-black text-white",
        className,
      )}
      {...props}
    >
      <div
        ref={stageRef}
        tabIndex={0}
        role="listbox"
        aria-label={label}
        aria-activedescendant={`works-wheel-${active}`}
        className="focus-visible:outline-red-300 absolute inset-0 cursor-grab touch-pan-x outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 active:cursor-grabbing"
        style={{ perspective: `${metrics.depth}px` }}
        onPointerDown={(event) => {
          drag.current = event.clientY;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (drag.current === null) return;
          to(target.current + (drag.current - event.clientY) / DRAG_UNITS);
          drag.current = event.clientY;
        }}
        onPointerUp={() => {
          drag.current = null;
          if (target.current > 1) to(Math.round(target.current));
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") to(Math.round(target.current) + 1);
          else if (event.key === "ArrowUp") to(Math.round(target.current) - 1);
          else return;
          event.preventDefault();
        }}
      >
        <div
          ref={wheelRef}
          className="absolute top-1/2 left-1/2 [transform-style:preserve-3d]"
        >
          {items.map((item, i) => {
            const hasLink = Boolean(item.href);
            return (
              <React.Fragment key={`${item.title}-${i}`}>
                {hasLink ? (
                  <Link
                    id={`works-wheel-${i}`}
                    role="option"
                    aria-selected={i === active}
                    href={item.href!}
                    ref={(node: HTMLAnchorElement | null) => {
                      cardRefs.current[i] = node;
                    }}
                    className="group absolute [backface-visibility:hidden] cursor-pointer"
                    style={{
                      width: metrics.cardW,
                      height: metrics.cardH,
                      marginLeft: -metrics.cardW / 2,
                      marginTop: -metrics.cardH / 2,
                    }}
                  >
                    <span className="bg-[#0c0c12] border border-white/10 group-hover:border-red-300/40 relative block size-full overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-colors duration-300">
                      <img
                        src={item.image}
                        alt={item.title}
                        draggable={false}
                        className="size-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-90 group-hover:brightness-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                      {action ? (
                        <span className="bg-black/80 text-white border border-white/20 pointer-events-none absolute right-4 bottom-4 flex translate-y-1 items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.75rem] font-mono uppercase tracking-wider opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-hover:bg-red-300 group-hover:text-black font-bold">
                          <svg
                            viewBox="0 0 12 12"
                            className="size-3"
                            aria-hidden="true"
                          >
                            <path
                              d="M3 9 9 3M4 3h5v5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {action}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                ) : (
                  <div
                    id={`works-wheel-${i}`}
                    role="option"
                    aria-selected={i === active}
                    ref={(node: HTMLDivElement | null) => {
                      cardRefs.current[i] = node;
                    }}
                    className="group absolute [backface-visibility:hidden]"
                    style={{
                      width: metrics.cardW,
                      height: metrics.cardH,
                      marginLeft: -metrics.cardW / 2,
                      marginTop: -metrics.cardH / 2,
                    }}
                  >
                    <span className="bg-[#0c0c12] border border-white/10 relative block size-full overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                      <img
                        src={item.image}
                        alt={item.title}
                        draggable={false}
                        className="size-full object-cover brightness-90"
                      />
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Ring title and front-card title trade places across the transition */}
      <div
        ref={labelRef}
        className="pointer-events-none absolute inset-0 grid place-items-center tracking-tight font-black uppercase text-white/90 font-mono"
        style={{ fontSize: Math.max(28, metrics.title) }}
      >
        <span className="drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
          {label}
        </span>
      </div>

      <div
        ref={titleRef}
        className="pointer-events-none absolute top-1/2 left-[5%] md:left-[8%] -translate-y-1/2 max-w-[85%] md:max-w-[42%] tracking-tight opacity-0 space-y-2 z-20"
      >
        <span className="text-[11px] font-mono text-red-300 uppercase tracking-widest block font-bold">
          // FEATURED DOSSIER #{active + 1}
        </span>
        <h3
          className="font-black uppercase text-white leading-[1.08] line-clamp-3 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
          style={{ fontSize: Math.min(36, Math.max(20, metrics.title * 0.85)) }}
        >
          {items[active]?.title}
        </h3>
        {items[active]?.summary && (
          <p className="text-xs md:text-sm text-white/60 line-clamp-2 font-sans font-normal leading-relaxed">
            {items[active]?.summary}
          </p>
        )}
      </div>

      <ol
        className="text-white/40 absolute top-[6%] md:top-[8%] right-[3%] md:right-[5%] text-right leading-[1.8] font-mono max-w-[220px] md:max-w-[320px] z-20 hidden sm:block"
        style={{ fontSize: Math.max(11, metrics.index) }}
      >
        {items.map((item, i) => (
          <li key={`${item.title}-${i}`} className="truncate">
            <button
              type="button"
              onClick={() => to(i + 1)}
              className={cn(
                "cursor-pointer transition-colors outline-none hover:text-white/80 truncate max-w-full text-right",
                i === active
                  ? "text-red-300 font-bold tracking-wide"
                  : "text-white/40",
              )}
            >
              <span className="text-[10px] opacity-50 mr-2">{String(i + 1).padStart(2, "0")}.</span>
              {item.title}
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default WorksWheel;
