import { useState } from "react";

export function useBackground() {
  // Random background image
  const [randomBackgroundImage] = useState(() => {
    const imageNumber = Math.floor(Math.random() * 19) + 1;
    return `/backgrounds/image_${imageNumber.toString().padStart(2, '0')}.png`;
  });

  const getBackgroundStyles = () => ({
    backgroundImage: `url(${randomBackgroundImage})`,
  });

  const getBackgroundClassName = () =>
    "absolute inset-0 bg-cover bg-center bg-no-repeat z-0 transition-opacity duration-700 ease-out opacity-60";

  return {
    backgroundImage: randomBackgroundImage,
    backgroundStyles: getBackgroundStyles(),
    backgroundClassName: getBackgroundClassName(),
  };
}
