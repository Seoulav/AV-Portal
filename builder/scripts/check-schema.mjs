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
process.exitCode = failed ? 1 : 0;
