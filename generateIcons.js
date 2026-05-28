import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname);
const PUBLIC_DIR = path.resolve(ROOT, 'client', 'public');

async function run() {
  console.log('Checking for sharp dependency...');
  let hasSharp = false;
  try {
    await import('sharp');
    hasSharp = true;
  } catch (e) {
    console.log('sharp not found.');
  }

  if (!hasSharp) {
    console.log('Installing sharp using pnpm...');
    try {
      execSync('pnpm add -D sharp', { stdio: 'inherit', cwd: ROOT });
    } catch (installError) {
      console.error('Failed to install sharp via pnpm. Trying npm...');
      execSync('npm install --no-save sharp', { stdio: 'inherit', cwd: ROOT });
    }
  }

  const sharp = (await import('sharp')).default;

  const svgPath = path.resolve(PUBLIC_DIR, 'favicon.svg');
  const out180 = path.resolve(PUBLIC_DIR, 'apple-touch-icon-v2.png');
  const out192 = path.resolve(PUBLIC_DIR, 'icon-192-v2.png');
  const out512 = path.resolve(PUBLIC_DIR, 'icon-512-v2.png');

  if (!fs.existsSync(svgPath)) {
    console.error('favicon.svg not found at ' + svgPath);
    process.exit(1);
  }

  const generatePaddedIcon = async (outPath, size, scale = 0.6) => {
    const logoSize = Math.round(size * scale);
    const logoBuffer = await sharp(svgPath)
      .resize(logoSize, logoSize)
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: '#091426'
      }
    })
      .composite([{ input: logoBuffer, gravity: 'centre' }])
      .png()
      .toFile(outPath);
  };

  console.log('Generating apple-touch-icon-v2.png with padding and background...');
  await generatePaddedIcon(out180, 180, 0.6);

  console.log('Generating icon-192-v2.png with padding and background...');
  await generatePaddedIcon(out192, 192, 0.6);

  console.log('Generating icon-512-v2.png with padding and background...');
  await generatePaddedIcon(out512, 512, 0.6);

  console.log('Successfully generated transparent icons!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
