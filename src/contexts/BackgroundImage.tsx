import { useBackground } from "../hooks/useBackground";

export function BackgroundImage() {
  const { backgroundStyles, backgroundClassName } = useBackground();

  return (
    <div 
      className={backgroundClassName}
      style={backgroundStyles}
    />
  );
}
