export const PRIVACY_NOTICE_VERSION = '2026-09-23-v2';
export const GUEST_RETENTION_DAYS = 180;
const isEmail = value => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export function publicPrivacyConfig(env = process.env) {
  const operator = String(env.PRIVACY_OPERATOR_NAME || '').trim();
  const contactEmail = String(env.PRIVACY_CONTACT_EMAIL || '').trim();
  const contactUnit = String(env.PRIVACY_CONTACT_UNIT || '').trim();
  const contactPhone = String(env.PRIVACY_CONTACT_PHONE || '').trim();
  const effectiveDate = String(env.PRIVACY_EFFECTIVE_DATE || '').trim();
  const processorDetails = String(env.PRIVACY_PROCESSOR_DETAILS || '').trim();
  const reviewed = env.PRIVACY_REVIEWED === 'true';
  const published = Boolean(reviewed && operator.length >= 2 && contactUnit.length >= 2 && isEmail(contactEmail)
    && /^\d{4}-\d\d-\d\d$/.test(effectiveDate)
    && !Number.isNaN(new Date(`${effectiveDate}T00:00:00Z`).getTime())
    && processorDetails.length >= 25);
  return { operator: operator || null, contactUnit:contactUnit || null, contactPhone:contactPhone || null, contactEmail: isEmail(contactEmail) ? contactEmail : null,
    effectiveDate: effectiveDate || null, processorDetails: processorDetails || null,
    published, noticeVersion: PRIVACY_NOTICE_VERSION,
    emailProviderEnabled: Boolean(env.RESEND_API_KEY && env.MENTOR_FROM_EMAIL && env.SITE_URL),
    turnstileEnabled: Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY),
  };
}
