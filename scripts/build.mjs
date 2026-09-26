// Writes dist/chrome and dist/firefox from src/. No dependencies: `node scripts/build.mjs`.
// src/ itself is the Chrome build, so Chrome can also load src/ unpacked while developing.
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const manifest = JSON.parse(await readFile(join(src, 'manifest.json'), 'utf8'));

const targets = {
  chrome: (m) => m,
  firefox: (m) => {
    // Firefox runs MV3 backgrounds as event pages and has no offscreen API.
    m.background = { scripts: ['background.js'], type: 'module' };
    m.permissions = m.permissions.filter((p) => p !== 'offscreen');
    delete m.minimum_chrome_version;
    m.browser_specific_settings = {
      gecko: {
        id: 'via-browser-extension@via',
        strict_min_version: '140.0',
        data_collection_permissions: { required: ['none'] },
      },
    };
    return m;
  },
};

for (const [name, transform] of Object.entries(targets)) {
  const out = join(root, 'dist', name);
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  await cp(src, out, {
    recursive: true,
    filter: (p) => !(name === 'firefox' && p.includes('offscreen')),
  });
  const m = transform(structuredClone(manifest));
  await writeFile(join(out, 'manifest.json'), `${JSON.stringify(m, null, 2)}\n`);
  console.log(`dist/${name} (v${m.version})`);
}
