// JSON Schema(2020-12)를 ajv strict 모드로 컴파일하고 예제를 검사한다(B-20261006-03 결정 F-b).
//   npm run check:schema
// 예제 3종은 통과해야 하고, 일부러 깨뜨린 사본은 거부돼야 한다.
import { readFileSync } from 'node:fs';
import Ajv from 'ajv/dist/2020.js';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const ajv = new Ajv({ strict: true, allErrors: true });
const validate = ajv.compile(read('../schema/diagram-1.2.schema.json'));
const examples = ['small-room', 'auditorium-audio', 'rtcom-extender'].map(name => `../examples/${name}.diagram.json`);
let failed = 0;
for (const path of examples) {
  const ok = validate(read(path));
  console.log(`${ok ? '통과' : '실패'} ${path}`);
  if (!ok) { failed += 1; console.log(JSON.stringify(validate.errors?.slice(0, 5), null, 2)); }
}
const broken = [
  ['version 1.1', d => { d.version = '1.1'; }],
  ['단자 signals 없음', d => { delete d.nodes.find(n => n.type === 'equipment').data.outputs[0].signals; }],
  ['엣지 sourceHandle 없음', d => { delete d.edges[0].sourceHandle; }],
  ['알 수 없는 이슈 코드', d => { d.issues.push({ code: 'nope', severity: 'info', target: {} }); }],
];
for (const [name, mutate] of broken) {
  const diagram = read(examples[0]);
  mutate(diagram);
  const ok = validate(diagram);
  console.log(`${ok ? '통과(문제)' : '거부'} 깨진 사본: ${name}`);
  if (ok) failed += 1;
}
// Portal 반영 요청(B-20261013-02): 스키마가 strict로 컴파일되고, 문서의 모양은 통과·깨진 사본은 거부된다
const validateRequest = ajv.compile(read('../schema/builder-io-request-1.0.schema.json'));
const row = { group: 'Input', connector: 'HDMI', signal: 'HDMI', direction: 'IN', quantity: '2' };
const request = {
  schema: 'av-portal.builder-io-request', schemaVersion: '1.0.0', productId: 'example', source: 'portal', unitId: 'example',
  library: { catalogSha: 'c', detailSetSha: 'd' },
  changes: [{ op: 'add', row, reason: '' }, { op: 'update', ioIndex: 3, before: row, after: { ...row, quantity: '1' }, reason: '매뉴얼 12쪽' }, { op: 'remove', ioIndex: 5, before: row, reason: '' }],
};
const requestOk = validateRequest(request);
console.log(`${requestOk ? '통과' : '실패'} Portal 반영 요청 예시`);
if (!requestOk) { failed += 1; console.log(JSON.stringify(validateRequest.errors?.slice(0, 5), null, 2)); }
for (const [name, mutate] of [['op 없음', r => { delete r.changes[0].op; }], ['remove에 after', r => { r.changes[2].after = row; }], ['source 다름', r => { r.source = 'x'; }]]) {
  const copy = structuredClone(request);
  mutate(copy);
  const ok = validateRequest(copy);
  console.log(`${ok ? '통과(문제)' : '거부'} 깨진 요청: ${name}`);
  if (ok) failed += 1;
}
process.exitCode = failed ? 1 : 0;
