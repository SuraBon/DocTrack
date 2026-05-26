import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(repoRoot, 'gas-src');
const outputFile = path.join(repoRoot, 'google_apps_script.js');

const files = (await readdir(sourceDir))
  .filter((file) => file.endsWith('.gs'))
  .sort((a, b) => a.localeCompare(b));

if (files.length === 0) {
  throw new Error(`No .gs files found in ${sourceDir}`);
}

const chunks = await Promise.all(
  files.map(async (file) => {
    const content = await readFile(path.join(sourceDir, file), 'utf8');
    return [`// ---- ${file} ----`, content.trimEnd()].join('\n');
  }),
);

await writeFile(outputFile, `${chunks.join('\n\n')}\n`, 'utf8');
console.log(`Bundled ${files.length} Apps Script files into ${path.relative(repoRoot, outputFile)}`);
