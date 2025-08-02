import { createContext } from 'react';

export interface ScreenCaptureContextType {
  isActive: boolean;
  startCapture: () => Promise<void>;
  stopCapture: () => void;
  captureFrame: () => Promise<Blob | null>;
}

export const ScreenCaptureContext = createContext<ScreenCaptureContextType | undefined>(undefined);
