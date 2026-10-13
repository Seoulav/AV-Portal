import assert from 'node:assert/strict';

const entry = {
  slug: 'rtcom-xdm',
  file: 'manuals/rtcom-xdm-command-guide-1013.pdf',
  kind: 'manual',
  title: 'XDM 커맨드 가이드(1013 · 사용자 제공)',
};

// Historical manifest checks still see every existing upload. Only this
// reviewed addition is removed, and any change to its metadata fails.
export function withoutXdmCommandGuideUpload(uploads) {
  const matches = uploads.filter(item => item.file === entry.file);
  assert.equal(matches.length, 1, 'XDM command guide upload count');
  assert.deepEqual(matches[0], entry, 'XDM command guide upload metadata');
  return uploads.filter(item => item.file !== entry.file);
}

export const isXdmCommandGuideManual = name => name === 'rtcom-xdm-command-guide-1013.pdf';
