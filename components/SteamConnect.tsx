import { useState } from 'react';
import { SteamAmplifyService } from '../services/steamAmplifyService';
import { ExternalLink, RefreshCw, CheckCircle, AlertCircle, Loader, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { SteamSetupGuide } from './SteamSetupGuide';

interface SteamConnectProps {
  userId: string;
  steamConnected: boolean;
  steamPersonaName?: string;
  steamProfileUrl?: string;
  steamAvatarUrl?: string;
  onSteamConnected: () => void;
}

export function SteamConnect({
  userId,
  steamConnected,
  steamPersonaName,
  steamProfileUrl,
  steamAvatarUrl,
  onSteamConnected,
}: SteamConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [steamId, setSteamId] = useState('');
  const [showSteamIdInput, setShowSteamIdInput] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const steamService = new SteamAmplifyService();

  const handleConnectSteam = async () => {
    if (!steamId.trim()) {
      toast.error('Please enter your Steam ID');
      return;
    }

    setIsConnecting(true);
    try {
      await steamService.connectSteamProfile(userId, steamId.trim());
      toast.success('Steam profile connected successfully!');
      onSteamConnected();
      setShowSteamIdInput(false);
      setSteamId('');
    } catch (error) {
      console.error('Error connecting Steam:', error);
      toast.error('Failed to connect Steam profile. Please check your Steam ID and try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSyncLibrary = async () => {
    if (!steamConnected) {
      toast.error('Please connect your Steam profile first');
      return;
    }

    setIsSyncing(true);
    try {
      // Get steamId from localStorage (user-specific)
      const steamData = localStorage.getItem(`gameshelf-steam-data-${userId}`);
      if (!steamData) {
        throw new Error('Steam data not found');
      }
      
      const { steamId: storedSteamId } = JSON.parse(steamData);
      await steamService.syncGameLibrary(userId, storedSteamId);
      toast.success('Game library synced successfully!');
      onSteamConnected();
    } catch (error) {
      console.error('Error syncing library:', error);
      toast.error('Failed to sync game library. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectSteam = async () => {
    try {
      await steamService.disconnectSteamProfile(userId);
      toast.success('Steam profile disconnected');
      onSteamConnected();
    } catch (error) {
      console.error('Error disconnecting Steam:', error);
      toast.error('Failed to disconnect Steam profile');
    }
  };

  const getSteamIdFromUrl = (url: string): string => {
    // Extract Steam ID from various Steam URL formats
    const patterns = [
      /steamcommunity\.com\/id\/([^\/]+)/,
      /steamcommunity\.com\/profiles\/(\d+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return '';
  };

  const handleSteamUrlInput = (url: string) => {
    const extractedId = getSteamIdFromUrl(url);
    if (extractedId) {
      setSteamId(extractedId);
    } else {
      setSteamId(url);
    }
  };

  if (steamConnected) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Steam Connected
          </h3>
          <button
            onClick={handleDisconnectSteam}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Disconnect
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          {steamAvatarUrl && (
            <img
              src={steamAvatarUrl}
              alt="Steam Avatar"
              className="w-12 h-12 rounded-full"
            />
          )}
          <div>
            <p className="text-white font-medium">{steamPersonaName}</p>
            {steamProfileUrl && (
              <a
                href={steamProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                View Steam Profile
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSyncLibrary}
            disabled={isSyncing}
            className="btn btn-primary flex items-center gap-2"
          >
            {isSyncing ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isSyncing ? 'Syncing...' : 'Sync Library'}
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-200">
            <strong>Note:</strong> Make sure your Steam profile and game details are set to public 
            for the sync to work properly. You can change this in your Steam privacy settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold text-white">Connect Steam Profile</h3>
      </div>

      <p className="text-gray-400 mb-4">
        Connect your Steam profile to automatically sync your game library, playtime, and achievements.
      </p>

      <div className="flex gap-2 mb-4">
        {!showSteamIdInput ? (
          <button
            onClick={() => setShowSteamIdInput(true)}
            className="btn btn-primary flex-1"
          >
            Connect Steam Profile
          </button>
        ) : null}
        <button
          onClick={() => setShowSetupGuide(true)}
          className="btn btn-secondary flex items-center gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          Setup Guide
        </button>
      </div>

      {showSteamIdInput && (
        <div className="space-y-4">
          <div>
            <label htmlFor="steamId" className="form-label">
              Steam ID or Profile URL
            </label>
            <input
              type="text"
              id="steamId"
              value={steamId}
              onChange={(e) => handleSteamUrlInput(e.target.value)}
              placeholder="Enter your Steam ID or profile URL"
              className="form-input"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can find your Steam ID in your Steam profile URL or use your custom URL
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleConnectSteam}
              disabled={isConnecting || !steamId.trim()}
              className="btn btn-primary flex items-center gap-2"
            >
              {isConnecting ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
            <button
              onClick={() => {
                setShowSteamIdInput(false);
                setSteamId('');
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>

          <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-200">
              <strong>Important:</strong> Your Steam profile must be set to public for this to work. 
              Go to your Steam profile → Edit Profile → Privacy Settings and set "Game details" to "Public".
            </p>
          </div>
        </div>
      )}

      {/* Setup Guide Modal */}
      {showSetupGuide && (
        <SteamSetupGuide onClose={() => setShowSetupGuide(false)} />
      )}
    </div>
  );
}
