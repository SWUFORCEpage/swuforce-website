import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isConfirmed, isCurrentExecutive, isAdministrator, canModerate, canReply,
  canViewPost, validCohort, validText, badges,
} from '../server/permissions.js';

const ordinary = { id: 'member', is_verified: true, membership_status: 'active', current_executive: false, site_admin: false };
const graduate = { ...ordinary, membership_status: 'alumni' };
const executive = { ...ordinary, current_executive: true };
const administrator = { ...ordinary, site_admin: true };
const pending = { ...ordinary, is_verified: false, membership_status: 'pending', current_executive: false };

test('only verified, currently active executives can answer', () => {
  assert.equal(canReply(executive), true);
  assert.equal(canReply(administrator), false);
  assert.equal(canReply(ordinary), false);
  assert.equal(canReply(pending), false);
  assert.equal(canReply({ ...executive, membership_status: 'alumni' }), false);
});
test('administrator and active executive can moderate; alumni cannot', () => {
  assert.equal(canModerate(administrator), true);
  assert.equal(canModerate(executive), true);
  assert.equal(canModerate(ordinary), false);
  assert.equal(canModerate({ ...administrator, membership_status: 'alumni' }), false);
  assert.equal(isAdministrator(administrator), true);
  assert.equal(isCurrentExecutive(executive), true);
  assert.equal(isConfirmed(graduate), true);
});
test('anonymous cannot read private posts without correct one-time link token', () => {
  const post = { author_id: ordinary.id, visibility: 'private', is_hidden: false, guest_token_hash: 'hash' };
  assert.equal(canViewPost(post, null, null), false);
  assert.equal(canViewPost(post, null, 'bad-hash'), false);
  assert.equal(canViewPost(post, null, 'hash'), true);
  assert.equal(canViewPost(post, ordinary, null), true);
  assert.equal(canViewPost(post, graduate, null), true);
  assert.equal(canViewPost(post, executive, null), true);
  assert.equal(canViewPost({ ...post, is_hidden: true }, ordinary, 'hash'), false);
  assert.equal(canViewPost({ ...post, is_hidden: true }, executive, null), true);
  assert.equal(canViewPost({ ...post, visibility: 'public' }, null, null), true);
});
test('unverified user cannot display official badges and badge deduping works', () => {
  const today = new Date().toISOString().slice(0, 10);
  const profile = { ...ordinary, cohort: '7.5' };
  assert.deepEqual(badges(pending), []);
  assert.deepEqual(badges(profile, [
    { position: 'president', start_on: today, end_on: null },
    { position: 'president', start_on: today, end_on: null },
    { position: 'vice_president', start_on: '2024-01-01', end_on: '2024-12-31' },
  ]), ['7.5기','활동 학회원','현 회장','전 부회장']);
});
test('user input length and half-cohort format', () => {
  assert.equal(validCohort('7.5'), true);
  assert.equal(validCohort('8'), true);
  assert.equal(validCohort('0'), false);
  assert.equal(validCohort('8.2'), false);
  assert.equal(validText('  안녕하세요 ', 2, 20), true);
  assert.equal(validText('  ', 2, 20), false);
});
