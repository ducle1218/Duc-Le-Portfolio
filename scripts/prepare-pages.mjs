import assert from 'node:assert/strict';
import {copyFile, cp, lstat, mkdir, readFile, realpath, rm} from 'node:fs/promises';
import {dirname, isAbsolute, join, relative, resolve} from 'node:path';
import {
  SITE_ROOT, EXCLUDED_PATHS, LEGACY_SCRIPT_NAMES,
  checkPagesPackage, checkRequiredInputs,
} from './check-pages-package.mjs';

const root = await realpath(SITE_ROOT);
const destination = resolve(root, '_site');
const excluded = new Set(EXCLUDED_PATHS);
const normalize = value => value.split('\\').join('/');

await checkRequiredInputs(root);
const scripts = JSON.parse(await readFile(join(root, 'scripts/site-scripts.json'), 'utf8'));
for (const name of LEGACY_SCRIPT_NAMES) {
  assert(!scripts.some(file => file.endsWith('/' + name)), `Cannot exclude an active build script: ${name}`);
}

// This is the sole recursive deletion. Resolve both paths first, require the
// fixed immediate child, and reject symlinks/junctions instead of following one.
assert.equal(relative(root, destination), '_site', 'Unsafe Pages destination');
assert.equal(dirname(destination), root, 'Pages destination must be directly inside the site root');
const existing = await lstat(destination).catch(error => {
  if (error.code === 'ENOENT') return null;
  throw error;
});
if (existing) {
  assert(existing.isDirectory() && !existing.isSymbolicLink(), 'Refusing to remove a non-directory or symlink at _site');
  assert.equal(await realpath(destination), destination, 'Refusing to remove an _site path that resolves elsewhere');
}
await rm(destination, {recursive: true, force: true});
await mkdir(destination);

async function include(source) {
  const name = normalize(relative(root, source));
  assert(name && name !== '..' && !name.startsWith('../') && !isAbsolute(name), `Copy source escaped site root: ${source}`);
  if (excluded.has(name)) return false;
  const info = await lstat(source);
  assert(!info.isSymbolicLink(), `Refusing to publish a symlink: ${name}`);
  assert(info.isFile() || info.isDirectory(), `Unsupported Pages source: ${name}`);
  assert(!name.split('/').some(part => ['.git', 'node_modules', '__pycache__'].includes(part)), `Internal path in public source: ${name}`);
  return true;
}

await copyFile(join(root, 'index.html'), join(destination, 'index.html'));
for (const name of ['data', 'src']) {
  await cp(join(root, name), join(destination, name), {
    recursive: true, force: false, errorOnExist: true, dereference: false, filter: include,
  });
}
await checkPagesPackage();
console.log('Pages publish directory: _site/ (source files and canonical PDF unchanged).');
