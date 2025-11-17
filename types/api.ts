// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SteamApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

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
    final: number;
    final_formatted: string;
    initial_formatted?: string;
    discount_percent?: number;
  };
  metacritic_score?: number;
  is_free?: boolean;
  platforms?: string[];
  player_count?: {
    current: number;
    peak_24h: number;
    peak_all_time: number;
  };
}

export interface GameSearchResult {
  games: GameDatabaseEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface FilterOptions {
  search: string;
  genre: string;
  priceRange: string;
  sortBy: string;
  viewMode: 'grid' | 'list';
}
