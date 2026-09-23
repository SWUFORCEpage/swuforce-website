import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { existsSync } from 'node:fs';
import {
  isConfirmed, isCurrentExecutive, isAdministrator, canModerate, canReply,
  canViewPost, validText, badges,
} from './permissions.js';
import { isContentPage, validatePageEntry } from './site-content.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {
  SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY,
  TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY,
} = process.env;
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_SECRET_KEY) {
  console.error('SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY are required.');
  process.exit(1);
}
if (Boolean(TURNSTILE_SITE_KEY) !== Boolean(TURNSTILE_SECRET_KEY)) {
  console.error('Set BOTH Turnstile environment variables or NEITHER.');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
const origin = new URL(SUPABASE_URL).origin;
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", origin, 'https://challenges.cloudflare.com'],
      scriptSrc: ["'self'", 'https://challenges.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      frameSrc: ['https://challenges.cloudflare.com', 'https://www.youtube-nocookie.com'],
    },
  },
}));
app.use(express.json({ limit: '32kb' }));

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const route = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
function required(errorMessage, error) {
  if (error) { console.error('[database]', error.message); throw new HttpError(503, errorMessage); }
}
function sha256(value) { return createHash('sha256').update(value).digest('hex'); }
function checkGuestToken(post, token) {
  if (!token || !post.guest_token_hash || token.length > 120) return null;
  const given = Buffer.from(sha256(token), 'hex');
  const stored = Buffer.from(post.guest_token_hash, 'hex');
  return stored.length === given.length && timingSafeEqual(stored, given) ? post.guest_token_hash : null;
}
async function actor(req) {
  const authorization = req.get('authorization');
  if (!authorization) return null;
  const token = /^Bearer\s+(.+)$/i.exec(authorization)?.[1];
  if (!token) throw new HttpError(401, '올바른 로그인 정보가 필요합니다.');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, '로그인이 만료되었습니다. 다시 로그인해 주세요.');
  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('*').eq('id', data.user.id).single();
  required('회원 정보를 불러올 수 없습니다.', profileError);
  return profile;
}
async function authenticated(req) {
  const profile = await actor(req);
  if (!profile) throw new HttpError(401, '로그인이 필요합니다.');
  return profile;
}
async function executive(req) {
  const profile = await authenticated(req);
  if (!canModerate(profile)) throw new HttpError(403, '현재 운영진에게만 허용된 기능입니다.');
  return profile;
}
async function admin(req) {
  const profile = await authenticated(req);
  if (!isAdministrator(profile)) throw new HttpError(403, '관리자 권한이 필요합니다.');
  return profile;
}
async function verifyTurnstile(token, remoteip) {
  if (!TURNSTILE_SECRET_KEY) {
    if (process.env.NODE_ENV === 'production') throw new HttpError(503, '비회원 글쓰기 보호 설정을 준비 중입니다.');
    return;
  }
  if (typeof token !== 'string' || !token || token.length > 2048) {
    throw new HttpError(400, '자동 작성 방지 인증을 완료해 주세요.');
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    let response;
    try {
      response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: token, remoteip: remoteip || '' }),
        signal: controller.signal,
      });
    } finally { clearTimeout(timeout); }
    if (!response.ok) throw new Error('Siteverify unreachable');
    const data = await response.json();
    if (!data.success) throw new HttpError(400, '자동 작성 방지 인증에 실패했습니다. 다시 시도해 주세요.');
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(503, '자동 작성 방지 서비스를 잠시 이용할 수 없습니다.');
  }
}
const guestPostingAllowed = Boolean(TURNSTILE_SITE_KEY) || process.env.NODE_ENV !== 'production';
const guestLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: '비회원 글 작성 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요.' },
});
const replyLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 40, standardHeaders: 'draft-7', legacyHeaders: false });

