import { createContext, useState, useEffect, ReactNode } from 'react';

interface PersonalizationSettings {
  name: string;
  role: string;
  traits: string[];
  profile: string;
  instructions: string;
}

interface PersonalizationContextType {
  settings: PersonalizationSettings;
  updateSettings: (updates: Partial<PersonalizationSettings>) => void;
  generateInstructions: () => string;
}

const defaultSettings: PersonalizationSettings = {
  name: '',
  role: '',
  traits: [],
  profile: '',
  instructions: '',
};

export const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

interface PersonalizationProviderProps {
  children: ReactNode;
}

export function PersonalizationProvider({ children }: PersonalizationProviderProps) {
  const [settings, setSettings] = useState<PersonalizationSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('personalization-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Failed to parse personalization settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('personalization-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<PersonalizationSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      
      // Auto-generate instructions when other fields change
      if (!updates.instructions) {
        newSettings.instructions = generateInstructionsFromSettings(newSettings);
      }
      
      return newSettings;
    });
  };

  const generateInstructions = () => {
    const instructions = generateInstructionsFromSettings(settings);
    setSettings(prev => ({ ...prev, instructions }));
    return instructions;
  };

  const generateInstructionsFromSettings = (settings: PersonalizationSettings): string => {
    const parts: string[] = [];
    
    if (settings.name) {
      parts.push(`My name is ${settings.name}.`);
    }
    
    if (settings.role) {
      parts.push(`I am a ${settings.role}.`);
    }
    
    if (settings.traits.length > 0) {
      parts.push(`Please be ${settings.traits.join(', ')}.`);
    }
    
    if (settings.profile) {
      parts.push(`About me: ${settings.profile}`);
    }
    
    return parts.join(' ');
  };

  return (
    <PersonalizationContext.Provider value={{ settings, updateSettings, generateInstructions }}>
      {children}
    </PersonalizationContext.Provider>
  );
}
