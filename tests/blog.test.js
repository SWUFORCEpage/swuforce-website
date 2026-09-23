import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyImageBuffer, MAX_IMAGE_BYTES, newArticleImagePath } from '../server/article-media.js';
import { validatePageEntry } from '../server/site-content.js';
const base={page:'news',title:'원문 이전 테스트',body:'요약',category:'활동 기록',link_label:'원문 보기',link_url:'https://velog.io/@writer/post',image_url:'',sort_order:50,is_published:false};
test('Blog draft accepts markdown and an historical publication date',()=>{
  const item=validatePageEntry({...base,article_body:'# 본문\n\n![사진](https://example.com/1.png)',published_on:'2023-06-13'});
  assert.equal(item.article_body.startsWith('# 본문'),true);
  assert.equal(item.published_on,'2023-06-13');
});
test('Legacy entries and draft toggles may omit new fields',()=>{
  assert.equal(validatePageEntry(base).article_body,'');
  assert.equal(validatePageEntry({...base,article_body:'',published_on:null}).published_on,null);
});
test('Reject oversized markdown and invalid calendar dates',()=>{
  assert.equal(validatePageEntry({...base,article_body:'x'.repeat(100001)}),null);
  for(const published_on of ['2026-02-31','2026-13-01','tomorrow','2026-6-1'])
    assert.equal(validatePageEntry({...base,published_on}),null);
});
test('Only genuine PNG JPEG and WebP buffers pass',()=>{
  const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(12)]);
  const jpg=Buffer.from([255,216,255,224,...Array(12).fill(0)]);
  const webp=Buffer.concat([Buffer.from('RIFF'),Buffer.alloc(4),Buffer.from('WEBPVP8 ')]);
  assert.equal(verifyImageBuffer(png,'image/png').ext,'png');
  assert.equal(verifyImageBuffer(jpg,'image/jpeg').ext,'jpg');
  assert.equal(verifyImageBuffer(webp,'image/webp').ext,'webp');
  assert.equal(verifyImageBuffer(png,'image/jpeg'),null);
  assert.equal(verifyImageBuffer(Buffer.from('<svg><script>x</script></svg>'),'image/png'),null);
  assert.equal(verifyImageBuffer(Buffer.alloc(MAX_IMAGE_BYTES+1),'image/png'),null);
});
test('Image upload paths cannot contain user-controlled file names',()=>{
  assert.match(newArticleImagePath('jpg',new Date('2026-09-23T00:00:00Z')), /^articles\/2026\/[0-9a-f-]{36}\.jpg$/);
});
