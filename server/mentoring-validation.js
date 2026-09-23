/** Server-side input and permission rules for the opt-in alumni mentoring portal. */
export const MENTOR_CONSENT_VERSION = '2026-09-23-v2';
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function canBrowseMentors(profile) {
  return Boolean(profile?.is_verified && ['active', 'alumni'].includes(profile.membership_status));
}
export function canRequestMentoring(profile) {
  return Boolean(profile?.is_verified && profile.membership_status === 'active');
}
export function canOfferMentoring(profile) {
  return Boolean(profile?.is_verified && profile.membership_status === 'alumni');
}
export function parseMentorProfile(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const { job_field, job_title, introduction, show_cohort, accepting_requests, email_notifications, allow_full_question_email, consent_directory } = body;
  if (![job_field, job_title, introduction].every(x => typeof x === 'string')) return null;
  if (![show_cohort, accepting_requests, email_notifications, allow_full_question_email, consent_directory].every(x => typeof x === 'boolean')) return null;
  if (job_field.trim().length > 80 || job_title.trim().length > 80 || introduction.trim().length > 500) return null;
  if (accepting_requests && (!consent_directory || job_field.trim().length < 2)) return null;
  if (allow_full_question_email && !email_notifications) return null;
  return {
    job_field: job_field.trim(), job_title: job_title.trim(), introduction: introduction.trim(), show_cohort,
    accepting_requests, email_notifications, allow_full_question_email,
    consent_version: accepting_requests ? MENTOR_CONSENT_VERSION : null,
  };
}
export function parseMentoringRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const { mentor_id, question, share_cohort, allow_full_email, agree_collect, agree_share } = body;
  if (typeof mentor_id !== 'string' || !uuidPattern.test(mentor_id) || typeof question !== 'string') return null;
  if (![share_cohort, allow_full_email, agree_collect, agree_share].every(x => typeof x === 'boolean')) return null;
  if (!agree_collect || !agree_share || question.trim().length < 20 || question.trim().length > 2000) return null;
  return { mentor_id, question: question.trim(), share_cohort, allow_full_email, consent_version: MENTOR_CONSENT_VERSION };
}
export function shouldEmailFullQuestion(request, mentor) {
  return Boolean(request?.allow_full_email && mentor?.allow_full_question_email && mentor?.email_notifications);
}
