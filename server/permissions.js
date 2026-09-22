export function isConfirmed(profile) {
  return Boolean(profile?.is_verified && ['active', 'alumni'].includes(profile?.membership_status));
}
export function isCurrentExecutive(profile) {
  return Boolean(isConfirmed(profile) && profile.membership_status === 'active' && profile.current_executive);
}
export function isAdministrator(profile) {
  return Boolean(isConfirmed(profile) && profile.membership_status === 'active' && profile.site_admin);
}
export function canModerate(profile) {
  return isCurrentExecutive(profile) || isAdministrator(profile);
}
export function canReply(profile) {
  return isCurrentExecutive(profile);
}
export function canViewPost(post, profile, guestTokenHash) {
  if (post.is_hidden) return canModerate(profile);
  if (post.visibility === 'public') return true;
  if (canModerate(profile)) return true;
  if (profile && post.author_id === profile.id) return true;
  return Boolean(post.guest_token_hash && guestTokenHash && post.guest_token_hash === guestTokenHash);
}
export function validCohort(value) {
  return typeof value === 'string' && /^([1-9]\d?)(\.5)?$/.test(value);
}
export function validText(value, min, max) {
  return typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
}
export function badges(profile, roles = []) {
  const labels = [];
  if (!profile?.is_verified) return labels;
  if (profile.cohort && profile.cohort !== '미지정') labels.push(`${profile.cohort}기`);
  if (profile.membership_status === 'active') labels.push('활동 학회원');
  if (profile.membership_status === 'alumni') labels.push('졸업 학회원');
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
  for (const item of roles) {
    const current = item.start_on <= today && (!item.end_on || item.end_on >= today);
    labels.push(`${current ? '현' : '전'} ${item.position === 'president' ? '회장' : '부회장'}`);
  }
  return [...new Set(labels)];
}
