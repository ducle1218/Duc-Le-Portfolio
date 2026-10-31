import assert from 'node:assert/strict';
import {lstat, readFile, readdir, realpath} from 'node:fs/promises';
import {dirname, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const SITE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const EXCLUDED_PATHS = Object.freeze([
  'src/assets/resume/resume.html',
  'src/assets/resume/resume.json',
  'src/assets/resume/sync.json',
  'src/assets/images/duc_le_resume.pdf',
  'src/scripts/engineering-projects.js',
  'src/scripts/sprocket-project.js',
  'src/scripts/solar-showcase.js',
  'src/content/README.md',
  'src/content/project-facts.json',
  'src/content/project-presentation.json',
  'src/content/profile-facts.json',
  'src/content/evidence-lock.json',
]);
export const LEGACY_SCRIPT_NAMES = Object.freeze([
  'engineering-projects.js', 'sprocket-project.js', 'solar-showcase.js',
]);
export const RESUME_PATH = 'src/assets/resume/Duc_Le_Resume.pdf';
export const REQUIRED_FILES = Object.freeze([
  'index.html',
  'data/portfolio.json',
  'data/portfolio.md',
  'data/resume-manifest.json',
  'src/scripts/site.bundle.js',
  'src/styles/site.min.css',
  RESUME_PATH,
  'src/vendor/pdfjs/pdf.min.mjs',
  'src/vendor/pdfjs/pdf.worker.min.mjs',
  'src/vendor/pdfjs/LICENSE',
  ...Array.from({length: 12}, (_, index) => `src/content/projects/box-${index + 1}.html`),
]);
export const REQUIRED_DIRECTORIES = Object.freeze([
  'src/vendor/pdfjs/cmaps',
  'src/vendor/pdfjs/standard_fonts',
  'src/vendor/pdfjs/wasm',
]);

const normalize = value => value.split('\\').join('/');

// Also used by the preparer: reject missing build outputs before removing an
// earlier artifact. This reads inputs only and never regenerates the resume.
export async function checkRequiredInputs(root) {
  for (const name of REQUIRED_FILES) {
    const info = await lstat(join(root, name)).catch(error => {
      if (error.code === 'ENOENT') throw new Error(`Missing required Pages input: ${name}. Generate data/build assets and vendor PDF.js first.`);
      throw error;
    });
    assert(info.isFile() && !info.isSymbolicLink() && info.size > 0, `Pages input must be a nonempty regular file: ${name}`);
  }
  for (const name of REQUIRED_DIRECTORIES) {
    const info = await lstat(join(root, name));
    assert(info.isDirectory() && !info.isSymbolicLink(), `Missing PDF.js asset directory: ${name}`);
    assert((await readdir(join(root, name))).length > 0, `Empty PDF.js asset directory: ${name}`);
  }
}

async function packageFiles(root, folder = root) {
  const files = [];
  for (const entry of await readdir(folder, {withFileTypes: true})) {
    const full = join(folder, entry.name);
    const name = normalize(relative(root, full));
    assert(!entry.isSymbolicLink(), `Symlinks are not allowed in the Pages artifact: ${name}`);
    assert(!['.git', 'node_modules', '__pycache__'].includes(entry.name), `Internal directory leaked into Pages artifact: ${name}`);
    if (entry.isDirectory()) files.push(...await packageFiles(root, full));
    else {
      assert(entry.isFile(), `Unsupported artifact entry: ${name}`);
      files.push(name);
    }
  }
  return files;
}

export async function checkPagesPackage() {
  const root = await realpath(SITE_ROOT);
  const destination = join(root, '_site');
  const info = await lstat(destination);
  assert(info.isDirectory() && !info.isSymbolicLink(), '_site must be a real directory inside the site root');
  assert.equal(await realpath(destination), destination, '_site must not resolve outside its fixed location');
  const top = (await readdir(destination)).sort();
  assert.deepEqual(top, ['data', 'index.html', 'src'], 'Only index.html, data/, and src/ may be published');

  await checkRequiredInputs(destination);
  const files = await packageFiles(destination);
  const names = new Set(files);
  for (const name of EXCLUDED_PATHS) assert(!names.has(name), `Excluded historical/internal file was published: ${name}`);
  // Extra public data/schema documents are allowed; validate every JSON file
  // rather than requiring a fixed data-directory listing.
  for (const name of files.filter(name => name.startsWith('data/') && name.endsWith('.json'))) {
    try { JSON.parse(await readFile(join(destination, name), 'utf8')); }
    catch (error) { throw new Error(`Invalid public JSON document ${name}: ${error.message}`); }
  }
  const html = await readFile(join(destination, 'index.html'), 'utf8');
  const bundle = await readFile(join(destination, 'src/scripts/site.bundle.js'), 'utf8');
  for (const name of LEGACY_SCRIPT_NAMES) {
    assert(!html.includes(name) && !bundle.includes(name), `Current page/bundle still references excluded script: ${name}`);
  }
  const download = html.match(/<a\b[^>]*\bid=["']resume-download["'][^>]*>/i)?.[0];
  assert(download, 'The current resume download link must remain available');
  const href = download.match(/\bhref=["']([^"']+)["']/i)?.[1];
  assert.equal(href?.split(/[?#]/)[0], RESUME_PATH, 'The download must point to the canonical resume PDF');
  const [original, staged] = await Promise.all([
    readFile(join(root, RESUME_PATH)), readFile(join(destination, RESUME_PATH)),
  ]);
  assert(original.subarray(0, 5).equals(Buffer.from('%PDF-')), 'Canonical resume is not a PDF');
  assert(original.equals(staged), 'The published resume must match the canonical PDF byte for byte');
  console.log(`PASS: clean Pages artifact (${files.length} files); public data, 12 project pages, canonical resume, and PDF.js assets present.`);
  return {files: files.length};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await checkPagesPackage();
}
