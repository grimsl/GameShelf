/**
 * Consolidated Type Definitions - Single Source of Truth
 * All types should be imported from here to ensure consistency
 */

// Game Status
export type GameStatus = 'playing' | 'finished' | 'paused' | 'dropped' | 'planning';

// ============================================================================
// GAME TYPES - Consolidated from GraphQL Game model
// ============================================================================
export interface Game {
  id: string;
  title: string;
  cover?: string;
  description?: string;
  steamAppId?: number;
  steamName?: string;
  steamIconUrl?: string;
  steamLogoUrl?: string;
  steamHeaderUrl?: string;
  steamHasStats?: boolean;
  genre?: string;
  platform?: string;
  releaseYear?: number;
  developer?: string;
  publisher?: string;
  // Additional metadata not in GraphQL but used in frontend
  metacriticScore?: number;
  releaseDate?: string;
}

// ============================================================================
// STEAM TYPES - Consolidated from GraphQL SteamGame customType
// ============================================================================
/**
 * SteamGame - Represents a game from Steam API
 * Field names match GraphQL SteamGame customType (camelCase)
 */
export interface SteamGame {
  appId: number; // Always camelCase to match GraphQL
  name: string;
  playtimeTotal: number; // Playtime in minutes
  playtimeRecent: number; // Recent playtime in minutes
  iconUrl: string;
  logoUrl: string;
  hasStats: boolean;
  lastPlayed: number | null; // Unix timestamp
  playtimeWindows?: number;
  playtimeMac?: number;
  playtimeLinux?: number;
}

/**
 * SteamGameDisplay - Extended version for UI display with additional fields
 * Used when combining SteamGame with LibraryEntry data
 */
export interface SteamGameDisplay extends SteamGame {
  // Additional fields for display
  header_image?: string; // Alternative to logoUrl for display
  capsule_image?: string; // Alternative to logoUrl for display
  steamPlaytimeTotal?: number; // Alias for playtimeTotal (for compatibility)
  steamPlaytimeRecent?: number; // Alias for playtimeRecent (for compatibility)
  steamLastPlayed?: string; // ISO date string for display
  status?: GameStatus;
  rating?: number;
  notes?: string;
  hoursPlayed?: number; // Calculated from playtimeTotal (minutes to hours)
}

/**
 * SteamLibraryEntry - Raw format from Steam API (snake_case)
 * Used for API responses before transformation
 */
export interface SteamLibraryEntry {
  appid: number;
  name: string;
  playtime_forever: number;
  playtime_2weeks?: number;
  img_icon_url: string;
  img_logo_url: string;
  has_community_visible_stats: boolean;
  playtime_windows_forever: number;
  playtime_mac_forever: number;
  playtime_linux_forever: number;
  rtime_last_played: number;
  playtime_disconnected: number;
}

/**
 * SteamAchievement - From GraphQL SteamAchievement customType
 */
export interface SteamAchievement {
  id?: string; // Generated for frontend use
  apiName: string;
  achieved: boolean;
  unlockTime: number; // Unix timestamp
  name: string;
  description: string;
  // Additional fields for display
  game?: string;
  gameIcon?: string;
  unlockedAt?: string; // ISO date string for display
}

/**
 * SteamProfile - From GraphQL SteamProfile customType
 */
export interface SteamProfile {
  steamId: string;
  personaName: string;
  profileUrl: string;
  avatar: string;
  avatarMedium: string;
  avatarFull: string;
  personState?: number;
  communityVisibilityState?: number;
  profileState?: number;
  lastLogoff?: number;
  commentPermission?: number;
  realName?: string;
  primaryClanId?: string;
  timeCreated?: number;
  gameId?: string;
  gameServerIp?: string;
  gameExtraInfo?: string;
  cityId?: number;
  locCountryCode?: string;
  locStateCode?: string;
  locCityId?: number;
}

/**
 * SteamActivity - For recent activity feed
 */
export interface SteamActivity {
  id: string;
  action: 'played' | 'finished' | 'started' | 'rated';
  game: string;
  gameCover?: string;
  rating?: number;
  timestamp: string;
  hoursPlayed?: number;
  recentHours?: number;
}


/**
 * LibraryEntry - Represents a user's game library entry
 * Matches GraphQL LibraryEntry model structure
 */
export interface LibraryEntry {
  id: string;
  userId: string;
  gameId: string;
  status: GameStatus;
  rating?: number;
  notes?: string;
  // Denormalized game data (for performance and backward compatibility)
  gameTitle?: string;
  gameCover?: string;
  createdAt?: string;
  updatedAt?: string;
  // Steam-specific fields (playtime in minutes)
  steamPlaytimeTotal?: number;
  steamPlaytimeRecent?: number;
  steamLastPlayed?: string; // ISO date string
  steamAchievements?: SteamAchievement[];
  steamSyncDate?: string;
  isFromSteam?: boolean;
  // Relationships (populated when using GraphQL queries with relationships)
  game?: Game;
  user?: User;
}

/**
 * LibraryEntryDisplay - Extended version for UI display
 * Combines LibraryEntry with Game data for complete display
 */
export interface LibraryEntryDisplay extends LibraryEntry {
  // Additional computed fields for display
  hoursPlayed?: number; // Calculated from steamPlaytimeTotal
  // Ensure game data is available
  game?: Game;
}

// ============================================================================
// USER TYPES
// ============================================================================
export interface User {
  id: string;
  userHandle: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  // Steam integration fields
  steamId?: string;
  steamProfileUrl?: string;
  steamPersonaName?: string;
  steamAvatarUrl?: string;
  steamConnected?: boolean;
  steamConnectedAt?: string;
}

// ============================================================================
// STATS TYPES
// ============================================================================
export interface GameStats {
  totalGames: number;
  playing: number;
  finished: number;
  paused: number;
  dropped: number;
  planning: number;
  averageRating: number;
  totalHoursPlayed: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================
export interface SteamGamesResponse {
  gameCount: number;
  games: SteamGame[];
}

export interface SteamAchievementsResponse {
  steamId: string;
  gameName: string;
  achievements: SteamAchievement[];
}

export interface SteamApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// STORE/GAME DATABASE TYPES (for Steam Store API)
// ============================================================================
export interface GameDatabaseEntry {
  appid: number;
  name: string;
  header_image: string;
  capsule_image: string;
  short_description?: string;
  genres?: string[];
  developers?: string[];
  publishers?: string[];
  release_date?: string;
  price_overview?: {
    currency: string;
    initial: number;
    final: number;
    discount_percent: number;
    initial_formatted: string;
    final_formatted: string;
  };
  metacritic_score?: number;
  is_free: boolean;
  platforms?: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  categories?: string[];
  screenshots?: string[];
  last_updated: number;
  player_count?: {
    current: number;
    peak_24h: number;
    all_time_peak: number;
  };
}

export interface GameSearchResult {
  games: GameDatabaseEntry[];
  total: number;
}