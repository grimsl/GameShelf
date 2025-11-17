import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import type { Game, LibraryEntry } from '../types';

let client: any = null;

const getClient = () => {
  if (!client) {
    try {
      client = generateClient<Schema>();
    } catch (error) {
      console.warn('Amplify not configured yet, database operations will be skipped:', error);
      return null;
    }
  }
  return client;
};

export type GameData = Game;
export type LibraryEntryData = LibraryEntry;

export class DatabaseService {
  /**
   * Get user's Steam games from database
   */
  async getUserSteamGames(userId: string): Promise<LibraryEntry[]> {
    try {
      const client = getClient();
      if (!client) {
        return [];
      }
      
      const { data } = await client.models.LibraryEntry.list({
        filter: {
          userId: { eq: userId },
          isFromSteam: { eq: true }
        }
      });

      return data as LibraryEntry[];
    } catch (error) {
      console.error('Error loading Steam games from database:', error);
      return [];
    }
  }

  /**
   * Get user's Steam profile data from database
   */
  async getUserSteamProfile(userId: string) {
    try {
      const client = getClient();
      if (!client) {
        return null;
      }
      
      const { data } = await client.models.User.get({ id: userId });
      
      if (data) {
        return {
          steamId: data.steamId,
          steamPersonaName: data.steamPersonaName,
          steamProfileUrl: data.steamProfileUrl,
          steamAvatarUrl: data.steamAvatarUrl,
          steamConnected: data.steamConnected,
          steamConnectedAt: data.steamConnectedAt
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error loading Steam profile from database:', error);
      return null;
    }
  }

  /**
   * Get game details from database
   */
  async getGameDetails(gameId: string): Promise<Game | null> {
    try {
      const client = getClient();
      if (!client) {
        return null;
      }
      
      const { data } = await client.models.Game.get({ id: gameId });
      return data as Game | null;
    } catch (error) {
      console.error('Error loading game details from database:', error);
      return null;
    }
  }

  /**
   * Get user's library entries (both Steam and manual)
   */
  async getUserLibraryEntries(userId: string): Promise<LibraryEntry[]> {
    try {
      const client = getClient();
      if (!client) {
        return [];
      }
      
      const { data } = await client.models.LibraryEntry.list({
        filter: {
          userId: { eq: userId }
        }
      });

      return data as LibraryEntryData[];
    } catch (error) {
      console.error('Error loading library entries from database:', error);
      return [];
    }
  }

  /**
   * Update library entry
   */
  async updateLibraryEntry(entryId: string, updates: Partial<LibraryEntry>): Promise<LibraryEntry | null> {
    try {
      const client = getClient();
      if (!client) {
        return null;
      }
      
      const { data } = await client.models.LibraryEntry.update({
        id: entryId,
        ...updates,
        updatedAt: new Date().toISOString()
      });

      return data as LibraryEntry | null;
    } catch (error) {
      console.error('Error updating library entry:', error);
      return null;
    }
  }

  /**
   * Create new library entry
   */
  async createLibraryEntry(entry: Omit<LibraryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<LibraryEntry | null> {
    try {
      const client = getClient();
      if (!client) {
        return null;
      }
      
      const { data } = await client.models.LibraryEntry.create({
        ...entry,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return data as LibraryEntry | null;
    } catch (error) {
      console.error('Error creating library entry:', error);
      return null;
    }
  }

  /**
   * Delete library entry
   */
  async deleteLibraryEntry(entryId: string): Promise<boolean> {
    try {
      const client = getClient();
      if (!client) {
        return false;
      }
      
      await client.models.LibraryEntry.delete({ id: entryId });
      return true;
    } catch (error) {
      console.error('Error deleting library entry:', error);
      return false;
    }
  }
}

export const databaseService = new DatabaseService();
