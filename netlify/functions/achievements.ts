import type { Config } from "@netlify/functions";
import type { AchievementProgress, SteamPlayerAchievementsResponse } from "../../shared/types";
import { achievementsUrl } from "../lib/steam";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "Netlify-CDN-Cache-Control": "no-store",
};

const DEMO_FALLBACK = { gameName: "Demo", total: 50, unlocked: 0 };

const clampInt = (n: number, min: number, max: number) =>
  Math.min(Math.max(Math.trunc(n), min), max);

type Progress = { gameName: string; unlocked: number; total: number };

function demoUnlocked(base: Progress, step: number, periodMs: number) {
  // Si ya estaban todos desbloqueados el demo no avanzaría nunca: parte de cero.
  const from = base.unlocked >= base.total ? 0 : base.unlocked;
  const steps = Math.ceil((base.total - from) / step);
  const tick = Math.floor(Date.now() / periodMs) % (steps + 1);
  return Math.min(from + tick * step, base.total);
}

const toProgress = (appid: number, p: Progress, demo?: boolean): AchievementProgress => ({
  appid,
  gameName: p.gameName,
  unlocked: p.unlocked,
  total: p.total,
  percent: Math.round((p.unlocked / p.total) * 100),
  ...(demo ? { demo: true } : {}),
});

export default async (req: Request) => {
  const url = new URL(req.url);
  const appid = Number(url.searchParams.get("appid"));
  const demo = url.searchParams.get("demo") === "1";

  if (!Number.isInteger(appid) || appid <= 0) {
    return Response.json({ error: "Parámetro appid inválido" }, { status: 400, headers: NO_STORE });
  }

  let real: Progress | null = null;
  let failure: { error: string; status: number } | null = null;

  try {
    const response = await fetch(achievementsUrl(appid));

    if (!response.ok) {
      failure = { error: `Steam respondió ${response.status}`, status: 502 };
    } else {
      const achievementData = (await response.json()) as SteamPlayerAchievementsResponse;
      const stats = achievementData.playerstats;

      if (!stats?.success || !stats.achievements?.length) {
        failure = {
          error: "Sin logros disponibles. ¿Perfil público? ¿El juego tiene logros?",
          status: 404,
        };
      } else {
        real = {
          gameName: stats.gameName ?? "",
          total: stats.achievements.length,
          unlocked: stats.achievements.filter(a => a.achieved === 1).length,
        };
      }
    }
  } catch (e) {
    console.error(e);
    failure = { error: "Error consultando logros de Steam", status: 500 };
  }

  if (!demo) {
    if (failure) {
      return Response.json({ error: failure.error }, { status: failure.status, headers: NO_STORE });
    }
    return Response.json(toProgress(appid, real!), { headers: NO_STORE });
  }

  const base = real ?? DEMO_FALLBACK;
  const step = clampInt(Number(url.searchParams.get("demoStep")) || 1, 1, base.total);
  const periodMs = clampInt(Number(url.searchParams.get("demoPeriod")) || 30, 1, 3600) * 1000;

  return Response.json(
    toProgress(appid, { ...base, unlocked: demoUnlocked(base, step, periodMs) }, true),
    { headers: NO_STORE }
  );
}

export const  config : Config =  {
  path: "/api/achievements",
  method: ["GET"]
};
