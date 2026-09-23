export interface AchievementProgress {
  appid: number;
  gameName: string;
  unlocked: number;
  total: number;
  percent: number;
  demo?: boolean;
}

export interface SteamOwnedGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
  playtime_windows_forever: number;
  playtime_mac_forever: number;
  playtime_linux_forever: number;
  playtime_deck_forever: number;
  playtime_disconnected: number;
  rtime_last_played: number;

  playtime_2weeks?: number;
  has_community_visible_stats?: boolean;
  has_leaderboards?: boolean;
  content_descriptorids?: number[];
}

export interface SteamOwnedGamesResponse {
  response: {
    game_count?: number;
    games?: SteamOwnedGame[];
  };
}

export interface GameSummary {
  appid: number;
  name: string;
  coverUrl: string;
}

export interface SteamAchievement {
  apiname: string;
  achieved: 0 | 1;
  unlocktime: number;
  name?: string;
  description?: string;
}

export interface SteamPlayerAchievementsResponse {
  playerstats: {
    steamID?: string;
    gameName?: string;
    achievements?: SteamAchievement[];
    success: boolean;
    error?: string;
  };
}