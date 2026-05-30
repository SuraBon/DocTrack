import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const srcDir = resolve('gas-src');
const outFile = resolve('google_apps_script.js');

const files = (await readdir(srcDir)).filter(name => name.endsWith('.gs')).sort();
let bundle = '// Generated Google Apps Script bundle. Do not edit directly.\n';
for (const file of files) {
  const source = await readFile(join(srcDir, file), 'utf8');
  bundle += `\n// --- ${file} ---\n`;
  bundle += source.replace(/\r\n/g, '\n').trim();
  bundle += '\n';
}

await writeFile(outFile, bundle, 'utf8');
console.log(`Bundled ${files.length} GAS source files to ${outFile}`);
