import { useState } from 'react';
import { RefreshCw, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { SteamAmplifyService } from '../services/steamAmplifyService';
import toast from 'react-hot-toast';

interface SteamSyncProps {
  userId: string;
  steamId: string;
  onSyncComplete: () => void;
}

export function SteamSync({ userId, steamId, onSyncComplete }: SteamSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const steamService = new SteamAmplifyService();

  const handleFullSync = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    setSyncStatus('Starting sync...');

    try {
      // Step 1: Sync game library
      setSyncStatus('Syncing game library...');
      setSyncProgress(25);
      await steamService.syncGameLibrary(userId, steamId);
      
      // Step 2: Get owned games to sync achievements
      setSyncStatus('Fetching games for achievement sync...');
      setSyncProgress(50);
      const gamesResponse = await steamService.getOwnedGames(steamId);
      
      if (gamesResponse.success && gamesResponse.data) {
        const games = gamesResponse.data.games;
        const totalGames = games.length;
        
        // Step 3: Sync achievements for each game (in batches)
        setSyncStatus('Syncing achievements...');
        setSyncProgress(60);
        
        for (let i = 0; i < games.length; i++) {
          const game = games[i];
          if (game.hasStats) {
            try {
              await steamService.syncGameAchievements(userId, steamId, game.appId);
            } catch (error) {
              console.warn(`Failed to sync achievements for ${game.name}:`, error);
            }
          }
          
          // Update progress
          const progress = 60 + (40 * (i + 1) / totalGames);
          setSyncProgress(Math.min(progress, 100));
          setSyncStatus(`Syncing achievements... (${i + 1}/${totalGames})`);
        }
      }

      setSyncStatus('Sync completed successfully!');
      toast.success('Steam library synced successfully!');
      onSyncComplete();
    } catch (error) {
      console.error('Error during Steam sync:', error);
      setSyncStatus('Sync failed. Please try again.');
      toast.error('Failed to sync Steam library. Please try again.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncProgress(0);
        setSyncStatus('');
      }, 3000);
    }
  };

  const handleQuickSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Quick syncing...');

    try {
      await steamService.syncGameLibrary(userId, steamId);
      setSyncStatus('Quick sync completed!');
      toast.success('Game library updated!');
      onSyncComplete();
    } catch (error) {
      console.error('Error during quick sync:', error);
      setSyncStatus('Quick sync failed.');
      toast.error('Failed to sync game library.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncStatus('');
      }, 2000);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-500" />
          Steam Sync
        </h3>
        {syncStatus && (
          <div className="flex items-center gap-2 text-sm">
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            ) : syncStatus.includes('completed') ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : syncStatus.includes('failed') ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : null}
            <span className="text-gray-400">{syncStatus}</span>
          </div>
        )}
      </div>

      <p className="text-gray-400 mb-4">
        Sync your Steam library to automatically update games, playtime, and achievements.
      </p>

      {/* Progress Bar */}
      {isSyncing && syncProgress > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(syncProgress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleQuickSync}
          disabled={isSyncing}
          className="btn btn-secondary flex items-center gap-2 flex-1"
        >
          {isSyncing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Quick Sync
        </button>
        
        <button
          onClick={handleFullSync}
          disabled={isSyncing}
          className="btn btn-primary flex items-center gap-2 flex-1"
        >
          {isSyncing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Full Sync
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="text-sm text-blue-200">
          <p className="font-medium mb-1">Sync Options:</p>
          <ul className="text-xs space-y-1">
            <li>• <strong>Quick Sync:</strong> Updates games and playtime only</li>
            <li>• <strong>Full Sync:</strong> Includes achievements (may take longer)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