app.get('/api/health', (_, res) => res.json({ ok: true }));
// Public site contents (published entries only); private editing is gated below.
app.get('/api/content/:page', route(async (req, res) => {
  if (!isContentPage(req.params.page)) throw new HttpError(404, '페이지를 찾지 못했습니다.');
  if (req.params.page === 'me') await authenticated(req);
  const { data, error } = await supabase.from('page_entries')
    .select('id,page,category,title,body,link_label,link_url,image_url,sort_order')
    .eq('page', req.params.page).eq('is_published', true)
    .order('sort_order', { ascending:true }).order('created_at', { ascending:false }).limit(60);
  required('페이지 정보를 불러올 수 없습니다. 데이터베이스 마이그레이션을 확인해 주세요.', error);
  res.json({ entries: data || [] });
}));
app.get('/api/admin/content/:page', route(async (req, res) => {
  await admin(req);
  if (!isContentPage(req.params.page)) throw new HttpError(404, '페이지를 찾지 못했습니다.');
  const { data, error } = await supabase.from('page_entries').select('*')
    .eq('page', req.params.page).order('sort_order', { ascending:true })
    .order('created_at', { ascending:false }).limit(200);
  required('페이지 항목을 불러올 수 없습니다. 데이터베이스 마이그레이션을 확인해 주세요.', error);
  res.json({ entries: data || [] });
}));
app.post('/api/admin/content', route(async (req, res) => {
  const operator = await admin(req);
  const item = validatePageEntry(req.body);
  if (!item) throw new HttpError(400, '페이지, 제목, 본문, HTTPS 링크, 정렬 및 공개 설정을 확인해 주세요.');
  const { data, error } = await supabase.from('page_entries')
    .insert({ ...item, created_by:operator.id, updated_by:operator.id })
    .select('id,page').single();
  required('페이지 항목을 추가하지 못했습니다.', error);
  res.status(201).json(data);
}));
app.patch('/api/admin/content/:id', route(async (req, res) => {
  const operator = await admin(req);
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) throw new HttpError(400, '항목 ID가 올바르지 않습니다.');
  const item = validatePageEntry(req.body);
  if (!item) throw new HttpError(400, '페이지, 제목, 본문, HTTPS 링크, 정렬 및 공개 설정을 확인해 주세요.');
  const { data, error } = await supabase.from('page_entries')
    .update({ ...item, updated_by:operator.id, updated_at:new Date().toISOString() })
    .eq('id', req.params.id).select('id,page').maybeSingle();
  required('페이지 항목을 수정하지 못했습니다.', error);
  if (!data) throw new HttpError(404, '항목을 찾지 못했습니다.');
  res.json(data);
}));
app.delete('/api/admin/content/:id', route(async (req, res) => {
  await admin(req);
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) throw new HttpError(400, '항목 ID가 올바르지 않습니다.');
  const { data, error } = await supabase.from('page_entries')
    .delete().eq('id', req.params.id).select('id').maybeSingle();
  required('항목을 삭제하지 못했습니다.', error);
  if (!data) throw new HttpError(404, '항목을 찾지 못했습니다.');
  res.json({ ok:true });
}));

app.get('/api/config', (_, res) => res.json({
  supabaseUrl: SUPABASE_URL,
  publishableKey: SUPABASE_PUBLISHABLE_KEY,
  turnstileSiteKey: TURNSTILE_SITE_KEY || null,
  guestPostingAllowed,
}));
app.get('/api/me', route(async (req, res) => {
  const profile = await actor(req);
  res.json({ profile: profile && {
    id: profile.id, display_name: profile.display_name, cohort: profile.cohort,
    requested_status: profile.requested_status, membership_status: profile.membership_status,
    is_verified: profile.is_verified, current_executive: profile.current_executive,
    site_admin: profile.site_admin, public_opt_in: profile.public_opt_in,
    badges: badges(profile), can_reply: canReply(profile),
    can_moderate: canModerate(profile), can_administer: isAdministrator(profile),
  } });
}));
app.patch('/api/me', route(async (req, res) => {
  const profile = await authenticated(req);
  if (typeof req.body.public_opt_in !== 'boolean') throw new HttpError(400, '공개 여부를 선택해 주세요.');
  const { data, error } = await supabase.from('profiles')
    .update({ public_opt_in: req.body.public_opt_in })
    .eq('id', profile.id).select('public_opt_in').single();
  required('공개 설정을 저장하지 못했습니다.', error);
  res.json(data);
}));

