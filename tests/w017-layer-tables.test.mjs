import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { layerComparisonFor } from '../beta/site/detail/layer-tables.mjs';

const readDetail = slug => JSON.parse(readFileSync(new URL(`../beta/site/detail/data/${slug}.json`, import.meta.url), 'utf8'));
const expected = {
  'aquilon-rs1': ['16', '8', '4', '8'],
  'aquilon-rs2': ['16', '12', '8', '16'],
  'aquilon-rs4': ['24', '16', '12', '24'],
  'zenith-100': ['11 + 2\u00d72K', '4', '3 \uD63C\uD569 / 6 \uBD84\uD560', '\u2014'],
  'zenith-200': ['14 + 2\u00d72K', '6', '4 \uD63C\uD569 / 8 \uBD84\uD560', '\u2014'],
  'pulse-4k': ['8 + 2\u00d72K', '2', '2 \uD63C\uD569 / 4 \uBD84\uD560', '\u2014'],
  'eikos-4k': ['8 + 2\u00d72K', '2', '2 \uD63C\uD569 / 4 \uBD84\uD560', '\u2014'],
  'novastar-h2': ['16 ch', '8 ch', '4 / output card', '16 / output card'],
  'novastar-h5': ['40 ch', '12 ch', '4 / output card', '16 / output card'],
  'x100pro-2u': ['2\u00d74K / 8\u00d72K', '4\u00d74K / 16\u00d72K', '32 (2K/4K \uAD6C\uBD84 \uC5C6\uC74C)', '\u2014'],
  'x100pro-4u': ['4\u00d74K / 16\u00d72K', '4\u00d74K / 16\u00d72K', '32 (2K/4K \uAD6C\uBD84 \uC5C6\uC74C)', '\u2014'],
  'x100pro-7u': ['8\u00d74K / 32\u00d72K', '8\u00d74K / 32\u00d72K', '64 (2K/4K \uAD6C\uBD84 \uC5C6\uC74C)', '\u2014']
};

test('layer comparison includes the approved 12 products in three manufacturer-only tables', () => {
  const owners = new Map();
  for (const [slug, values] of Object.entries(expected)) {
    const table = layerComparisonFor(slug);
    assert.ok(table, `${slug} should have a comparison table`);
    const row = table.rows.find(item => item.slug === slug);
    assert.ok(row, `${slug} should have exactly one row in its manufacturer table`);
    assert.deepEqual([row.input4k, row.output4k, row.layers4k, row.layers2k], values, slug);
    assert.equal(owners.has(slug), false);
    owners.set(slug, table.manufacturer);
  }
  assert.equal(owners.size, 12);
  assert.equal(layerComparisonFor('rtcom-xdm-wos100'), null);
  assert.equal(layerComparisonFor('unrelated-device'), null);
  assert.equal(layerComparisonFor('aquilon-rs4').manufacturer, 'Analog Way');
  assert.equal(layerComparisonFor('novastar-h2').manufacturer, 'NovaStar');
  assert.equal(layerComparisonFor('x100pro-2u').manufacturer, 'Colorlight');
});

test('comparison figures agree with verified product detail specifications', () => {
  const rs4 = readDetail('aquilon-rs4');
  const input = rs4.specifications.find(item => item.group === 'Input' && item.name === '\uAD6C\uC131')?.value ?? '';
  const output = rs4.specifications.find(item => item.group === 'Output' && item.name === '\uAD6C\uC131')?.value ?? '';
  assert.match(input, /24x 4K60p/);
  assert.match(output, /16x 4K60p/);
  assert.match(rs4.specifications.find(item => item.group === 'Processing' && item.name === '\uB808\uC774\uC5B4')?.value, /12x 4K.*24x DL\/2K/);
  assert.deepEqual(rs4.images.map(item => item.role), ['Front', 'Rear']);
  assert.ok(rs4.sources.some(item => item.url.endsWith('Aquilon-RS4-datasheet-en-20260703.pdf')));
});

test('table data explains manufacturer-specific layer limits and never treats XDM-WOS100 as confirmed', () => {
  const aquilon = layerComparisonFor('aquilon-rs4');
  const novastar = layerComparisonFor('novastar-h5');
  const colorlight = layerComparisonFor('x100pro-7u');
  assert.match(aquilon.definition, /Aquilon/);
  assert.match(novastar.definition, /\uCD9C\uB825 \uCE74\uB4DC/);
  assert.match(colorlight.definition, /\uBD84\uB9AC\uD558\uC9C0 \uC54A\uC544/);
});

test('detail renderer provides an accessible, internally scrollable comparison table', () => {
  const app = readFileSync(new URL('../beta/site/detail/app.js', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../beta/site/detail/styles.css', import.meta.url), 'utf8');
  assert.match(app, /layerComparisonFor\(productKey\)/);
  assert.match(app, /aria-current/);
  assert.match(css, /\.layer-table-scroll[^}]*overflow-x:\s*auto/s);
  assert.match(css, /\.layer-table-scroll table[^}]*min-width/s);
});
