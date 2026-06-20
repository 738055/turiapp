export type Area = { x: number; y: number; width: number; height: number };

const MAX_SIDE = 1920;

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function cropImageToBlob(
  imageSrc: string,
  pixelCrop: Area,
  outputType: "image/jpeg" | "image/webp" = "image/webp",
  quality = 0.88
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");

  let outW = pixelCrop.width;
  let outH = pixelCrop.height;
  const scale = Math.min(1, MAX_SIDE / Math.max(outW, outH));
  outW = Math.round(outW * scale);
  outH = Math.round(outH * scale);

  canvas.width = outW;
  canvas.height = outH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      outputType,
      quality
    );
  });
}
