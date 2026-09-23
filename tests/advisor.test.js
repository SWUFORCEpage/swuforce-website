import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const main = readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
const content = readFileSync(new URL('../src/content.js',import.meta.url),'utf8');
test('official faculty advisor is correctly named Kim Seong-uk',()=>{
  assert.match(content,/name: '김성욱'/);
  assert.doesNotMatch(content,/김성웅/);
  assert.match(main,/FACULTY ADVISOR/);
});
test('faculty advisor card does not cite an unverified past record',()=>{
  assert.doesNotMatch(main,/2023 KUCIS ACTIVITY REPORT/);
  assert.doesNotMatch(main,/2023년 공식 성과자료집에 기재된 지도교수/);
  assert.match(content,/source: ''/);
});
