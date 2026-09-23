// src/pages/Overlay.tsx
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { AchievementProgress } from "../../shared/types";

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

const REQUEST_TIMEOUT_MS = 15_000;

export default function Overlay() {
  const [params] = useSearchParams();
  const appid = Number(params.get("appid"));
  const debug = params.get("debug") === "1";
  const demo = params.get("demo") === "1";
  const demoStep = clamp(Number(params.get("demoStep")) || 1, 1, 10_000);
  // En demo se permiten refrescos más rápidos para ver el avance al momento.
  const interval = clamp(Number(params.get("interval")) || 120, demo ? 5 : 30, 300);
  const appidValid = Number.isInteger(appid) && appid > 0;

  const [data, setData] = useState<AchievementProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastTry, setLastTry] = useState<Date | null>(null);
  const [pulse, setPulse] = useState(false);

  const prevUnlocked = useRef<number | null>(null);
  const pulseTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!appidValid) return;

    let cancelled = false;
    let nextTick: number | null = null;

    const schedule = () => {
      if (cancelled) return;
      if (nextTick !== null) clearTimeout(nextTick);
      nextTick = window.setTimeout(load, interval * 1000);
    };

    const load = async () => {
      if (cancelled) return;
      if (nextTick !== null) {
        clearTimeout(nextTick);
        nextTick = null;
      }

      try {
        // `demoPeriod` va igual al intervalo de poll para que cada refresco
        // avance exactamente `demoStep` logros.
        const demoQuery = demo ? `&demo=1&demoStep=${demoStep}&demoPeriod=${interval}` : "";
        const res = await fetch(`/api/achievements?appid=${appid}${demoQuery}&_t=${Date.now()}`, {
          cache: "no-store",
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        if (cancelled) return;
        setLastTry(new Date());

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          const detail = body && typeof body.error === "string" ? body.error : res.statusText;
          setError(`${res.status} · ${detail}`);
          return;
        }

        const next = (await res.json()) as AchievementProgress;
        if (cancelled) return;

        if (prevUnlocked.current !== null && next.unlocked > prevUnlocked.current) {
          setPulse(true);
          if (pulseTimer.current !== null) clearTimeout(pulseTimer.current);
          pulseTimer.current = window.setTimeout(() => setPulse(false), 2500);
        }
        prevUnlocked.current = next.unlocked;
        setData(next);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setLastTry(new Date());
        setError(e instanceof Error ? e.message : "Fallo de red");
      } finally {
        schedule();
      }
    };

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") void load();
    };

    void load();
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);

    return () => {
      cancelled = true;
      if (nextTick !== null) clearTimeout(nextTick);
      if (pulseTimer.current !== null) clearTimeout(pulseTimer.current);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
    };
  }, [appid, appidValid, interval, demo, demoStep]);

  if (!data) {
    if (!debug) return null;
    return (
      <div className="p-3">
        <div className="inline-flex w-[420px] flex-col gap-1 rounded-xl bg-black/80 p-3
                        text-white ring-1 ring-red-500/60">
          <span className="text-sm font-medium text-red-300">
            ⚠ {appidValid ? (error ?? "Cargando…") : "Falta el parámetro appid o no es válido"}
          </span>
          <span className="text-xs text-white/50">
            appid={appid || "—"} · cada {interval}s
            {lastTry && ` · último intento ${lastTry.toLocaleTimeString()}`}
          </span>
        </div>
      </div>
    );
  }

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
            <span className="flex min-w-0 items-baseline gap-1.5">
              <span className="truncate text-sm font-medium drop-shadow">
                {data.gameName}
              </span>
              {data.demo && (
                <span className="shrink-0 rounded bg-amber-400/20 px-1 py-0.5 text-[9px]
                                 font-bold tracking-wider text-amber-300 ring-1 ring-amber-400/40">
                  DEMO
                </span>
              )}
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

      {debug && (
        <div className="mt-1 text-[10px] text-white/40">
          cada {interval}s{lastTry && ` · ${lastTry.toLocaleTimeString()}`}
          {error && ` · ⚠ ${error}`}
        </div>
      )}
    </div>
  );
}
