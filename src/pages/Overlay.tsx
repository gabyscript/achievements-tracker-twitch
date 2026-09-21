// src/pages/Overlay.tsx
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { AchievementProgress } from "../../shared/types";

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

export default function Overlay() {
  const [params] = useSearchParams();
  const appid = Number(params.get("appid"));
  const interval = clamp(Number(params.get("interval")) || 60, 30, 300);

  const [data, setData] = useState<AchievementProgress | null>(null);
  const [pulse, setPulse] = useState(false);
  const prevUnlocked = useRef<number | null>(null);

  useEffect(() => {
    if (!Number.isInteger(appid) || appid <= 0) return;

    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/achievements?appid=${appid}`);
        if (!res.ok) return;
        const next = (await res.json()) as AchievementProgress;
        if (cancelled) return;

        if (prevUnlocked.current !== null && next.unlocked > prevUnlocked.current) {
          setPulse(true);
          setTimeout(() => setPulse(false), 2500);
        }
        prevUnlocked.current = next.unlocked;
        setData(next);
      } catch {
        /* mantiene el último dato bueno */
      }
    };

    load();
    const id = setInterval(load, interval * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [appid, interval]);

  if (!data) return null;

  return (
    <div className="p-3">
      <div
        className={`inline-flex w-[420px] items-center gap-3 rounded-xl bg-black/70 p-3
                    text-white ring-1 transition-all duration-500
                    ${pulse ? "ring-amber-400 ring-2" : "ring-white/10"}`}
      >
        <img
          src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${data.appid}/header.jpg`}
          alt=""
          className="h-14 w-14 shrink-0 rounded-lg object-cover"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-medium drop-shadow">
              {data.gameName}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-white/70">
              {data.unlocked}/{data.total}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-amber-400 transition-[width] duration-700 ease-out"
                style={{ width: `${data.percent}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-semibold tabular-nums">
              {data.percent}%
            </span>
          </div>
        </div>
      </div>
    </div>
    
  );
}