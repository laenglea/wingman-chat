import { ReactNode, useState, useCallback, useEffect } from 'react';
import { ScreenCaptureContext, ScreenCaptureContextType } from './ScreenCaptureContext';
import { startContinuousScreenCapture, captureFromStream } from '../lib/utils';

interface ScreenCaptureProviderProps {
  children: ReactNode;
}

export function ScreenCaptureProvider({ children }: ScreenCaptureProviderProps) {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const stopCapture = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
  }, [stream]);

  const startCapture = useCallback(async () => {
    try {
      const mediaStream = await startContinuousScreenCapture();
      setStream(mediaStream);
      setIsActive(true);

      // Listen for when the user stops sharing (e.g., clicks "Stop sharing" in browser)
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          console.log('Screen sharing ended by user');
          // Clean up the stream and reset state
          mediaStream.getTracks().forEach(track => track.stop());
          setStream(null);
          setIsActive(false);
        });
      }
    } catch (error) {
      console.error('Failed to start screen capture:', error);
      throw error;
    }
  }, []);

  const captureFrame = useCallback(async (): Promise<Blob | null> => {
    if (!stream) {
      return null;
    }

    try {
      return await captureFromStream(stream);
    } catch (error) {
      console.error('Failed to capture frame:', error);
      return null;
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        console.log('Cleaning up screen capture on unmount');
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const value: ScreenCaptureContextType = {
    isActive,
    startCapture,
    stopCapture,
    captureFrame,
  };

  return (
    <ScreenCaptureContext.Provider value={value}>
      {children}
    </ScreenCaptureContext.Provider>
  );
}
