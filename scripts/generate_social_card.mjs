import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createElement as h } from 'react';
import { ImageResponse } from 'next/og.js';

const font = await readFile(new URL('../public/fonts/ibm-plex-mono.ttf', import.meta.url));
const response = new ImageResponse(
  h('div', { style: { width: '100%', height: '100%', background: '#151515', color: '#fff', display: 'flex', flexDirection: 'column', padding: '58px 72px', fontFamily: 'IBM Plex Mono' } },
    h('div', { style: { display: 'flex', color: '#a4f8ac', fontSize: 32 } }, 'sunward / COMPUTE PLANNER'),
    h('div', { style: { display: 'flex', flexDirection: 'column', fontSize: 92, lineHeight: 1.05, letterSpacing: '-4px', marginTop: 38 } },
      h('div', {}, 'Good work.'), h('div', { style: { color: '#a4f8ac' } }, 'Better timing.')),
    h('div', { style: { fontSize: 27, marginTop: 28, color: '#c7cec7' } }, 'Explore when and where flexible AI jobs could run.'),
    h('div', { style: { display: 'flex', flexDirection: 'column', fontSize: 20, marginTop: 'auto', paddingTop: 22, borderTop: '1px solid #373d37', color: '#b6bdb6' } },
      h('div', {}, 'Historical carbon estimates · Simulated prices and workloads'),
      h('div', { style: { marginTop: 8 } }, 'Independent planning simulator · No real compute dispatched'))),
  { width: 1200, height: 630, fonts: [{ name: 'IBM Plex Mono', data: font, weight: 400, style: 'normal' }] },
);
const png = Buffer.from(await response.arrayBuffer());
assert.equal(png.subarray(1, 4).toString(), 'PNG');
assert.equal(png.readUInt32BE(16), 1200);
assert.equal(png.readUInt32BE(20), 630);
await writeFile(new URL('../public/social-card.png', import.meta.url), png);
console.log(`Generated public/social-card.png (${png.length} bytes, 1200 × 630).`);
