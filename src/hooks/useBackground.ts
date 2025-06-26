import { useState } from "react";

export function useBackground() {
  // Random background image
  const [randomBackgroundImage] = useState(() => {
    return `/assets/background_01.jpg`;
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
