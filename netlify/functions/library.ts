import type { Config } from "@netlify/functions";
import { ownedGamesUrl } from "../lib/steam";
import { SteamOwnedGamesResponse, GameSummary } from "../../shared/types";

export default async (req:Request) => {

  try {
      const response = await fetch(ownedGamesUrl());

      if (!response.ok) {
        return Response.json(
          { error: `Steam respondió ${response.status}` },
          { status: 502 }
        );
      }

      const data = (await response.json()) as SteamOwnedGamesResponse
      const games = data.response?.games;

      if (!games) {
        return
      }

      const library: GameSummary[] = games
      .filter(g => g.has_community_visible_stats)
      .map(g => ({
        appid: g.appid,
        name: g.name,
        coverUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
      }))
      .sort((a,b) => a.name.localeCompare(b.name));

      return Response.json(library);
  } catch (e) {
    console.error(e);
    return Response.json({error: "Error consultando libreria de SteamAPI"}, {status: 500})
  }

 
}

export const  config : Config =  {
  path: "/api/library",
  method: ["GET"]
};