import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

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

function executableFileUrl(argvPath) {
  if (/^[a-z]:[\\/]/i.test(argvPath)) return new URL(`file:///${argvPath.replaceAll('\\', '/')}`).href;
  if (argvPath.startsWith('/')) return new URL(`file://${argvPath}`).href;
  return pathToFileURL(resolve(argvPath)).href;
}

export function isMainModule(moduleUrl, argvPath) {
  return Boolean(argvPath) && executableFileUrl(argvPath) === moduleUrl;
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

if (isMainModule(import.meta.url, process.argv[1])) {
  await stampVersion();
}
