export function readAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const text = reader.result as string;
      resolve(text);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsText(blob);
  });
}

export function readAsDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(blob);
  });
}

export async function resizeImageBlob(
  blob: Blob,
  maxWidth: number,
  maxHeight: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(img.src);

      let newWidth = img.width;
      let newHeight = img.height;

      if (newWidth > maxWidth) {
        newHeight = Math.round((maxWidth * newHeight) / newWidth);
        newWidth = maxWidth;
      }

      if (newHeight > maxHeight) {
        newWidth = Math.round((maxHeight * newWidth) / newHeight);
        newHeight = maxHeight;
      }

      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      canvas.toBlob(
        (resizedBlob) => {
          if (resizedBlob) {
            resolve(resizedBlob);
          } else {
            reject(new Error("Failed to create blob from canvas"));
          }
        },
        blob.type,
        0.90
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image"));
    };
  });
}
