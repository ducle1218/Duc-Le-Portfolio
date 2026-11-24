import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../tools/application-helper/popup.mjs', import.meta.url), 'utf8');
const router = source.slice(source.indexOf('let chosenFrame='), source.indexOf('let continuing='));
const page = 'https://example.test/careers';
const portal = 'https://jobs.example.test/container';
const form = 'https://apply.example.test/form';
const data = (url, frames = [], labels = []) => ({
  url, applicationFrames: frames, fields: labels.map(label => ({label})), chatFrames: []
});
const docs = [
  data(page, [portal], ['Newsletter email']),
  data(portal, [form]),
  data(form, [], ['First name', 'Phone', 'Email address']),
  data('https://unrelated.test/form', [], ['First name', 'Phone', 'Email address'])
];
const parents = [-1, 0, 1, 0];
const scanned = [];
const nodes = new Map();
const $ = key => {
  if (!nodes.has(key)) nodes.set(key, {});
  return nodes.get(key);
};
const permissions = new Set([portal, form].map(url => new URL(url).origin + '/*'));
const chrome = {
  permissions: {contains: async ({origins}) => permissions.has(origins[0])},
  webNavigation: {getAllFrames: async () => docs.map((doc, id) => ({
    frameId: id, parentFrameId: parents[id], documentId: String(id), url: doc.url
  }))},
  scripting: {executeScript: async ({target}) => {
    const id = Number(target.documentIds?.[0] || 0);
    scanned.push(id);
    return [{frameId: id, documentId: String(id), result: docs[id]}];
  }}
};
const scan = vm.runInNewContext(router + '\nscanDocument', {chrome, URL, $, setTimeout, formBridge(){}});
assert.equal((await scan({id: 1, url: page})).documentId, '2');
assert.deepEqual(scanned, [0, 1, 2]);
permissions.delete(new URL(form).origin + '/*');
scanned.length = 0;
await assert.rejects(scan({id: 1, url: page}), /Enable the embedded form/);
assert.deepEqual(scanned, [0, 1]);
assert.match($('allow-chat').textContent, /apply\.example\.test/);
console.log('Nested job frame selected, unrelated sibling excluded, host access scoped.');
