import { useState, useCallback, useRef } from 'react';
import { getConfig } from '../config';

export interface UseTranscriptionReturn {
  canTranscribe: boolean;
  isTranscribing: boolean;
  startTranscription: () => Promise<void>;
  stopTranscription: () => Promise<string>;
}

export function useTranscription(): UseTranscriptionReturn {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Check if transcription is available
  const config = getConfig();
  const canTranscribe = config.stt && 
    typeof navigator !== 'undefined' && 
    navigator.mediaDevices && 
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined' &&
    MediaRecorder.isTypeSupported('audio/webm');

  // Use WebM audio format
  const getAudioFormat = (): { mimeType: string; audioBitsPerSecond: number } => {
    return { mimeType: 'audio/webm', audioBitsPerSecond: 64000 };
  };

  const startTranscription = useCallback(async () => {
    if (!canTranscribe) {
      throw new Error('Transcription is not available');
    }
    
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Clear previous audio chunks
      audioChunksRef.current = [];
      
      // Create MediaRecorder with WebM audio format
      const audioOptions = getAudioFormat();
      const mediaRecorder = new MediaRecorder(stream, audioOptions);
      mediaRecorderRef.current = mediaRecorder;
      
      // Collect audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsTranscribing(true);
      
    } catch (err) {
      console.error('Failed to start transcription:', err);
    }
  }, [canTranscribe]);

  const stopTranscription = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording to stop'));
        return;
      }
      
      mediaRecorder.onstop = async () => {
        try {
          setIsTranscribing(false);
          
          // Stop all tracks to release microphone
          const stream = mediaRecorder.stream;
          stream.getTracks().forEach(track => track.stop());
          
          // Create audio blob from recorded chunks with matching MIME type
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          
          if (audioBlob.size === 0) {
            reject(new Error('No audio recorded'));
            return;
          }
          
          // Send to transcription API
          const config = getConfig();
          const transcribedText = await config.client.transcribe("", audioBlob);
          
          resolve(transcribedText);
          
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to transcribe audio';
          reject(new Error(errorMessage));
        }
      };
      
      mediaRecorder.stop();
    });
  }, []);

  return {
    canTranscribe,
    isTranscribing,
    startTranscription,
    stopTranscription,
  };
}
