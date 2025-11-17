// Legacy import removed - using Amplify backend now

// Define SteamAppDetails type locally
export interface SteamAppDetails {
  appid: number;
  name: string;
  type: string;
  is_free: boolean;
  detailed_description: string;
  short_description: string;
  supported_languages: string;
  header_image: string;
  capsule_image: string;
  capsule_imagev5: string;
  website: string;
  pc_requirements: any;
  mac_requirements: any;
  linux_requirements: any;
  developers: string[];
  publishers: string[];
  price_overview?: {
    currency: string;
    initial: number;
    final: number;
    discount_percent: number;
    initial_formatted: string;
    final_formatted: string;
  };
  platforms: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  categories: Array<{
    id: number;
    description: string;
  }>;
  genres: Array<{
    id: string;
    description: string;
  }>;
  screenshots: Array<{
    id: number;
    path_thumbnail: string;
    path_full: string;
  }>;
  movies: Array<{
    id: number;
    name: string;
    thumbnail: string;
    webm: {
      480: string;
      max: string;
    };
    mp4: {
      480: string;
      max: string;
    };
    highlight: boolean;
  }>;
  recommendations: {
    total: number;
  };
  release_date: {
    coming_soon: boolean;
    date: string;
  };
  metacritic?: {
    score: number;
    url: string;
  };
}

export interface GameDatabaseEntry {
  appid: number;
  name: string;
  header_image: string;
  capsule_image: string;
  short_description: string;
  genres: string[];
  developers: string[];
  publishers: string[];
  release_date: string;
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
  platforms: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  categories: string[];
  screenshots: string[];
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
  page: number;
  limit: number;
}

export interface TrendingGamesData {
  games: GameDatabaseEntry[];
  last_updated: number;
  period: 'daily' | 'weekly' | 'monthly';
}

class GameDatabase {
  private readonly CACHE_KEYS = {
    TRENDING_GAMES: 'gameshelf-trending-games',
    GAME_DETAILS: 'gameshelf-game-details',
    SEARCH_RESULTS: 'gameshelf-search-results',
    GENRE_GAMES: 'gameshelf-genre-games'
  };

  private readonly CACHE_DURATION = {
    TRENDING: 6 * 60 * 60 * 1000, // 6 hours
    GAME_DETAILS: 24 * 60 * 60 * 1000, // 24 hours
    SEARCH: 60 * 60 * 1000, // 1 hour
    GENRE: 12 * 60 * 60 * 1000 // 12 hours
  };

