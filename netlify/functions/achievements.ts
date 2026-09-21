import type { Config } from "@netlify/functions";
import type { AchievementProgress, SteamPlayerAchievementsResponse } from "../../shared/types";
import { achievementsUrl } from "../lib/steam";

export default async (req:Request) => {
  const appid = Number(new URL(req.url).searchParams.get("appid"));
  if (!Number.isInteger(appid) || appid <= 0) {
    return Response.json({ error: "Parámetro appid inválido" }, { status: 400 });
  }

  try {
    const response = await fetch(achievementsUrl(appid))

    if (!response.ok) {
      return Response.json(
        { error: `Steam respondió ${response.status}` },
        { status: 502 }
      );
    }

    const achievementData = (await response.json()) as SteamPlayerAchievementsResponse;
    const stats = achievementData.playerstats;

    if (!stats?.success || !stats.achievements?.length) {
      return Response.json(
        { error: "Sin logros disponibles. ¿Perfil público? ¿El juego tiene logros?" },
        { status: 404 }
      );
    }

    const total = stats.achievements.length;
    const unlocked = stats.achievements.filter(a => a.achieved === 1).length;

    const progress: AchievementProgress = {
      appid,
      gameName: stats.gameName ?? "",
      unlocked,
      total,
      percent: Math.round((unlocked / total) * 100),
    };

    return Response.json(progress);

  } catch (e) {
    console.error(e);
    return Response.json({ error: "Error consultando logros de Steam" }, { status: 500 });
  }
}

export const  config : Config =  {
  path: "/api/achievements",
  method: ["GET"]
};