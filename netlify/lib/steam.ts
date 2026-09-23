const BASE = "https://api.steampowered.com";

const key = () => {
  const k = process.env.STEAM_API_KEY;
  if (!k) throw new Error("Falta STEAM_API_KEY");
  return k;
};

const steamId = () => {
  const id = process.env.STEAM_ID;
  if (!id) throw new Error("Falta STEAM_ID");
  return id;
};

export function ownedGamesUrl() {
  const params = new URLSearchParams({
    key: key(),
    steamid: steamId(),
    include_appinfo: "1",
    format: "json",
  });
  return `${BASE}/IPlayerService/GetOwnedGames/v0001/?${params}`;
}

export function achievementsUrl(appId: number) {
  const params = new URLSearchParams({
    key: key(),
    steamid: steamId(),
    appid: String(appId),
    format: "json",
    _t: String(Date.now()),
  });
  return `${BASE}/ISteamUserStats/GetPlayerAchievements/v0001/?${params}`;
}