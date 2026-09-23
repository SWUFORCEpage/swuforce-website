import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONTENT_PAGES, isContentPage, safeHttpsUrl, validatePageEntry } from '../server/site-content.js';
const sample = { page:'news', title:'2026년 하반기 소식', body:'공식 안내입니다.', category:'공지', link_label:'상세 정보', link_url:'https://example.org/news', image_url:'', sort_order:10, is_published:false };
test('only known public content destinations are accepted', () => {
  for (const page of CONTENT_PAGES) assert.equal(isContentPage(page), true);
  for (const page of ['admin','login','../../me','officers',null]) assert.equal(isContentPage(page), false);
});
test('reject unsafe or oversized links and disallow HTTP', () => {
  for (const url of ['javascript:alert(1)','data:text/html,hi','http://example.com','https://user:pass@example.com','https://', 'https://example.org/'+'a'.repeat(1000)]) {
    assert.equal(safeHttpsUrl(url), null);
  }
  assert.equal(safeHttpsUrl('https://example.org/ok'), 'https://example.org/ok');
});
test('validate and normalize publishable items without HTML interpretation', () => {
  const parsed = validatePageEntry(sample);
  assert.equal(parsed.page, 'news');
  assert.equal(parsed.is_published, false);
  assert.equal(parsed.link_url, 'https://example.org/news');
  assert.deepEqual(validatePageEntry({ ...sample, body: '<script>alert(1)</script>' }).body, '<script>alert(1)</script>');
});
test('reject unknown pages, URLs, invalid order and publication flag', () => {
  for (const x of [
    { ...sample, page:'admin' }, { ...sample, link_url:'javascript:alert(1)' },
    { ...sample, image_url:'data:image/svg+xml;base64,abcd' }, { ...sample, title:'x' },
    { ...sample, sort_order:-1 }, { ...sample, sort_order:0.5 },
    { ...sample, sort_order:10000 }, { ...sample, is_published:'true' },
    { ...sample, body:'a'.repeat(2201) },
  ]) assert.equal(validatePageEntry(x), null);
});
