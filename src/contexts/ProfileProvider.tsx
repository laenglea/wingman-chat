import { useState, useEffect, ReactNode } from 'react';
import { ProfileContext, ProfileSettings } from './ProfileContext';
import { setValue, getValue, deleteValue } from '../lib/db';

interface ProfileProviderProps {
  children: ReactNode;
}

// Helper function to filter out empty/null values from profile settings
const filterEmptySettings = (settings: ProfileSettings): ProfileSettings => {
  const filtered: ProfileSettings = {};
  
  if (settings.name?.trim()) filtered.name = settings.name;
  if (settings.role?.trim()) filtered.role = settings.role;
  if (settings.profile?.trim()) filtered.profile = settings.profile;
  
  if (settings.traits?.length) {
    const nonEmptyTraits = settings.traits.filter(trait => trait?.trim());
    if (nonEmptyTraits.length > 0) filtered.traits = nonEmptyTraits;
  }
  
  return filtered;
};

export function ProfileProvider({ children }: ProfileProviderProps) {
  const [settings, setSettings] = useState<ProfileSettings>({});

  // Load settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await getValue<ProfileSettings>('profile');
        if (saved) {
          setSettings(prev => ({ ...prev, ...saved }));
        } else {
          // Migration: Check if there are settings in localStorage
          const legacySettings = localStorage.getItem('profile-settings');
          if (legacySettings) {
            try {
              const parsed = JSON.parse(legacySettings);
              // Remove the instructions field if it exists (from old format)
              if ('instructions' in parsed) {
                delete parsed.instructions;
              }
              const cleanedSettings = filterEmptySettings(parsed);
              if (Object.keys(cleanedSettings).length > 0) {
                setSettings(prev => ({ ...prev, ...cleanedSettings }));
                // Save migrated settings to database
                await setValue('profile', cleanedSettings);
              }
              // Remove the old localStorage entry
              localStorage.removeItem('profile-settings');
            } catch (error) {
              console.warn('Failed to migrate legacy profile settings:', error);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load profile settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  // Save settings to database when they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        const filteredSettings = filterEmptySettings(settings);
        // Only save if there are non-empty settings
        if (Object.keys(filteredSettings).length > 0) {
          await setValue('profile', filteredSettings);
        } else {
          // If all settings are empty, remove the profile from storage
          await deleteValue('profile');
        }
      } catch (error) {
        console.warn('Failed to save profile settings:', error);
      }
    };
    
    saveSettings();
  }, [settings]);

  const updateSettings = (updates: Partial<ProfileSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const generateInstructions = () => {
    return generateInstructionsFromSettings(settings);
  };

  const generateInstructionsFromSettings = (settings: ProfileSettings): string => {
    const parts: string[] = [];
    
    if (settings.name) {
      parts.push(`My name is ${settings.name}.`);
    }
    
    if (settings.role) {
      parts.push(`I am a ${settings.role}.`);
    }
    
    if (settings.traits && settings.traits.length > 0) {
      parts.push(`Please be ${settings.traits.join(', ')}.`);
    }
    
    if (settings.profile) {
      parts.push(`About me: ${settings.profile}`);
    }
    
    return parts.join(' ');
  };

  return (
    <ProfileContext.Provider value={{ settings, updateSettings, generateInstructions }}>
      {children}
    </ProfileContext.Provider>
  );
}
