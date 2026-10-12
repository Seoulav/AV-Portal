const tables = {
  'Analog Way': {
    manufacturer: 'Analog Way',
    title: 'Analog Way \uB808\uC774\uC5B4 \uC218 \uD55C\uB208\uC5D0 \uBCF4\uAE30',
    definition: 'Aquilon\uC740 4K\uC640 DL/2K\uB97C \uC0C1\uD638 \uB300\uC751\uD558\uB294 \uD63C\uD569 \uB808\uC774\uC5B4\uB85C \uD45C\uAE30\uD558\uBA70, \uBD84\uD560 \uB808\uC774\uC5B4\uB294 \uD63C\uD569 \uC218\uC758 2\uBC30\uC785\uB2C8\uB2E4. Zenith, Pulse, Eikos\uB294 \uD63C\uD569\uACFC \uBD84\uD560\uC744 \uB098\uB204\uC5B4 \uD45C\uAE30\uD558\uBA70, \uC2A4\uD06C\uB9B0 \uAD6C\uC131\uC5D0 \uB530\uB77C \uD55C\uB3C4\uAC00 \uB2EC\uB77C\uC9D1\uB2C8\uB2E4.',
    rows: [
      { slug: 'aquilon-rs1', product: 'Aquilon RS1', input4k: '16', output4k: '8', layers4k: '4', layers2k: '8', note: 'Aquilon\uC740 \uCD5C\uB300 \uD63C\uD569 \uC218\uB85C \uD45C\uAE30; \uBD84\uD560 8 / 16' },
      { slug: 'aquilon-rs2', product: 'Aquilon RS2', input4k: '16', output4k: '12', layers4k: '8', layers2k: '16', note: 'Aquilon\uC740 \uCD5C\uB300 \uD63C\uD569 \uC218\uB85C \uD45C\uAE30; \uBD84\uD560 16 / 32' },
      { slug: 'aquilon-rs4', product: 'Aquilon RS4', input4k: '24', output4k: '16', layers4k: '12', layers2k: '24', note: '\uCD5C\uB300 \uD63C\uD569; \uBD84\uD560 24 / 48; PGM 120 MP @10bit 4:4:4, 60Hz' },
      { slug: 'zenith-100', product: 'Zenith 100', input4k: '11 + 2\u00d72K', output4k: '4', layers4k: '3 \uD63C\uD569 / 6 \uBD84\uD560', layers2k: '\u2014', note: '4K \uB808\uC774\uC5B4\uB9CC \uD45C\uAE30; PGM 4K60 \uCD9C\uB825 3\uAC1C' },
      { slug: 'zenith-200', product: 'Zenith 200', input4k: '14 + 2\u00d72K', output4k: '6', layers4k: '4 \uD63C\uD569 / 8 \uBD84\uD560', layers2k: '\u2014', note: '4K \uB808\uC774\uC5B4\uB9CC \uD45C\uAE30; PGM 4K60 \uCD9C\uB825 4\uAC1C' },
      { slug: 'pulse-4k', product: 'Pulse 4K', input4k: '8 + 2\u00d72K', output4k: '2', layers4k: '2 \uD63C\uD569 / 4 \uBD84\uD560', layers2k: '\u2014', note: '\uC2E4\uC2DC \uBC30\uACBD + 4K \uB808\uC774\uC5B4 + 4K \uC815\uC9C0\uC601\uC0C1 \uC804\uACBD 1\uAC1C' },
      { slug: 'eikos-4k', product: 'Eikos 4K', input4k: '8 + 2\u00d72K', output4k: '2', layers4k: '2 \uD63C\uD569 / 4 \uBD84\uD560', layers2k: '\u2014', note: 'Pulse 4K\uC640 \uAC19\uC740 \uB808\uC774\uC5B4; Hard/Soft Edge \uBAA8\uB4DC' }
    ]
  },
  'NovaStar': {
    manufacturer: 'NovaStar',
    title: 'NovaStar \uB808\uC774\uC5B4 \uC218 \uD55C\uB208\uC5D0 \uBCF4\uAE30',
    definition: '\uCD9C\uB825 \uCE74\uB4DC 1\uB9E4\uB2F9 2K 16, DL 8, 4K 4\uAC1C\uC758 \uC790\uC6D0\uC785\uB2C8\uB2E4. \uC2E4\uC81C \uC7A5\uBE44 \uD55C\uB3C4\uB294 \uC774 \uC790\uC6D0\uACFC \uC12C\uC2DC \uCD5C\uB300 \uB808\uC774\uC5B4 \uC218 \uC911 \uC791\uC740 \uAC12\uC785\uB2C8\uB2E4.',
    rows: [
      { slug: 'novastar-h2', product: 'H Series H2', input4k: '16 ch', output4k: '8 ch', layers4k: '4 / output card', layers2k: '16 / output card', note: 'DL 8 / \uCE74\uB4DC; \uC12C\uC2DC \uD55C\uB3C4 32\uB808\uC774\uC5B4 (\uCD9C\uB825 \uCE74\uB4DC \uCD5C\uB300 2\uB9E4)' },
      { slug: 'novastar-h5', product: 'H Series H5', input4k: '40 ch', output4k: '12 ch', layers4k: '4 / output card', layers2k: '16 / output card', note: 'DL 8 / \uCE74\uB4DC; \uC12C\uC2DC \uD55C\uB3C4 48\uB808\uC774\uC5B4 (\uCD9C\uB825 \uCE74\uB4DC \uCD5C\uB300 3\uB9E4)' }
    ]
  },
  'Colorlight': {
    manufacturer: 'Colorlight',
    title: 'Colorlight \uB808\uC774\uC5B4 \uC218 \uD55C\uB208\uC5D0 \uBCF4\uAE30',
    definition: '\uC0AC\uC591\uC11C\uAC00 \uB808\uC774\uC5B4\uB97C 4K\uC640 2K\uB85C \uBD84\uB9AC\uD558\uC9C0 \uC54A\uC544 \uCD1D \uB808\uC774\uC5B4 \uC218\uB85C \uD45C\uAE30\uD569\uB2C8\uB2E4. \uCD5C\uB300 \uB85C\uB4DC\uB294 1G \uC774\uB354\uB137 \uAE30\uC900\uC785\uB2C8\uB2E4.',
    rows: [
      { slug: 'x100pro-2u', product: 'X100 Pro-2U', input4k: '2\u00d74K / 8\u00d72K', output4k: '4\u00d74K / 16\u00d72K', layers4k: '32 (2K/4K \uAD6C\uBD84 \uC5C6\uC74C)', layers2k: '\u2014', note: '\uCD5C\uB300 \uB85C\uB4DC 26 MP (1G)' },
      { slug: 'x100pro-4u', product: 'X100 Pro-4U', input4k: '4\u00d74K / 16\u00d72K', output4k: '4\u00d74K / 16\u00d72K', layers4k: '32 (2K/4K \uAD6C\uBD84 \uC5C6\uC74C)', layers2k: '\u2014', note: '\uCD5C\uB300 \uB85C\uB4DC 26 MP (1G)' },
      { slug: 'x100pro-7u', product: 'X100 Pro-7U', input4k: '8\u00d74K / 32\u00d72K', output4k: '8\u00d74K / 32\u00d72K', layers4k: '64 (2K/4K \uAD6C\uBD84 \uC5C6\uC74C)', layers2k: '\u2014', note: '\uCD5C\uB300 \uB85C\uB4DC 52 MP (1G)' }
    ]
  }
};

const tableBySlug = new Map(Object.values(tables).flatMap(table => table.rows.map(row => [row.slug, table])));
export function layerComparisonFor(slug) {
  const table = tableBySlug.get(slug);
  return table ? { ...table, rows: table.rows.map(row => ({ ...row })), currentSlug: slug } : null;
}
