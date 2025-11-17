import { useState } from 'react';
import { ExternalLink, Copy, Check, AlertCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface SteamSetupGuideProps {
  onClose: () => void;
}

export function SteamSetupGuide({ onClose }: SteamSetupGuideProps) {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const copyToClipboard = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const steps = [
    {
      id: 1,
      title: 'Get Your Steam API Key',
      description: 'Visit the Steam Web API Key page to generate your API key.',
      action: {
        type: 'link',
        text: 'Get Steam API Key',
        url: 'https://steamcommunity.com/dev/apikey',
      },
    },
    {
      id: 2,
      title: 'Set Your Profile to Public',
      description: 'Make sure your Steam profile and game details are set to public.',
      action: {
        type: 'link',
        text: 'Steam Privacy Settings',
        url: 'https://steamcommunity.com/my/edit/settings',
      },
    },
    {
      id: 3,
      title: 'Find Your Steam ID',
      description: 'You can find your Steam ID in your profile URL or use a Steam ID finder.',
      action: {
        type: 'link',
        text: 'Find Steam ID',
        url: 'https://steamidfinder.com/',
      },
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Steam Integration Setup</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-200 mb-2">Why connect Steam?</h3>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>• Automatically sync your game library</li>
                  <li>• Track accurate playtime from Steam</li>
                  <li>• View achievement progress</li>
                  <li>• Keep your library up to date</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {step.id}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400 mb-3">{step.description}</p>
                  {step.action.type === 'link' && (
                    <a
                      href={step.action.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {step.action.text}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-200 mb-2">Important Notes</h3>
                <ul className="text-sm text-yellow-200 space-y-1">
                  <li>• Your Steam profile must be public for the sync to work</li>
                  <li>• Game details must be set to "Public" in your privacy settings</li>
                  <li>• The API key is only needed for the initial setup</li>
                  <li>• Your Steam ID is required to connect your profile</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="btn btn-primary"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

