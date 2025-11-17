import { generateClient } from 'aws-amplify/api';
import { getSteamProfile, getSteamGames, getSteamAchievements, connectSteamProfile, syncSteamLibrary, syncSteamAchievements } from '../graphql/queries';
import { databaseService } from './databaseService';
import type {
  SteamGame,
  SteamAchievement,
  SteamProfile,
  SteamApiResponse,
  SteamGamesResponse,
  SteamAchievementsResponse,
  LibraryEntry,
} from '../types';

const client = generateClient();

export class SteamAmplifyService {
  /**
   * Get user's Steam profile information
   */
  async getPlayerProfile(steamId: string): Promise<SteamApiResponse<SteamProfile>> {
    try {
      const response = await client.graphql({
        query: getSteamProfile,
        variables: { steamId }
      });

      return {
        success: true,
        data: response.data.getSteamProfile
      };
    } catch (error) {
      console.error('Steam Amplify API call failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user's owned games from Steam
   */
  async getOwnedGames(steamId: string): Promise<SteamApiResponse<SteamGamesResponse>> {
    try {
      const response = await client.graphql({
        query: getSteamGames,
        variables: { steamId }
      });

      return {
        success: true,
        data: response.data.getSteamGames
      };
    } catch (error) {
      console.error('Steam Amplify API call failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user's achievements for a specific game
   */
  async getPlayerAchievements(steamId: string, appId: number): Promise<SteamApiResponse<SteamAchievementsResponse>> {
    try {
      const response = await client.graphql({
        query: getSteamAchievements,
        variables: { steamId, appId: appId.toString() }
      });

      return {
        success: true,
        data: response.data.getSteamAchievements
      };
    } catch (error) {
      console.error('Steam Amplify API call failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Connect user's Steam profile to their GameShelf account
   */
  async connectSteamProfile(userId: string, steamId: string): Promise<void> {
    try {
      const response = await client.graphql({
        query: connectSteamProfile,
        variables: { steamId }
      });

      const profile = response.data.connectSteamProfile;

      // Store Steam profile data in localStorage (user-specific)
      const steamData = {
        userId,
        steamId: profile.steamId,
        steamPersonaName: profile.personaName,
        steamProfileUrl: profile.profileUrl,
        steamAvatarUrl: profile.avatarFull,
        steamConnected: true,
        connectedAt: new Date().toISOString()
      };

      localStorage.setItem(`gameshelf-steam-data-${userId}`, JSON.stringify(steamData));

      // Update user profile in database
      await this.updateUserSteamProfile(userId, profile);
    } catch (error) {
      console.error('Error connecting Steam profile:', error);
      throw error;
    }
  }

  /**
   * Sync user's Steam game library to GameShelf
   */
  async syncGameLibrary(userId: string, steamId: string): Promise<void> {
    try {
      const response = await client.graphql({
        query: syncSteamLibrary,
        variables: { steamId }
      });

      const { games, gameCount } = response.data.syncSteamLibrary;

      // Check if games array exists and is valid
      if (!games || !Array.isArray(games)) {
        localStorage.setItem(`gameshelf-steam-games-${userId}`, JSON.stringify([]));
        localStorage.setItem(`gameshelf-library-entries-${userId}`, JSON.stringify([]));
        return;
      }

      // Filter out games with null appId or name (invalid games)
      const validGames = games.filter(game => game.appId && game.name);

      if (validGames.length === 0) {
        localStorage.setItem(`gameshelf-steam-games-${userId}`, JSON.stringify([]));
        localStorage.setItem(`gameshelf-library-entries-${userId}`, JSON.stringify([]));
        return;
      }

      // Store Steam games in localStorage (user-specific)
      localStorage.setItem(`gameshelf-steam-games-${userId}`, JSON.stringify(validGames));
      
      // Store games in database via GraphQL mutations
      await this.storeGamesInDatabase(validGames, userId);
      
      // Also store game library entries for the UI (user-specific)
      const libraryEntries = validGames.map(steamGame => {
        let status: 'playing' | 'finished' | 'paused' | 'dropped' | 'planning' = 'planning';
        if (steamGame.playtimeTotal > 0) {
          if (steamGame.playtimeRecent > 0) {
            status = 'playing';
          } else {
            status = 'paused';
          }
        }

        return {
          id: `steam-${steamGame.appId}`,
          userId,
          gameId: `steam-game-${steamGame.appId}`,
          gameTitle: steamGame.name,
          gameCover: steamGame.logoUrl,
          status,
          rating: null,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Steam-specific data
          steamPlaytimeTotal: steamGame.playtimeTotal,
          steamPlaytimeRecent: steamGame.playtimeRecent,
          steamLastPlayed: steamGame.lastPlayed ? new Date(steamGame.lastPlayed * 1000).toISOString() : null,
          steamSyncDate: new Date().toISOString(),
          isFromSteam: true,
          steamAppId: steamGame.appId,
          steamIconUrl: steamGame.iconUrl,
          steamHasStats: steamGame.hasStats,
          hoursPlayed: Math.round(steamGame.playtimeTotal / 60),
          appid: steamGame.appId,
          name: steamGame.name,
          header_image: steamGame.logoUrl,
        };
      });

      localStorage.setItem(`gameshelf-library-entries-${userId}`, JSON.stringify(libraryEntries));
      
      // Trigger a custom event to notify components of the update
      window.dispatchEvent(new CustomEvent('steamLibrarySynced', { 
        detail: { userId, gameCount: validGames.length } 
      }));
      
    } catch (error) {
      console.error('Error syncing Steam game library:', error);
      throw error;
    }
  }

  /**
   * Get achievements for a specific game
   */
  async syncGameAchievements(userId: string, steamId: string, appId: number): Promise<void> {
    try {
      const response = await client.graphql({
        query: syncSteamAchievements,
        variables: { steamId, appId: appId.toString() }
      });

      const { achievements } = response.data.syncSteamAchievements;

      // Update the library entry in localStorage
      const libraryEntries = localStorage.getItem(`gameshelf-library-entries-${userId}`);
      if (libraryEntries) {
        const entries = JSON.parse(libraryEntries);
        const entryIndex = entries.findIndex((entry: any) => entry.steamAppId === appId);
        
        if (entryIndex !== -1) {
          entries[entryIndex].steamAchievements = achievements;
          entries[entryIndex].steamSyncDate = new Date().toISOString();
          
          localStorage.setItem(`gameshelf-library-entries-${userId}`, JSON.stringify(entries));
        }
      }
    } catch (error) {
      console.error(`Error syncing achievements for game ${appId}:`, error);
    }
  }

  /**
   * Disconnect Steam profile from user account
   */
  async disconnectSteamProfile(userId: string): Promise<void> {
    try {
      localStorage.removeItem(`gameshelf-steam-data-${userId}`);
      localStorage.removeItem(`gameshelf-steam-games-${userId}`);
      localStorage.removeItem(`gameshelf-library-entries-${userId}`);
    } catch (error) {
      console.error('Error disconnecting Steam profile:', error);
      throw error;
    }
  }

  /**
   * Format playtime in hours and minutes
   */
  static formatPlaytime(minutes: number): string {
    if (minutes === 0) return '0 minutes';
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    } else if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  /**
   * Get achievement completion percentage
   */
  static getAchievementProgress(achievements: SteamAchievement[]): number {
    if (!achievements || achievements.length === 0) return 0;
    
    const achieved = achievements.filter(a => a.achieved).length;
    return Math.round((achieved / achievements.length) * 100);
  }

  /**
   * Get recent activity from Steam games data
   */
  static getRecentActivity(steamGames: any[]): any[] {
    if (!steamGames || steamGames.length === 0) return [];

    const activities = [];

    const recentlyPlayed = steamGames
      .filter(game => game.steamLastPlayed && game.steamPlaytimeRecent > 0)
      .sort((a, b) => new Date(b.steamLastPlayed).getTime() - new Date(a.steamLastPlayed).getTime())
      .slice(0, 5)
      .map(game => ({
        id: `played-${game.steamAppId}`,
        action: 'played',
        game: game.gameTitle,
        gameCover: game.gameCover,
        timestamp: game.steamLastPlayed,
        hoursPlayed: game.hoursPlayed,
        recentHours: Math.round(game.steamPlaytimeRecent / 60),
      }));

    activities.push(...recentlyPlayed);
    const finishedGames = steamGames
      .filter(game => game.steamPlaytimeTotal > 0 && game.steamPlaytimeRecent === 0)
      .sort((a, b) => new Date(b.steamLastPlayed || 0).getTime() - new Date(a.steamLastPlayed || 0).getTime())
      .slice(0, 3)
      .map(game => ({
        id: `finished-${game.steamAppId}`,
        action: 'finished',
        game: game.gameTitle,
        gameCover: game.gameCover,
        timestamp: game.steamLastPlayed,
        hoursPlayed: game.hoursPlayed,
        rating: game.rating,
      }));

    activities.push(...finishedGames);

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  /**
   * Get recent achievements from Steam data
   */
  static async getRecentAchievements(steamId: string, steamGames: any[]): Promise<any[]> {
    if (!steamGames || steamGames.length === 0) return [];

    const steamService = new SteamAmplifyService();
    const recentAchievements = [];

    const gamesWithStats = steamGames
      .filter(game => {
        const hasStats = game.steamHasStats || game.hasStats || false;
        const appId = game.steamAppId || game.appId;
        return hasStats && appId;
      })
      .slice(0, 10);

    for (const game of gamesWithStats) {
      try {
        const appId = game.steamAppId || game.appId;
        if (!appId) {
          console.warn(`Skipping game ${game.gameTitle || game.name}: no appId found`);
          continue;
        }
        
        const achievementResponse = await steamService.getPlayerAchievements(steamId, appId);
        
        if (achievementResponse.success && achievementResponse.data) {
          const achievements = achievementResponse.data.achievements;
          
          const recentUnlocks = achievements
            .filter(achievement => achievement.achieved && achievement.unlockTime > 0)
            .sort((a, b) => b.unlockTime - a.unlockTime)
            .slice(0, 3)
            .map(achievement => ({
              id: `achievement-${appId}-${achievement.apiName}`,
              game: game.gameTitle || game.name || 'Unknown Game',
              gameCover: game.gameCover || game.header_image || game.logoUrl || game.iconUrl || '',
              achievement: achievement.name,
              description: achievement.description,
              unlockedAt: new Date(achievement.unlockTime * 1000),
              gameAppId: appId,
            }));

          recentAchievements.push(...recentUnlocks);
        }
      } catch (error) {
        console.warn(`Failed to fetch achievements for ${game.gameTitle}:`, error);
      }
    }

    return recentAchievements
      .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
      .slice(0, 15);
  }

  /**
   * Format time ago string
   */
  static formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  }

  /**
   * Check if Steam profile is public
   */
  static isSteamProfilePublic(communityVisibilityState: number): boolean {
    return communityVisibilityState === 3;
  }

  /**
   * Get privacy status message
   */
  static getPrivacyStatusMessage(communityVisibilityState: number): string {
    switch (communityVisibilityState) {
      case 1:
        return 'Profile is private - games are not accessible';
      case 2:
        return 'Profile is friends only - games are not accessible';
      case 3:
        return 'Profile is public - games should be accessible';
      default:
        return 'Unknown privacy status';
    }
  }

  /**
   * Update user's Steam profile in database
   */
  async updateUserSteamProfile(userId: string, profileData: any): Promise<void> {
    try {
      const { generateClient } = await import('aws-amplify/data');
      const dataClient = generateClient();
      
      await dataClient.models.User.update({
        id: userId,
        steamId: profileData.steamId,
        steamPersonaName: profileData.personaName,
        steamProfileUrl: profileData.profileUrl,
        steamAvatarUrl: profileData.avatarFull,
        steamConnected: true,
        steamConnectedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user Steam profile:', error);
      throw error;
    }
  }

  /**
   * Store Steam games in database via GraphQL mutations
   */
  async storeGamesInDatabase(games: any[], userId: string): Promise<void> {
    try {
      const { generateClient } = await import('aws-amplify/data');
      const dataClient = generateClient();
      
      for (const game of games) {
        try {
          const gameId = `steam-game-${game.appId}`;
          
          await dataClient.models.Game.create({
            id: gameId,
            title: game.name,
            steamAppId: game.appId,
            steamName: game.name,
            steamIconUrl: game.iconUrl,
            steamLogoUrl: game.logoUrl,
            steamHasStats: game.hasStats,
            platform: 'Steam',
          });
          
          let status: 'playing' | 'finished' | 'paused' | 'dropped' | 'planning' = 'planning';
          if (game.playtimeTotal > 0) {
            if (game.playtimeRecent > 0) {
              status = 'playing';
            } else {
              status = 'paused';
            }
          }
          
          await dataClient.models.LibraryEntry.create({
            userId: userId,
            gameId: gameId,
            status: status,
            gameTitle: game.name,
            gameCover: game.logoUrl || game.iconUrl,
            steamPlaytimeTotal: game.playtimeTotal,
            steamPlaytimeRecent: game.playtimeRecent,
            steamLastPlayed: game.lastPlayed ? new Date(game.lastPlayed * 1000).toISOString() : null,
            isFromSteam: true,
          });
        } catch (error) {
          console.error(`Error storing game ${game.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in storeGamesInDatabase:', error);
      throw error;
    }
  }

  /**
   * Load Steam games from database and sync with localStorage
   */
  static async loadSteamGamesFromDatabase(userId: string): Promise<SteamGame[]> {
    try {
      const dbGames = await databaseService.getUserSteamGames(userId);
      
      if (dbGames.length > 0) {
        const steamGames = dbGames.map(entry => ({
          appId: parseInt(entry.gameId.replace('steam-game-', '')),
          name: entry.gameTitle,
          playtimeTotal: entry.steamPlaytimeTotal || 0,
          playtimeRecent: entry.steamPlaytimeRecent || 0,
          iconUrl: entry.gameCover || '',
          logoUrl: entry.gameCover || '',
          hasStats: false,
          lastPlayed: entry.steamLastPlayed ? Math.floor(new Date(entry.steamLastPlayed).getTime() / 1000) : null,
          playtimeWindows: 0,
          playtimeMac: 0,
          playtimeLinux: 0,
        }));

        localStorage.setItem(`gameshelf-steam-games-${userId}`, JSON.stringify(steamGames));
        localStorage.setItem(`gameshelf-library-entries-${userId}`, JSON.stringify(dbGames));
        
        return steamGames;
      }
      const steamGames = localStorage.getItem(`gameshelf-steam-games-${userId}`);
      return steamGames ? JSON.parse(steamGames) : [];
    } catch (error) {
      console.error('Error loading Steam games from database:', error);
      return [];
    }
  }

  /**
   * Load Steam profile from database
   */
  static async loadSteamProfileFromDatabase(userId: string): Promise<any> {
    try {
      const profile = await databaseService.getUserSteamProfile(userId);
      
      if (profile && profile.steamConnected) {
        const steamData = {
          steamId: profile.steamId,
          steamPersonaName: profile.steamPersonaName,
          steamProfileUrl: profile.steamProfileUrl,
          steamAvatarUrl: profile.steamAvatarUrl,
          steamConnected: profile.steamConnected,
          connectedAt: profile.steamConnectedAt
        };
        
        localStorage.setItem(`gameshelf-steam-data-${userId}`, JSON.stringify(steamData));
        return steamData;
      }

      return null;
    } catch (error) {
      console.error('Error loading Steam profile from database:', error);
      return null;
    }
  }
}