async function publicOfficerTerms() {
  const { data: terms, error } = await supabase.from('officer_terms')
    .select('id,profile_id,term_label,position,start_on,end_on,is_published')
    .eq('is_published', true).order('start_on', { ascending: false });
  required('운영진 이력을 불러오지 못했습니다.', error);
  const ids = [...new Set((terms || []).map(term => term.profile_id))];
  if (!ids.length) return [];
  const { data: profiles, error: pe } = await supabase.from('profiles')
    .select('id,display_name,cohort,membership_status,is_verified,public_opt_in')
    .in('id', ids);
  required('운영진 이력을 불러오지 못했습니다.', pe);
  const people = new Map(profiles.map(p => [p.id, p]));
  return terms.filter(term => {
    const profile = people.get(term.profile_id);
    return profile && isConfirmed(profile) && profile.public_opt_in;
  }).map(({ profile_id, is_published, ...term }) => ({ ...term,
    display_name: people.get(profile_id).display_name,
    cohort: people.get(profile_id).cohort,
  }));
}
app.get('/api/officers', route(async (_, res) => {
  res.json({ terms: await publicOfficerTerms() });
}));
app.get('/api/members', route(async (_, res) => {
  const { data, error } = await supabase.from('profiles')
    .select('id,display_name,cohort,membership_status,is_verified,public_opt_in')
    .eq('is_verified', true).eq('public_opt_in', true)
    .in('membership_status', ['active', 'alumni'])
    .order('cohort', { ascending: false });
  required('학회원 명단을 불러오지 못했습니다.', error);
  const terms = await publicOfficerTerms();
  // Public role badges are associated by profile_id privately on the server.
  const activePublicTermIds = new Set(terms.map(t => t.id));
  const { data: allPublished, error: ate } = await supabase.from('officer_terms')
    .select('id,profile_id,position,start_on,end_on').eq('is_published', true);
  required('학회원 명단을 불러오지 못했습니다.', ate);
  res.json({ members: (data || []).map(({ id, is_verified, public_opt_in, ...p }) => ({
    display_name: p.display_name, cohort: p.cohort, membership_status: p.membership_status,
    badges: badges({ ...p, is_verified }, (allPublished || []).filter(t => t.profile_id === id && activePublicTermIds.has(t.id))),
  })) });
}));

app.get('/api/board', route(async (_, res) => {
  const { data, error } = await supabase.from('board_posts')
    .select('id,author_id,guest_name,title,visibility,is_hidden,created_at')
    .eq('visibility', 'public').eq('is_hidden', false)
    .order('created_at', { ascending: false }).limit(50);
  required('게시글을 불러오지 못했습니다.', error);
  res.json({ posts: await displayAuthors(data || []) });
}));
async function displayAuthors(posts) {
  const ids = [...new Set(posts.map(p => p.author_id).filter(Boolean))];
  if (!ids.length) return posts.map(p => ({ ...p, author_name: p.guest_name || '학회원', guest_name: undefined, author_id: undefined }));
  const { data, error } = await supabase.from('profiles')
    .select('id,display_name,public_opt_in').in('id', ids);
  required('게시글을 불러오지 못했습니다.', error);
  const byId = new Map((data || []).map(p => [p.id, p]));
  return posts.map(({ guest_name, author_id, ...p }) => ({ ...p,
    author_name: author_id && byId.get(author_id)?.public_opt_in
      ? byId.get(author_id).display_name : (guest_name || '학회원'),
  }));
}
app.get('/api/my/posts', route(async (req, res) => {
  const profile = await authenticated(req);
  const { data, error } = await supabase.from('board_posts')
    .select('id,title,visibility,is_hidden,created_at').eq('author_id', profile.id)
    .order('created_at', { ascending: false }).limit(100);
  required('내 게시글을 불러오지 못했습니다.', error);
  res.json({ posts: data });
}));
app.post('/api/board', guestLimiter, route(async (req, res) => {
  const profile = await actor(req);
  const { title, body, visibility } = req.body || {};
  if (!validText(title, 2, 100) || !validText(body, 5, 5000) || !['public', 'private'].includes(visibility)) {
    throw new HttpError(400, '제목, 내용, 공개 여부를 확인해 주세요.');
  }
  let token = null;
  let guestName = null;
  if (!profile) {
    guestName = req.body.guest_name;
    if (!validText(guestName, 2, 30)) throw new HttpError(400, '비회원 작성자 이름을 입력해 주세요(2~30자).');
    await verifyTurnstile(req.body.turnstile_token, req.ip);
    token = randomBytes(32).toString('base64url');
  }
  const { data, error } = await supabase.from('board_posts').insert({
    title: title.trim(), body: body.trim(), visibility,
    author_id: profile?.id || null,
    guest_name: guestName?.trim() || null,
    guest_token_hash: token ? sha256(token) : null,
  }).select('id').single();
  required('게시글을 저장하지 못했습니다.', error);
  res.status(201).json({ id: data.id, guestAccessToken: token });
}));
app.get('/api/board/:id', route(async (req, res) => {
  const profile = await actor(req);
  const { data: post, error } = await supabase.from('board_posts')
    .select('id,author_id,guest_name,guest_token_hash,title,body,visibility,is_hidden,created_at')
    .eq('id', req.params.id).maybeSingle();
  required('게시글을 불러오지 못했습니다.', error);
  if (!post) throw new HttpError(404, '게시글을 찾지 못했습니다.');
  const guestHash = checkGuestToken(post, req.get('x-guest-access-token'));
  if (!canViewPost(post, profile, guestHash)) throw new HttpError(404, '게시글을 찾지 못했습니다.');
  const { data: replies, error: re } = await supabase.from('board_replies')
    .select('id,officer_id,body,created_at').eq('post_id', post.id).order('created_at');
  required('답변을 불러오지 못했습니다.', re);
  const authors = await displayAuthors([post]);
  const responderIds = [...new Set((replies || []).map(r => r.officer_id))];
  const responderMap = new Map();
  if (responderIds.length) {
    const { data: users, error: ue } = await supabase.from('profiles')
      .select('id,display_name,public_opt_in').in('id', responderIds);
    required('답변을 불러오지 못했습니다.', ue);
    users.forEach(u => responderMap.set(u.id, u.public_opt_in ? u.display_name : 'SWUFORCE 운영진'));
  }
  res.json({ post: { ...authors[0], guest_token_hash: undefined,
    can_moderate: canModerate(profile),
    can_reply: canReply(profile),
  }, replies: (replies || []).map(({ officer_id, ...reply }) => ({ ...reply,
    author_name: responderMap.get(officer_id) || 'SWUFORCE 운영진',
  })) });
}));
app.post('/api/board/:id/replies', replyLimiter, route(async (req, res) => {
  const profile = await authenticated(req);
  if (!canReply(profile)) throw new HttpError(403, '답변은 현재 운영진만 작성할 수 있습니다.');
  if (!validText(req.body?.body, 2, 5000)) throw new HttpError(400, '답변은 2~5000자입니다.');
  const { data: post, error: pe } = await supabase.from('board_posts').select('id,is_hidden')
    .eq('id', req.params.id).maybeSingle();
  required('게시글 상태를 확인하지 못했습니다.', pe);
  if (!post || post.is_hidden) throw new HttpError(404, '게시글을 찾지 못했습니다.');
  const { data, error } = await supabase.from('board_replies').insert({
    post_id: post.id, officer_id: profile.id, body: req.body.body.trim(),
  }).select('id').single();
  required('답변을 저장하지 못했습니다.', error);
  res.status(201).json(data);
}));