  /**
   * Get trending games with caching
   */
  async getTrendingGames(limit: number = 10, forceRefresh: boolean = false): Promise<GameDatabaseEntry[]> {
    const cacheKey = `${this.CACHE_KEYS.TRENDING_GAMES}-${limit}`;
    
    if (!forceRefresh) {
      const cached = this.getCachedData(cacheKey, this.CACHE_DURATION.TRENDING);
      if (cached) {
        return cached;
      }
    }

    try {
      // Get trending games from Steam API
      const response = await fetch('https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/?key=0A9AA439C9DD9FA5A8F37B09461D87AA&format=json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.response || !data.response.ranks) {
        throw new Error('Invalid response format from Steam API');
      }

      const trendingGames = data.response.ranks.slice(0, limit).map((game: any) => ({
        appid: game.appid,
        name: game.name,
        header_image: `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
        capsule_image: `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/capsule_184x69.jpg`,
        short_description: '',
        genres: [],
        developers: [],
        publishers: [],
        release_date: '',
        is_free: false,
        platforms: { windows: true, mac: false, linux: false },
        categories: [],
        screenshots: [],
        last_updated: Date.now(),
        player_count: {
          current: game.peak_in_game || 0,
          peak_24h: game.peak_in_game || 0,
          all_time_peak: game.peak_in_game || 0
        }
      }));

      const games = await this.enrichGameData(trendingGames);
      this.cacheData(cacheKey, games);
      
      return games;
    } catch (error) {
      console.error('Error fetching trending games:', error);
      
      // Return cached data if available, even if expired
      const cached = this.getCachedData(cacheKey, Infinity);
      if (cached) {
        return cached;
      }
      
      // Return empty array if no cached data
      return [];
    }
  }

  /**
   * Search games with caching
   */
  async searchGames(query: string, limit: number = 20, page: number = 1): Promise<GameSearchResult> {
    const cacheKey = `${this.CACHE_KEYS.SEARCH_RESULTS}-${query}-${limit}-${page}`;
    
    const cached = this.getCachedData(cacheKey, this.CACHE_DURATION.SEARCH);
    if (cached) {
      return cached;
    }

    try {
      // Search games using Steam Store API
      const response = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=us&count=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.items) {
        throw new Error('Invalid response format from Steam Store API');
      }

      const games = await this.enrichGameData(data.items);
      const result: GameSearchResult = {
        games,
        total: data.total,
        page,
        limit
      };
      
      this.cacheData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error searching games:', error);
      
      return {
        games: [],
        total: 0,
        page,
        limit
      };
    }
  }

  /**
   * Get games by genre
   */
  async getGamesByGenre(genre: string, limit: number = 20): Promise<GameDatabaseEntry[]> {
    const cacheKey = `${this.CACHE_KEYS.GENRE_GAMES}-${genre}-${limit}`;
    
    const cached = this.getCachedData(cacheKey, this.CACHE_DURATION.GENRE);
    if (cached) {
      return cached;
    }

    try {
      // Search for games by genre using Steam Store API
      const response = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(genre)}&l=english&cc=us&count=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.items) {
        throw new Error('Invalid response format from Steam Store API');
      }

      const games = await this.enrichGameData(data.items);
      this.cacheData(cacheKey, games);
      
      return games;
    } catch (error) {
      console.error('Error fetching games by genre:', error);
      return [];
    }
  }

  /**
   * Get game details by app ID
   */
  async getGameDetails(appId: number): Promise<GameDatabaseEntry | null> {
    const cacheKey = `${this.CACHE_KEYS.GAME_DETAILS}-${appId}`;
    
    const cached = this.getCachedData(cacheKey, this.CACHE_DURATION.GAME_DETAILS);
    if (cached) {
      return cached;
    }

    try {
      // Get game details from Steam Store API
      const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=english&cc=us`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data[appId] || !data[appId].success || !data[appId].data) {
        return null;
      }

      const game = this.transformSteamAppDetails(data[appId].data);
      this.cacheData(cacheKey, game);
      
      return game;
    } catch (error) {
      console.error('Error fetching game details:', error);
      return null;
    }
  }

  /**
   * Enrich game data with additional details
   */
  private async enrichGameData(games: any[]): Promise<GameDatabaseEntry[]> {
    const enrichedGames: GameDatabaseEntry[] = [];

    for (const game of games) {
      try {
        // Get detailed information for each game
        const details = await this.getGameDetails(game.appid);
        if (details) {
          enrichedGames.push(details);
        } else {
          // Fallback to basic game info
          enrichedGames.push(this.transformBasicGameInfo(game));
        }
      } catch (error) {
        console.warn(`Failed to enrich game ${game.appid}:`, error);
        enrichedGames.push(this.transformBasicGameInfo(game));
      }
    }

    return enrichedGames;
  }

  /**
   * Transform Steam app details to database entry
   */
  private transformSteamAppDetails(details: SteamAppDetails): GameDatabaseEntry {
    return {
      appid: details.appid,
      name: details.name,
      header_image: details.header_image,
      capsule_image: details.capsule_image,
      short_description: details.short_description,
      genres: details.genres?.map(g => g.description) || [],
      developers: details.developers || [],
      publishers: details.publishers || [],
      release_date: details.release_date?.date || '',
      price_overview: details.price_overview,
      metacritic_score: details.metacritic?.score,
      is_free: details.is_free,
      platforms: details.platforms || { windows: false, mac: false, linux: false },
      categories: details.categories?.map(c => c.description) || [],
      screenshots: details.screenshots?.map(s => s.path_full) || [],
      last_updated: Date.now(),
      player_count: {
        current: Math.floor(Math.random() * 50000) + 1000, // Mock data
        peak_24h: Math.floor(Math.random() * 100000) + 5000,
        all_time_peak: Math.floor(Math.random() * 500000) + 10000
      }
    };
  }

  /**
   * Transform basic game info to database entry
   */
  private transformBasicGameInfo(game: any): GameDatabaseEntry {
    return {
      appid: game.appid,
      name: game.name || 'Unknown Game',
      header_image: game.header_image || '',
      capsule_image: game.capsule_image || '',
      short_description: game.short_description || '',
      genres: game.genres || [],
      developers: game.developers || [],
      publishers: game.publishers || [],
      release_date: game.release_date || '',
      price_overview: game.price_overview,
      metacritic_score: game.metacritic_score,
      is_free: game.is_free || false,
      platforms: game.platforms || { windows: false, mac: false, linux: false },
      categories: game.categories || [],
      screenshots: game.screenshots || [],
      last_updated: Date.now(),
      player_count: {
        current: game.current_players || 0,
        peak_24h: game.peak_players_24h || 0,
        all_time_peak: game.all_time_peak || 0
      }
    };
  }


  /**
   * Cache data with timestamp
   */
  private cacheData(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  /**
   * Get cached data if not expired
   */
  private getCachedData(key: string, maxAge: number): any | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      
      if (age > maxAge) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    Object.values(this.CACHE_KEYS).forEach(key => {
      // Clear all variations of each cache key
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey && storageKey.startsWith(key)) {
          localStorage.removeItem(storageKey);
        }
      }
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalKeys: number; cacheSize: number } {
    let totalKeys = 0;
    let cacheSize = 0;

    Object.values(this.CACHE_KEYS).forEach(key => {
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey && storageKey.startsWith(key)) {
          totalKeys++;
          const value = localStorage.getItem(storageKey);
          if (value) {
            cacheSize += value.length;
          }
        }
      }
    });

    return { totalKeys, cacheSize };
  }
}

export const gameDatabase = new GameDatabase();
