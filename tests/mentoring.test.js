import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canBrowseMentors, canRequestMentoring, canOfferMentoring, parseMentorProfile, parseMentoringRequest, shouldEmailFullQuestion } from '../server/mentoring-validation.js';
const active = { is_verified:true, membership_status:'active' };
const alumni = { is_verified:true, membership_status:'alumni' };
const pending = { is_verified:false, membership_status:'pending' };
const baseMentor = { job_field:'디지털포렌식', job_title:'분석가', introduction:'', show_cohort:false, accepting_requests:true, email_notifications:false, allow_full_question_email:false, consent_directory:true };
const baseRequest = { mentor_id:'00000000-0000-4000-8000-000000000001', question:'진로와 업무에 관하여 궁금한 점이 있습니다.', share_cohort:false, allow_full_email:false, agree_collect:true, agree_share:true };
test('only confirmed members see the directory; only active members send, verified alumni offer', () => {
  assert.equal(canBrowseMentors(active),true); assert.equal(canBrowseMentors(alumni),true); assert.equal(canBrowseMentors(pending),false);
  assert.equal(canRequestMentoring(active),true); assert.equal(canRequestMentoring(alumni),false); assert.equal(canRequestMentoring(pending),false);
  assert.equal(canOfferMentoring(alumni),true); assert.equal(canOfferMentoring(active),false);
});
test('alumni must explicitly opt in to directory', () => {
  assert.equal(parseMentorProfile({...baseMentor,consent_directory:false}),null);
  assert.equal(parseMentorProfile({...baseMentor,job_field:''}),null);
  assert.equal(parseMentorProfile(baseMentor).accepting_requests,true);
  assert.equal(parseMentorProfile({...baseMentor,accepting_requests:false,consent_directory:false}).accepting_requests,false);
});
test('question requires separate collection and targeted-share consent', () => {
  assert.equal(parseMentoringRequest({...baseRequest,agree_collect:false}),null);
  assert.equal(parseMentoringRequest({...baseRequest,agree_share:false}),null);
  assert.equal(parseMentoringRequest({...baseRequest,question:'짧음'}),null);
  assert.equal(parseMentoringRequest(baseRequest).share_cohort,false);
});
test('full question email requires both sides opting in', () => {
  assert.equal(shouldEmailFullQuestion({allow_full_email:false},{allow_full_question_email:true,email_notifications:true}),false);
  assert.equal(shouldEmailFullQuestion({allow_full_email:true},{allow_full_question_email:false,email_notifications:true}),false);
  assert.equal(shouldEmailFullQuestion({allow_full_email:true},{allow_full_question_email:true,email_notifications:true}),true);
  assert.equal(parseMentorProfile({...baseMentor,allow_full_question_email:true}),null);
});