app.get('/api/admin/posts', route(async (req, res) => {
  await executive(req);
  const { data, error } = await supabase.from('board_posts')
    .select('id,author_id,guest_name,title,visibility,is_hidden,created_at')
    .order('created_at', { ascending: false }).limit(200);
  required('관리자 게시글 목록을 불러오지 못했습니다.', error);
  res.json({ posts: await displayAuthors(data || []) });
}));
app.patch('/api/admin/posts/:id', route(async (req, res) => {
  await executive(req);
  if (typeof req.body?.is_hidden !== 'boolean') throw new HttpError(400, '숨김 여부를 선택해 주세요.');
  const { data, error } = await supabase.from('board_posts')
    .update({ is_hidden: req.body.is_hidden }).eq('id', req.params.id).select('id,is_hidden').maybeSingle();
  required('게시글 관리에 실패했습니다.', error);
  if (!data) throw new HttpError(404, '게시글을 찾지 못했습니다.');
  res.json(data);
}));
app.get('/api/admin/members', route(async (req, res) => {
  await admin(req);
  const { data, error } = await supabase.from('profiles')
    .select('id,display_name,cohort,requested_status,membership_status,is_verified,current_executive,site_admin,public_opt_in,created_at')
    .order('created_at', { ascending: false }).limit(500);
  required('회원 관리 정보를 불러오지 못했습니다.', error);
  res.json({ members: data });
}));
app.patch('/api/admin/members/:id', route(async (req, res) => {
  const operator = await admin(req);
  const { membership_status, is_verified, current_executive } = req.body || {};
  if (!['pending', 'active', 'alumni'].includes(membership_status)
    || typeof is_verified !== 'boolean' || typeof current_executive !== 'boolean') {
    throw new HttpError(400, '회원 상태와 운영진 여부를 확인해 주세요.');
  }
  if (is_verified === (membership_status === 'pending') ||
    (current_executive && (!is_verified || membership_status !== 'active'))) {
    throw new HttpError(400, '승인 상태와 운영진 설정이 서로 일치하지 않습니다.');
  }
  if (req.params.id === operator.id && (!is_verified || membership_status !== 'active')) {
    throw new HttpError(400, '관리자 본인의 승인 상태를 해제할 수 없습니다.');
  }
  const { data: target, error: targetError } = await supabase.from('profiles')
    .select('id,site_admin').eq('id', req.params.id).maybeSingle();
  required('회원을 확인하지 못했습니다.', targetError);
  if (!target) throw new HttpError(404, '회원을 찾지 못했습니다.');
  if (target.site_admin && target.id !== operator.id) throw new HttpError(403, '다른 사이트 관리자의 활동 상태는 변경할 수 없습니다.');
  const { data, error } = await supabase.from('profiles')
    .update({ membership_status, is_verified, current_executive })
    .eq('id', req.params.id).select('id,membership_status,is_verified,current_executive').maybeSingle();
  required('회원 정보를 수정하지 못했습니다.', error);
  if (!data) throw new HttpError(404, '회원을 찾지 못했습니다.');
  res.json(data);
}));
app.get('/api/admin/officer-terms', route(async (req, res) => {
  await admin(req);
  const { data, error } = await supabase.from('officer_terms').select('*')
    .order('start_on', { ascending: false }).limit(300);
  required('운영진 이력을 불러오지 못했습니다.', error);
  res.json({ terms: data });
}));
app.post('/api/admin/officer-terms', route(async (req, res) => {
  await admin(req);
  const { profile_id, term_label, position, start_on, end_on, is_published } = req.body || {};
  if (typeof profile_id !== 'string' || !validText(term_label, 2, 50)
    || !['president', 'vice_president'].includes(position)
    || !/^\d{4}-\d{2}-\d{2}$/.test(start_on)
    || (end_on && !/^\d{4}-\d{2}-\d{2}$/.test(end_on))
    || (end_on && end_on < start_on)
    || typeof is_published !== 'boolean') {
    throw new HttpError(400, '운영진 이력 정보를 확인해 주세요.');
  }
  const { data: profile, error: pe } = await supabase.from('profiles')
    .select('id,is_verified,membership_status,public_opt_in').eq('id', profile_id).maybeSingle();
  required('회원을 확인하지 못했습니다.', pe);
  if (!isConfirmed(profile)) throw new HttpError(400, '승인된 학회원만 운영진 이력에 등록할 수 있습니다.');
  if (is_published && !profile.public_opt_in) throw new HttpError(400, '명단 공개에 동의한 학회원만 공개할 수 있습니다.');
  const { data, error } = await supabase.from('officer_terms').insert({
    profile_id, term_label: term_label.trim(), position, start_on,
    end_on: end_on || null, is_published,
  }).select('id').single();
  required('운영진 이력을 저장하지 못했습니다.', error);
  res.status(201).json(data);
}));
app.patch('/api/admin/officer-terms/:id', route(async (req, res) => {
  await admin(req);
  const { is_published, end_on } = req.body || {};
  if (typeof is_published !== 'boolean' || (end_on !== null && (typeof end_on !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(end_on)))) {
    throw new HttpError(400, '공개 설정과 종료일을 확인해 주세요.');
  }
  const { data: existing, error: ex } = await supabase.from('officer_terms')
    .select('id,profile_id,start_on').eq('id', req.params.id).maybeSingle();
  required('운영진 이력을 불러오지 못했습니다.', ex);
  if (!existing) throw new HttpError(404, '이력을 찾지 못했습니다.');
  if (end_on && end_on < existing.start_on) throw new HttpError(400, '종료일은 시작일 이후여야 합니다.');
  if (is_published) {
    const { data: owner, error: oe } = await supabase.from('profiles')
      .select('is_verified,membership_status,public_opt_in').eq('id', existing.profile_id).single();
    required('공개 동의를 확인하지 못했습니다.', oe);
    if (!isConfirmed(owner) || !owner.public_opt_in) throw new HttpError(400, '공개 동의가 확인되지 않았습니다.');
  }
  const { data, error } = await supabase.from('officer_terms')
    .update({ is_published, end_on }).eq('id', req.params.id).select('id').single();
  required('운영진 이력을 수정하지 못했습니다.', error);
  res.json(data);
}));

app.use('/api', (_, res) => res.status(404).json({ error: 'API를 찾지 못했습니다.' }));
const dist = path.join(root, 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist, { index: false }));
  app.get('*', (_, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
  app.get('*', (_, res) => res.status(503).send('Run npm run build before starting the server.'));
}
app.use((err, _req, res, _next) => {
  if (!(err instanceof HttpError)) console.error('[server]', err);
  res.status(err.status || 500).json({ error: err instanceof HttpError ? err.message : '서버 오류가 발생했습니다.' });
});
const port = Number(process.env.PORT || 10000);
app.listen(port, '0.0.0.0', () => console.log(`SWUFORCE Web Service listening on ${port}`));
