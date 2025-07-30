import { useState } from 'react';
import { Play, Square, Loader2 } from 'lucide-react';
import { Button } from "@headlessui/react";
import { Client } from '../lib/client';

type PlayButtonProps = {
  text: string;
  voice?: string;
  size?: number;
};

export function PlayButton({ text, ...props }: PlayButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = async () => {
    if (isPlaying || isLoading) {
      return;
    }

    setIsLoading(true);
    setIsPlaying(true);

    try {
      const client = new Client();
      await client.speakText(props.voice || "", text);
    } catch (error) {
      console.error('Failed to play text:', error);
    } finally {
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const buttonClasses = "text-neutral-400 hover:text-neutral-600 dark:text-neutral-400 dark:hover:text-neutral-300 transition-colors opacity-60 hover:opacity-100 disabled:opacity-30 p-1";
  
  // Simple size mapping
  const sizeClasses = {
    2: "h-2 w-2",
    3: "h-3 w-3", 
    4: "h-4 w-4",
    5: "h-5 w-5",
    6: "h-6 w-6"
  } as const;

  const iconClasses = sizeClasses[(props.size ?? 3) as keyof typeof sizeClasses] || "h-4 w-4";

  return (
    <Button
      onClick={handlePlay}
      disabled={isLoading || isPlaying}
      className={buttonClasses}
      title={isLoading ? "Generating audio..." : isPlaying ? "Playing audio..." : "Play message"}
    >
      {isLoading ? (
        <Loader2 className={`${iconClasses} animate-spin`} />
      ) : isPlaying ? (
        <Square className={iconClasses} />
      ) : (
        <Play className={iconClasses} />
      )}
    </Button>
  );
}
