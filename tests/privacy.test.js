import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { GUEST_RETENTION_DAYS, PRIVACY_NOTICE_VERSION, publicPrivacyConfig } from '../server/privacy-config.js';

const env={
  PRIVACY_OPERATOR_NAME:'SWUFORCE 운영위원회',
  PRIVACY_CONTACT_EMAIL:'privacy@example.org',
  PRIVACY_CONTACT_UNIT:'SWUFORCE 개인정보 담당',
  PRIVACY_EFFECTIVE_DATE:'2026-09-23',
  PRIVACY_PROCESSOR_DETAILS:'Supabase(인증·데이터), Render(호스팅) 계약 지역 및 국외 처리 범위를 운영진이 검토해 기재한 내용',
  PRIVACY_REVIEWED:'true',
  PRIVACY_OPERATOR_CONFIRMED:'true',
  PRIVACY_TRANSFER_REVIEWED:'true',
};
test('policy does not publish without confirmed metadata and human review',()=>{
  assert.equal(publicPrivacyConfig({}).published,false);
  assert.equal(publicPrivacyConfig({...env,PRIVACY_REVIEWED:'false'}).published,false);
  assert.equal(publicPrivacyConfig({...env,PRIVACY_OPERATOR_CONFIRMED:'false'}).published,false);
  assert.equal(publicPrivacyConfig({...env,PRIVACY_TRANSFER_REVIEWED:'false'}).published,false);
  assert.equal(publicPrivacyConfig({...env,PRIVACY_PROCESSOR_DETAILS:'Supabase 서울, Cloudflare 구체 국가 별도 확인 필요'}).published,false);
  assert.equal(publicPrivacyConfig({...env,PRIVACY_PROCESSOR_DETAILS:'Supabase [수령자 주소 확인 필요], Render 오리건'}).published,false);
  assert.equal(publicPrivacyConfig({...env,PRIVACY_PROCESSOR_DETAILS:'Cloudflare의 실제 적용 국가와 상세 조건은 별도 확인이 필요함'}).published,false);
  assert.equal(publicPrivacyConfig({...env,PRIVACY_CONTACT_EMAIL:'not-an-email'}).published,false);
  assert.equal(publicPrivacyConfig({...env,PRIVACY_PROCESSOR_DETAILS:'pending'}).published,false);
  assert.equal(publicPrivacyConfig(env).published,true);
});
test('privacy config returns only safe public metadata, no email provider secrets',()=>{
  const v=publicPrivacyConfig({...env,RESEND_API_KEY:'private-secret',MENTOR_FROM_EMAIL:'mentor@example.org',SITE_URL:'https://example.org'});
  assert.equal(v.emailProviderEnabled,true);
  assert.equal(v.contactEmail,'privacy@example.org');
  assert.equal(JSON.stringify(v).includes('private-secret'),false);
});
test('retention constants and signup policy version are stable',()=>{
  assert.equal(GUEST_RETENTION_DAYS,180);
  assert.equal(PRIVACY_NOTICE_VERSION,'2026-09-23-v3');
});
test('migration keeps legacy guest posts without a deadline and records counts only',()=>{
  const path=join(dirname(fileURLToPath(import.meta.url)),'../supabase/migrations/20260923_privacy_retention.sql');
  const sql=readFileSync(path,'utf8');
  assert.match(sql,/ADD COLUMN IF NOT EXISTS guest_delete_at/);
  assert.match(sql,/guest_delete_at IS NOT NULL/);
  assert.match(sql,/AND NOT retention_hold/);
  assert.match(sql,/privacy_retention_runs/);
  assert.match(sql,/closed_at <= now\(\) - INTERVAL '30 days'/);
  assert.doesNotMatch(sql,/DELETE\s+FROM\s+auth\.users/i);
});

test('published notice version and signup enforcement migration agree',()=>{
 const path=join(dirname(fileURLToPath(import.meta.url)),'../supabase/migrations/20260923_ENFORCE_registration_notice_POST_DEPLOY.sql');
 const sql=readFileSync(path,'utf8');
 assert.match(sql,/2026-09-23-v3/);
 assert.doesNotMatch(sql,/2026-09-23-v2/);
});
