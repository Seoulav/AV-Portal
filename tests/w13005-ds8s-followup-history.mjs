import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/w13005-ds8s-followup-history.json', import.meta.url), 'utf8'));
const digest = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

// This follow-up changes only DS-8S coordinates. The original W-005 approved
// Port Map still reaches its historical checks after this narrow inverse.
export function beforeW13005FollowupProduct(current, slug) {
  if (slug !== 'ds-8s') return current;
  if (digest(current.portMap) !== fixture.approved) throw new Error('ds-8s: unexpected follow-up portMap change');
  return { ...current, portMap: structuredClone(fixture.prior) };
}

export function beforeW13005FollowupRaw(raw, slug) {
  if (slug !== 'ds-8s') return raw;
  return JSON.stringify(beforeW13005FollowupProduct(JSON.parse(raw), slug), null, 2) + '\n';
}
