const badge = document.querySelector('[data-system-version]');

if (badge) {
  const heading = document.createElement('b');
  heading.textContent = 'AV 장비 자료실';
  let detail = 'DOCUMENT BASED · 확인 필요';
  badge.title = '버전 확인 필요';
  try {
    const response = await fetch(new URL('./version.json', import.meta.url), { cache: 'no-store' });
    if (!response.ok) throw new Error(`Version metadata ${response.status}`);
    const metadata = await response.json();
    detail = `DOCUMENT BASED · v${metadata.version} · ${metadata.build}`;
    badge.title = [
      metadata.revision && `커밋 ${metadata.revision}`,
      metadata.deployedAt && `배포 시각 ${metadata.deployedAt}`
    ].filter(Boolean).join(' · ') || '시스템 버전';
  } catch {
    // The fixed site label remains available when deployment metadata cannot load.
  }
  badge.append(heading, document.createElement('br'), detail);
}
