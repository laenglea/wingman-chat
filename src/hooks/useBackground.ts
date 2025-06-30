import { useBackgroundContext } from './useBackgroundContext';

/**
 * Hook to access background settings and pack management.
 */
export function useBackground() {
  const {
    backgroundPacks,
    backgroundSetting,
    setBackground,
    backgroundImage,
  } = useBackgroundContext();

  return {
    backgroundImage,
    backgroundPacks,
    backgroundSetting,
    setBackground,
  };
}