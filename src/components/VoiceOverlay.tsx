import { useEffect, useState } from "react";
import { Mic, Loader2, X } from "lucide-react";

interface VoiceOverlayProps {
  isVisible: boolean;
  isConnecting: boolean;
  isListening: boolean;
  onClose: () => void;
}

export function VoiceOverlay({ isVisible, isConnecting, isListening, onClose }: VoiceOverlayProps) {
  const [circles, setCircles] = useState([
    { scale: 1, opacity: 0.8 },
    { scale: 0.8, opacity: 0.6 },
    { scale: 1.2, opacity: 0.4 },
    { scale: 0.6, opacity: 0.7 }
  ]);

  useEffect(() => {
    if (!isListening || !isVisible) return;

    const interval = setInterval(() => {
      setCircles(prev => prev.map(() => ({
        scale: 0.5 + Math.random() * 0.8, // Random scale between 0.5 and 1.3
        opacity: 0.3 + Math.random() * 0.5 // Random opacity between 0.3 and 0.8
      })));
    }, 800);

    return () => clearInterval(interval);
  }, [isListening, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-50/90 dark:bg-neutral-900/90 backdrop-blur-sm">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-white/80 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors z-10"
      >
        <X size={24} />
      </button>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center h-full px-8">
        {/* Status */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            {isConnecting ? 'Connecting...' : isListening ? 'Listening' : 'Voice Mode'}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            {isConnecting 
              ? 'Setting up voice connection' 
              : isListening 
                ? 'Start speaking. Your voice will be transcribed.'
                : 'Voice mode is active'
            }
          </p>
        </div>

        {/* Animated Visual */}
        <div className="relative flex items-center justify-center mb-12">
          {isConnecting ? (
            <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
          ) : (
            <div className="relative">
              {/* Animated circles */}
              {isListening && circles.map((circle, index) => (
                <div
                  key={index}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-blue-500 dark:bg-blue-400 transition-all duration-800 ease-in-out"
                  style={{
                    transform: `translate(-50%, -50%) scale(${circle.scale})`,
                    opacity: circle.opacity,
                  }}
                />
              ))}
              
              {/* Center microphone */}
              <div className="relative w-24 h-24 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center shadow-lg border border-neutral-200 dark:border-neutral-700 z-10">
                <Mic 
                  className={`w-10 h-10 ${
                    isListening 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center">
          <p className="text-neutral-500 dark:text-neutral-500">
            Tap the close button to exit voice mode
          </p>
        </div>
      </div>
    </div>
  );
}
