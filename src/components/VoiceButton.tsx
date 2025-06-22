import { Mic, MicOff } from "lucide-react";
import { Button } from "@headlessui/react";

interface VoiceButtonProps {
  isActive: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function VoiceButton({ isActive, onToggle, disabled = false }: VoiceButtonProps) {
  return (
    <Button
      className={`menu-button ${isActive ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
      onClick={onToggle}
      disabled={disabled}
      title={isActive ? 'Stop voice chat' : 'Start voice chat'}
    >
      {isActive ? <MicOff size={20} /> : <Mic size={20} />}
    </Button>
  );
}
