const badge = document.querySelector('[data-system-version]');

if (badge) {
  try {
    const response = await fetch(new URL('./version.json', import.meta.url), { cache: 'no-store' });
    if (!response.ok) throw new Error(`Version metadata ${response.status}`);
    const metadata = await response.json();
    badge.textContent = `SYSTEM v${metadata.version} · build ${metadata.build} · ${metadata.revision}`;
    badge.title = metadata.deployedAt ? `배포 시각 ${metadata.deployedAt}` : '시스템 버전';
  } catch {
    badge.textContent = 'SYSTEM VERSION · 확인 필요';
  }
}
