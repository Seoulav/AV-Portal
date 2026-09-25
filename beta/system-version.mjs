import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export function buildVersionMetadata({ packageVersion, runNumber, sha, deployedAt }) {
  return {
    version: packageVersion,
    build: String(runNumber || 'local'),
    revision: String(sha || 'unreleased').slice(0, 7),
    deployedAt
  };
}

export function formatVersionLabel(metadata) {
  return `SYSTEM v${metadata.version} · build ${metadata.build} · ${metadata.revision}`;
}

async function stampVersion() {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const metadata = buildVersionMetadata({
    packageVersion: packageJson.version,
    runNumber: process.env.GITHUB_RUN_NUMBER,
    sha: process.env.GITHUB_SHA,
    deployedAt: new Date().toISOString()
  });
  await writeFile(new URL('./site/version.json', import.meta.url), `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  console.log(formatVersionLabel(metadata));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL(`file:///${process.argv[1].replaceAll('\\', '/')}`))) {
  await stampVersion();
}
