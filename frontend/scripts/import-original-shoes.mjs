import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require('../node_modules/sharp/dist/index.cjs');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR =
  'C:/Users/Zain/.gemini/antigravity/brain/f51a4bbb-aa83-46be-82c6-3b0f38707653/.user_uploaded';
const OUT_DIR = path.resolve(__dirname, '../public/images/shoes');

const SOURCES = [
  {
    src: 'media_1794752368594_0029cdf1.png',
    out: 'espresso-hightop.png',
    mode: 'alpha-png',
  },
  {
    src: 'media_1794752368437_2a0e2b75.png',
    out: 'chestnut-walker.png',
    mode: 'alpha-png',
  },
  {
    src: 'media_1794752368188_c4231fee.jpg',
    out: 'crimson-runner.png',
    mode: 'checker-flood',
  },
  {
    src: 'media_1794752368188_108ccb77.jpg',
    out: 'black-oxford.png',
    mode: 'white-flood',
  },
  {
    src: 'media_1794752368474_6c60d435.jpg',
    out: 'ivory-canvas.png',
    mode: 'checker-flood-strict',
  },
  {
    src: 'media_1794752368478_27c47c56.jpg',
    out: 'navy-suede.png',
    mode: 'white-flood',
  },
  {
    src: 'media_1794752368475_7bd7795c.jpg',
    out: 'cobalt-trainer.png',
    mode: 'white-flood',
  },
];

function isBgPixel(r, g, b, mode) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  const lum = (r + g + b) / 3;

  if (mode === 'white-flood') {
    // Solid white or very light cool grey studio backdrop
    return lum >= 232 && chroma <= 18;
  }

  if (mode === 'checker-flood-strict') {
    // Neutral checkerboard squares (#FFFFFF or neutral greys ~190-238) while rejecting warm cream canvas
    const isWarmCream = r - b >= 8;
    if (isWarmCream && lum < 247) return false;
    return lum >= 188 && chroma <= 10;
  }

  // checker-flood: remove checkerboard + dropped studio shadow around crimson-runner
  // while keeping crisp dark charcoal collar (which sits inside/higher chroma or lum < 115) and pure white midsole
  return lum >= 118 && chroma <= 13;
}

function floodRemoveBackground(data, width, height, mode) {
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const tryPush = (idx) => {
    if (visited[idx]) return;
    const o = idx * 4;
    if (isBgPixel(data[o], data[o + 1], data[o + 2], mode)) {
      visited[idx] = 1;
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < width; x++) {
    tryPush(x);
    tryPush((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    tryPush(y * width);
    tryPush(y * width + (width - 1));
  }

  while (head < tail) {
    const idx = queue[head++];
    data[idx * 4 + 3] = 0;

    const x = idx % width;
    const y = (idx - x) / width;

    if (x > 0) tryPush(idx - 1);
    if (x < width - 1) tryPush(idx + 1);
    if (y > 0) tryPush(idx - width);
    if (y < height - 1) tryPush(idx + width);
  }

  // Smooth light halo fringe on immediate foreground boundary pixels
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const o = idx * 4;
      if (data[o + 3] === 0) continue;

      const touchesBg =
        data[(idx - 1) * 4 + 3] === 0 ||
        data[(idx + 1) * 4 + 3] === 0 ||
        data[(idx - width) * 4 + 3] === 0 ||
        data[(idx + width) * 4 + 3] === 0;

      if (touchesBg) {
        const lum = (data[o] + data[o + 1] + data[o + 2]) / 3;
        const chroma =
          Math.max(data[o], data[o + 1], data[o + 2]) -
          Math.min(data[o], data[o + 1], data[o + 2]);
        if (lum >= 210 && chroma <= 18) {
          data[o + 3] = 75;
        }
      }
    }
  }
}

async function processAll() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const item of SOURCES) {
    const inputPath = path.join(UPLOAD_DIR, item.src);
    const outputPath = path.join(OUT_DIR, item.out);

    const baseImg = sharp(inputPath).ensureAlpha();
    const { data, info } = await baseImg
      .raw()
      .toBuffer({ resolveWithObject: true });

    const buf = Buffer.from(data);

    if (item.mode !== 'alpha-png') {
      floodRemoveBackground(buf, info.width, info.height, item.mode);
    }

    // Trim excess transparent whitespace around shoe, then center into normalized 1024x1024 transparent studio frame
    const trimmedBuf = await sharp(buf, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .trim({ threshold: 12 })
      .png()
      .toBuffer();

    await sharp(trimmedBuf)
      .resize(860, 860, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .extend({
        top: 82,
        bottom: 82,
        left: 82,
        right: 82,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9 })
      .toFile(outputPath);

    const outMeta = await sharp(outputPath).metadata();
    const stat = fs.statSync(outputPath);
    console.log(
      `[OK] ${item.out} <- ${item.src} | ${outMeta.width}x${outMeta.height} | ${(
        stat.size / 1024
      ).toFixed(1)} KB`
    );
  }
}

processAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
