// Generates placeholder PWA icons (solid TuriApp blue with a white "T").
// Hand-encodes PNGs with zlib so it needs no image dependency. Replace these
// with real designed icons before launch.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const BLUE = [14, 165, 233]; // #0ea5e9
const WHITE = [255, 255, 255];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function pngSolidWithT(size, { maskable } = {}) {
  // Drawing region for the "T" — inset more on maskable so it survives the
  // safe-zone crop.
  const pad = maskable ? 0.22 : 0.16;
  const x0 = Math.floor(size * (0.5 - 0.28));
  const x1 = Math.floor(size * (0.5 + 0.28));
  const barTop = Math.floor(size * (pad + 0.06));
  const barBot = barTop + Math.floor(size * 0.1);
  const stemX0 = Math.floor(size * (0.5 - 0.07));
  const stemX1 = Math.floor(size * (0.5 + 0.07));
  const stemBot = Math.floor(size * (1 - pad));

  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const isBar = y >= barTop && y < barBot && x >= x0 && x < x1;
      const isStem = y >= barTop && y < stemBot && x >= stemX0 && x < stemX1;
      const [r, g, b] = isBar || isStem ? WHITE : BLUE;
      const p = rowStart + 1 + x * 4;
      raw[p] = r; raw[p + 1] = g; raw[p + 2] = b; raw[p + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

writeFileSync(join(outDir, "icon-192.png"), pngSolidWithT(192));
writeFileSync(join(outDir, "icon-512.png"), pngSolidWithT(512));
writeFileSync(join(outDir, "icon-maskable-512.png"), pngSolidWithT(512, { maskable: true }));
console.log("Icons written to public/icons/");
