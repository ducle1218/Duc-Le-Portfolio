// Host the pinned PDF renderer with the portfolio; no third-party viewer or CDN.
import { copyFile, cp, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(process.argv[2] || resolve(root, 'node_modules/pdfjs-dist'));
const target = resolve(root, 'src/vendor/pdfjs');
const { version } = JSON.parse(await readFile(resolve(source, 'package.json'), 'utf8'));
if (version !== '6.4.299') throw new Error(`Expected PDF.js 6.4.299, received ${version}`);
await mkdir(target, { recursive: true });
for (const name of ['pdf.min.mjs', 'pdf.worker.min.mjs']) {
  await copyFile(resolve(source, 'build', name), resolve(target, name));
}
for (const name of ['cmaps', 'standard_fonts', 'wasm']) {
  await cp(resolve(source, name), resolve(target, name), { recursive: true });
}
await copyFile(resolve(source, 'LICENSE'), resolve(target, 'LICENSE'));
console.log(`Prepared PDF.js ${version} for the resume preview.`);
