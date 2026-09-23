import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, CheckCircle2,
  Clock3, Crown, Eye, EyeOff, GraduationCap, LockKeyhole,
  LogIn, LogOut, MessageCircle, Plus, Send, Settings2,
  Shield, ShieldCheck, UserRound, UsersRound,
} from 'lucide-react';

const AuthContext = createContext(null);
const fmt = value => value ? new Date(value).toLocaleDateString('ko-KR') : '';
const shortDate = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString('ko-KR') : '';
const statusNames = { active: '활동 학회원', alumni: '졸업 학회원', pending: '승인 대기' };
const positionNames = { president: '회장', vice_president: '부회장' };

async function request(path, { session, guestToken, ...options } = {}) {
  const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  if (guestToken) headers['X-Guest-Access-Token'] = guestToken;
  let result;
  try {
    result = await fetch(path, { ...options, headers, cache: 'no-store' });
  } catch {
    throw new Error('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.');
  }
  const json = await result.json().catch(() => ({}));
  if (!result.ok) throw new Error(json.error || `요청에 실패했습니다. (${result.status})`);
  return json;
}
export function useAuth() { return useContext(AuthContext); }
function useFetch(path, dependencies = []) {
  const { session, ready } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!ready) return;
    if (path === '/api/my/posts' && !session) { setData(null); setLoading(false); return; }
    let alive = true;
    setLoading(true);
    setError('');
    request(path, { session }).then(x => { if (alive) setData(x); })
      .catch(e => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [path, ready, session?.access_token, ...dependencies]);
  return { data, error, loading, setData };
}
export function PortalProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [client, setClient] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    let subscription;
    async function initialize() {
      try {
        const response = await request('/api/config');
        if (!active) return;
        setConfig(response);
        const supabase = createClient(response.supabaseUrl, response.publishableKey, {
          auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
        });
        setClient(supabase);
        const { data, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;
        if (!active) return;
        setSession(data.session);
        if (data.session) {
          const p = await request('/api/me', { session: data.session }).catch(() => null);
          if (active) setProfile(p?.profile || null);
        }
        const listener = supabase.auth.onAuthStateChange((_event, next) => {
          queueMicrotask(async () => {
            if (!active) return;
            setSession(next);
            if (!next) { setProfile(null); return; }
            const p = await request('/api/me', { session: next }).catch(() => null);
            if (active) setProfile(p?.profile || null);
          });
        });
        subscription = listener.data.subscription;
      } catch (e) {
        if (active) setError(e.message || '인증 서비스를 불러오지 못했습니다.');
      } finally {
        if (active) setReady(true);
      }
    }
    initialize();
    return () => { active = false; subscription?.unsubscribe(); };
  }, []);
  async function refreshProfile() {
    if (!client) return;
    const { data } = await client.auth.getSession();
    if (!data.session) { setProfile(null); return; }
    const response = await request('/api/me', { session: data.session });
    setProfile(response.profile);
  }
  return <AuthContext.Provider value={{ config, client, session, profile, ready, error, refreshProfile }}>
    {children}
  </AuthContext.Provider>;
}
function Page({ kicker, title, description, children, narrow = false }) {
  return <main className="portal-main" id="main-content">
    <div className="portal-banner"><div className="container">
      <span className="portal-kicker"><span className="eyebrow-bar" /> SWUFORCE / {kicker}</span>
      <h1>{title}</h1><p>{description}</p>
    </div></div>
    <div className={`container portal-content ${narrow ? 'portal-narrow' : ''}`}>{children}</div>
  </main>;
}
function Alert({ message, positive = false }) {
  return message ? <div className={`portal-alert ${positive ? 'portal-success' : ''}`} role="status">{message}</div> : null;
}
function Badge({ children, type = '' }) { return <span className={`member-badge ${type}`}>{children}</span>; }
function BadgeRow({ badges = [] }) {
  return <div className="badge-row">{badges.map(b => <Badge key={b} type={b.includes('회장') ? 'gold' : b.includes('졸업') ? 'slate' : b.includes('활동') ? 'blue' : b.endsWith('기') ? 'cohort' : ''}>{b}</Badge>)}</div>;
}
function Turnstile({ sitekey, onToken }) {
  const target = useRef(null);
  useEffect(() => {
    if (!sitekey) return;
    let widget;
    let cancelled = false;
    const tryRender = () => {
      if (cancelled) return true;
      if (!window.turnstile || !target.current) return false;
      widget = window.turnstile.render(target.current, {
        sitekey, callback: onToken,
        'expired-callback': () => onToken(''), 'error-callback': () => onToken(''),
      });
      return true;
    };
    let script = document.querySelector('script[data-swuforce-turnstile]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.swuforceTurnstile = 'true';
      document.head.appendChild(script);
    }
    if (tryRender()) return () => { cancelled = true; if (widget !== undefined) window.turnstile?.remove(widget); };
    const id = window.setInterval(() => { if (tryRender()) window.clearInterval(id); }, 200);
    return () => { cancelled = true; window.clearInterval(id); if (widget !== undefined) window.turnstile?.remove(widget); };
  }, [sitekey]);
  return <div ref={target} className="turnstile-target" aria-label="자동 작성 방지 인증" />;
}

export function Board() {
  const { session, profile } = useAuth();
  const { data, error, loading } = useFetch('/api/board');
  const own = useFetch('/api/my/posts', [Boolean(session)]);
  return <Page kicker="COMMUNITY / BOARD" title="Community" description="비회원도 문의를 남길 수 있습니다. 답변은 현재 SWUFORCE 운영진만 작성합니다.">
    <div className="portal-actions"><a className="portal-button" href="/board/new"><Plus size={18}/> 문의 작성하기</a></div>
    <div className="portal-card">
      <h2>공개 게시글</h2>
      {loading ? <p className="muted">게시글을 불러오는 중입니다.</p> : error ? <Alert message={error}/> : data?.posts?.length ? <div className="post-list">{data.posts.map(post => <a className="post-row" key={post.id} href={`/board/${post.id}`}>
        <span className="post-row-icon"><MessageCircle size={19}/></span>
        <span className="post-row-main"><strong>{post.title}</strong><small>{post.author_name} · {fmt(post.created_at)}</small></span>
        <ArrowRight size={19}/>
      </a>)}</div> : <p className="empty-state">아직 공개 게시글이 없습니다. 첫 질문을 남겨주세요.</p>}
    </div>
    {session && <div className="portal-card"><h2>내가 쓴 글</h2>
      {own.loading ? <p className="muted">불러오는 중…</p> : own.error ? <Alert message={own.error} /> : own.data?.posts?.length ? <div className="post-list">{own.data.posts.map(post => <a className="post-row" href={`/board/${post.id}`} key={post.id}>
        <span className="post-row-main"><strong>{post.title}</strong><small>{post.visibility === 'private' ? '비공개' : '공개'} · {fmt(post.created_at)}</small></span><ArrowRight size={18}/>
      </a>)}</div> : <p className="muted">작성한 글이 없습니다.</p>}
    </div>}
    <div className="portal-info"><LockKeyhole size={20}/><p>비공개 글은 작성자와 운영진만 읽을 수 있습니다. 비회원 작성자는 작성 직후 발급되는 비밀 링크를 반드시 보관해 주세요.</p></div>
  </Page>;
}
export function BoardCompose() {
  const { session, config } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [guestName, setGuestName] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const guest = !session;
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const saved = await request('/api/board', { method: 'POST', session,
        body: JSON.stringify({ title, body, visibility, guest_name: guestName, turnstile_token: turnstileToken }),
      });
      setResult(saved);
    } catch (e) { setError(e.message); window.turnstile?.reset(); setTurnstileToken(''); }
    finally { setBusy(false); }
  }
  const url = result && `${window.location.origin}/board/${result.id}${result.guestAccessToken ? `#access=${encodeURIComponent(result.guestAccessToken)}` : ''}`;
  return <Page kicker="COMMUNITY / WRITE" title="문의 작성" description="학회 활동, 신입 모집, 협업 등 궁금한 내용을 남겨 주세요." narrow>
    {result ? <div className="portal-card submit-success"><CheckCircle2 size={38}/><h2>게시글이 등록되었습니다.</h2>
      {result.guestAccessToken && <><p>비회원 작성자는 아래 비밀 링크로 본인의 비공개 글을 다시 읽을 수 있습니다. 링크를 잃어버리면 복구할 수 없습니다.</p><div className="secret-link">{url}</div><button className="portal-button" onClick={() => navigator.clipboard.writeText(url)}>비밀 링크 복사</button></>}
      <a className="portal-button" href={`/board/${result.id}${result.guestAccessToken ? `#access=${result.guestAccessToken}` : ''}`}>게시글 보기 <ArrowRight size={16}/></a>
    </div> : <form className="portal-card portal-form" onSubmit={submit}>
      <Alert message={error}/>
      {guest && <label>작성자 이름 / 닉네임<input required minLength={2} maxLength={30} value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="2~30자"/></label>}
      <label>제목<input required minLength={2} maxLength={100} value={title} onChange={e => setTitle(e.target.value)} placeholder="문의 제목을 입력하세요"/></label>
      <label>본문<textarea required minLength={5} maxLength={5000} rows={9} value={body} onChange={e => setBody(e.target.value)} placeholder="문의 내용을 자세히 적어 주세요. 공개 글에 연락처 등 개인정보를 남기지 마세요."/></label>
      <fieldset className="visibility-choices"><legend>공개 범위</legend><label><input type="radio" name="visibility" checked={visibility === 'public'} onChange={() => setVisibility('public')}/><Eye size={18}/> 공개 글 <small>모든 방문자가 읽을 수 있습니다.</small></label>
        <label><input type="radio" name="visibility" checked={visibility === 'private'} onChange={() => setVisibility('private')}/><EyeOff size={18}/> 비공개 글 <small>작성자와 현재 운영진만 읽을 수 있습니다.</small></label></fieldset>
      {guest && !config?.guestPostingAllowed && <Alert message="비회원 글쓰기는 자동 작성 방지 설정이 완료되면 열립니다. 지금은 로그인 후 작성할 수 있습니다."/>}
      {guest && config?.turnstileSiteKey && <Turnstile sitekey={config.turnstileSiteKey} onToken={setTurnstileToken}/>}
      <div className="form-actions"><a href="/board">취소</a><button className="portal-button" type="submit" disabled={busy || (guest && (!config?.guestPostingAllowed || (config?.turnstileSiteKey && !turnstileToken)))}><Send size={17}/>{busy ? '등록 중…' : '등록하기'}</button></div>
    </form>}
  </Page>;
}
export function BoardDetail({ id }) {
  const { session, ready } = useAuth();
  const token = new URLSearchParams(window.location.hash.slice(1)).get('access') || '';
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => {
    try { setData(await request(`/api/board/${encodeURIComponent(id)}`, { session, guestToken: token })); setError(''); }
    catch (e) { setError(e.message); }
  };
  useEffect(() => { if (ready) load(); }, [id, ready, session?.access_token]);
  async function send(event) {
    event.preventDefault(); setBusy(true);
    try { await request(`/api/board/${id}/replies`, { method: 'POST', session, body: JSON.stringify({ body: reply }) }); setReply(''); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <Page kicker="COMMUNITY / POST" title="문의 상세" description="문의 내용과 운영진의 답변을 확인하세요." narrow>
    <p><a className="text-back" href="/board"><ArrowLeft size={16}/> 게시판으로 돌아가기</a></p>
    {error && <Alert message={error}/>}
    {data?.post && <><article className="portal-card"><div className="post-meta"><Badge type={data.post.visibility === 'private' ? 'slate' : 'blue'}>{data.post.visibility === 'private' ? '비공개' : '공개'}</Badge><span>{fmt(data.post.created_at)}</span></div>
      <h2>{data.post.title}</h2><p className="muted">작성자: {data.post.author_name}</p><div className="post-body">{data.post.body}</div>
    </article>
    <section className="portal-card"><h2>운영진 답변 {data.replies?.length || 0}개</h2>
      {data.replies?.length ? data.replies.map(item => <div className="reply-block" key={item.id}><div><Badge type="blue">운영진 답변</Badge><strong>{item.author_name}</strong><small>{fmt(item.created_at)}</small></div><p className="post-body">{item.body}</p></div>) : <p className="muted">아직 등록된 답변이 없습니다.</p>}
      {data.post.can_reply && <form className="portal-form reply-form" onSubmit={send}><label>운영진 답변<textarea value={reply} onChange={e => setReply(e.target.value)} required minLength={2} maxLength={5000} rows={5} placeholder="공식 답변을 입력하세요."/></label><button className="portal-button" disabled={busy}>답변 등록하기</button></form>}
    </section></>}
  </Page>;
}

export function Members() {
  const { data, error, loading } = useFetch('/api/members');
  const [filter, setFilter] = useState('all');
  const shown = (data?.members || []).filter(x => filter === 'all' || x.membership_status === filter);
  return <Page kicker="PEOPLE / MEMBERS" title="Members" description="공개에 동의한 학회원의 활동 기수와 활동 상태를 소개합니다.">
    <div className="filter-tabs"><button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>전체</button><button className={filter === 'active' ? 'selected' : ''} onClick={() => setFilter('active')}>활동 학회원</button><button className={filter === 'alumni' ? 'selected' : ''} onClick={() => setFilter('alumni')}>졸업 학회원</button></div>
    <Alert message={error}/>
    {loading ? <p className="muted">학회원 명단을 불러오는 중…</p> : shown.length ? <div className="member-grid">{shown.map((m,i) => <div className="portal-card member-tile" key={`${m.display_name}-${m.cohort}-${i}`}><div className="avatar-mark"><UserRound size={25}/></div><h2>{m.display_name}</h2><BadgeRow badges={m.badges}/></div>)}</div> : <div className="portal-card empty-state">현재 공개된 학회원 명단이 없습니다.</div>}
    <p className="muted directory-note">명단과 배지는 운영진 승인과 학회원 본인의 공개 동의가 확인된 경우에만 표시됩니다.</p>
  </Page>;
}
export function Recruit() {
  return <Page kicker="JOIN / RECRUITMENT" title="Recruit" description="SWUFORCE와 함께 디지털포렌식을 공부할 새로운 학우들을 기다립니다.">
    <div className="recruit-hero portal-card"><div className="recruit-status"><Clock3 size={19}/> 모집 마감</div><p className="recruit-eyebrow">SWUFORCE RECRUITMENT</p><h2>7.5기 모집이<br/><span>마감되었습니다.</span></h2><p>2027년도 1학기에 예정된 <strong>8기 모집</strong>에 많은 관심 부탁드립니다.</p><a className="portal-button" href="https://www.instagram.com/swu.f0rc3/" target="_blank" rel="noreferrer">공식 Instagram에서 소식 받기 <ArrowUpRight size={18}/></a></div>
    <div className="portal-card"><h2>모집 소식 안내</h2><p>모집 일정, 지원 자격, 선발 절차 및 지원 링크는 모집 공고가 확정되면 공식 채널에 안내합니다. 회원가입은 기존 학회원에게도 열려 있으며, 학회원 배지는 운영진 승인 후 발급됩니다.</p></div>
  </Page>;
}

export function AuthPage({ mode }) {
  const { client, session, ready, error: configError } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [name, setName] = useState(''); const [cohort, setCohort] = useState('');
  const [requested, setRequested] = useState('active'); const [agree, setAgree] = useState(false);
  const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const label = { login: '로그인', register: '학회원 가입', recover: '비밀번호 재설정 요청', reset: '새 비밀번호 설정' }[mode];
  async function submit(event) {
    event.preventDefault(); if (!client) return;
    setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'register') {
        if (!agree) throw new Error('필수 개인정보 수집 및 이용에 동의해 주세요.');
        if (!/^([1-9]\d?)(\.5)?$/.test(cohort)) throw new Error('기수는 1, 7, 7.5와 같은 형식으로 입력해 주세요.');
        if (password.length < 8) throw new Error('비밀번호는 8자 이상 입력해 주세요.');
        const { data, error: e } = await client.auth.signUp({ email, password,
          options: { data: { display_name: name.trim(), cohort, requested_status: requested },
            emailRedirectTo: `${window.location.origin}/login` },
        });
        if (e) throw e;
        setMessage(data.session ? '가입 신청이 완료되었습니다. 운영진 승인 후 배지가 발급됩니다.' : '가입 확인 이메일을 확인해 주세요. 이메일 인증 후 운영진 승인을 기다리면 됩니다.');
      } else if (mode === 'login') {
        const { error: e } = await client.auth.signInWithPassword({ email, password });
        if (e) throw e;
        window.location.href = '/me';
      } else if (mode === 'recover') {
        const { error: e } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (e) throw e;
        setMessage('등록된 이메일이라면 비밀번호 재설정 링크가 전송됩니다.');
      } else {
        if (password.length < 8) throw new Error('새 비밀번호는 8자 이상 입력해 주세요.');
        const { error: e } = await client.auth.updateUser({ password });
        if (e) throw e;
        setMessage('비밀번호가 변경되었습니다.');
      }
    } catch (e) { setError(e.message || '처리 중 오류가 발생했습니다.'); }
    finally { setBusy(false); }
  }
  return <Page kicker={`ACCOUNT / ${mode.toUpperCase()}`} title={label} description="SWUFORCE 학회원 커뮤니티" narrow>
    <form className="portal-card portal-form" onSubmit={submit}>
      <Alert message={configError || error}/><Alert message={message} positive/>
      {!ready && <p className="muted">인증 서비스 연결 중…</p>}
      {mode === 'register' && <><label>홈페이지 표시 이름 / 닉네임<input required minLength={2} maxLength={32} value={name} onChange={e => setName(e.target.value)} placeholder="2~32자"/></label><label>활동 기수<input required value={cohort} onChange={e => setCohort(e.target.value)} placeholder="예: 7.5" inputMode="decimal"/></label>
        <label>신청할 활동 상태<select value={requested} onChange={e => setRequested(e.target.value)}><option value="active">현재 활동 중</option><option value="alumni">졸업 학회원</option></select></label>
        <div className="privacy-box"><p><strong>최소 수집 항목 및 이용 목적</strong></p><p>이메일(인증·계정 복구), 비밀번호(Supabase 인증 서비스에서 관리), 표시 이름·활동 기수·신청 활동 상태(회원 확인 및 배지 발급)를 사용합니다. 학회원 여부와 활동 상태는 운영진 확인 후 반영됩니다. 명단 공개는 가입 후 별도 동의를 받아요.</p><label className="inline-check"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)}/> 위 내용을 확인했고 개인정보 수집·이용에 동의합니다. (필수)</label></div>
      </>}
      {mode !== 'reset' && <label>이메일<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="이메일 주소"/></label>}
      {!['recover'].includes(mode) && <label>{mode === 'reset' ? '새 비밀번호' : '비밀번호'}<input required type="password" minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="8자 이상"/></label>}
      {mode === 'reset' && !session && <p className="muted">메일로 받은 재설정 링크를 열어 이 페이지로 들어오세요.</p>}
      <button className="portal-button" type="submit" disabled={busy || !client || (mode === 'reset' && !session)}>{busy ? '처리 중…' : label} <ArrowRight size={16}/></button>
      <div className="auth-options">{mode === 'login' ? <><a href="/register">학회원 가입</a><a href="/recover-password">비밀번호 찾기</a></> : <a href="/login">로그인으로 돌아가기</a>}</div>
    </form>
  </Page>;
}
export function MyPage() {
  const { profile, session, client, refreshProfile, ready } = useAuth();
  const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function changeOptIn(event) {
    setBusy(true); setError(''); setMessage('');
    try { await request('/api/me', { method: 'PATCH', session,
      body: JSON.stringify({ public_opt_in: event.target.checked }),
    }); await refreshProfile(); setMessage('명단 공개 설정이 변경되었습니다.'); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function signOut() { await client.auth.signOut(); window.location.href = '/'; }
  return <Page kicker="ACCOUNT / MY PAGE" title="My Page" description="내 활동 정보와 배지, 명단 공개 설정을 관리할 수 있습니다.">
    {!ready ? <p className="muted">회원 정보를 확인하는 중…</p> : !session ? <div className="portal-card"><h2>로그인이 필요합니다.</h2><a href="/login" className="portal-button">로그인하기 <LogIn size={17}/></a></div> : !profile ? <div className="portal-card"><h2>회원 정보를 준비 중입니다.</h2><p>이메일 인증 또는 가입 절차가 완료되었는지 확인해 주세요.</p></div> : <>
      <Alert message={error}/><Alert message={message} positive/>
      <div className="portal-card my-profile"><div className="avatar-mark avatar-large"><UserRound size={31}/></div><div><h2>{profile.display_name}</h2><p className="muted">{profile.cohort}기 · {statusNames[profile.membership_status]}</p><BadgeRow badges={profile.badges}/></div></div>
      {!profile.is_verified && <div className="portal-info"><Clock3 size={20}/><p>현재 운영진 승인 대기 중입니다. 신청 상태: {statusNames[profile.requested_status]} / {profile.cohort}기. 배지는 회원 확인 후 부여됩니다.</p></div>}
      <div className="portal-card"><h2>학회원 명단 공개</h2><p>동의하는 경우에만 홈페이지 학회원 명단에 표시 이름과 활동 기수·승인된 배지를 공개합니다. 언제든지 변경할 수 있습니다. 역대 운영진 이력 역시 동의한 경우에만 공개됩니다.</p>
        <label className="inline-check opt-in"><input disabled={busy} type="checkbox" checked={Boolean(profile.public_opt_in)} onChange={changeOptIn}/> 공개 명단에 내 정보 표시하기</label>
      </div>
      <div className="portal-actions">{profile.can_moderate && <a href="/admin" className="portal-button"><Settings2 size={16}/> 운영진 관리</a>}<button className="portal-outline" onClick={signOut}><LogOut size={16}/> 로그아웃</button></div>
    </>}
  </Page>;
}

function AdminMember({ member, ownId, save }) {
  const [status, setStatus] = useState(member.membership_status);
  const [verified, setVerified] = useState(member.is_verified);
  const [executive, setExecutive] = useState(member.current_executive);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { await save(member.id, { membership_status: status, is_verified: verified, current_executive: executive }); setMessage('저장되었습니다.'); }
    catch (e) { setMessage(e.message); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="admin-person"><div className="admin-person-title"><strong>{member.display_name} <small>{member.cohort}기</small></strong><Badge type={member.site_admin ? 'gold' : ''}>{member.site_admin ? '사이트 관리자' : '학회원'}</Badge></div>
    <p className="muted">신청 상태: {statusNames[member.requested_status]} · 공개 동의: {member.public_opt_in ? '동의' : '비동의'} · 식별번호: {member.id.slice(0,8)}</p>
    <div className="admin-row"><label>활동 상태<select value={status} disabled={member.id === ownId} onChange={e => { setStatus(e.target.value); if (e.target.value !== 'active') setExecutive(false); if (e.target.value === 'pending') setVerified(false); }}><option value="pending">승인 대기</option><option value="active">활동 학회원</option><option value="alumni">졸업 학회원</option></select></label>
      <label className="inline-check"><input type="checkbox" disabled={member.id === ownId} checked={verified} onChange={e => setVerified(e.target.checked)}/>학회원 확인 완료</label>
      <label className="inline-check"><input type="checkbox" checked={executive} onChange={e => setExecutive(e.target.checked)}/>현재 운영진</label>
      <button className="portal-outline" disabled={busy} type="submit">저장</button></div>
    <small className="muted">{message}</small>
  </form>;
}
function AdminPosts({ session }) {
  const { data, loading, error, setData } = useFetch('/api/admin/posts');
  const [message, setMessage] = useState('');
  async function toggle(post) {
    try { await request(`/api/admin/posts/${post.id}`, { method: 'PATCH', session, body: JSON.stringify({ is_hidden: !post.is_hidden }) });
      setData(old => ({ ...old, posts: old.posts.map(p => p.id === post.id ? { ...p, is_hidden: !p.is_hidden } : p) }));
      setMessage('게시글 상태가 변경되었습니다.');
    } catch (e) { setMessage(e.message); }
  }
  return <div className="portal-card"><h2>게시글 관리</h2><Alert message={error || message}/>{loading ? <p>불러오는 중…</p> : data?.posts?.length ? data.posts.map(post => <div className="admin-post" key={post.id}>
    <div><a href={`/board/${post.id}`}><strong>{post.title}</strong></a><p className="muted">{post.author_name} · {post.visibility === 'private' ? '비공개' : '공개'} · {post.is_hidden ? '숨김' : '게시 중'} · {fmt(post.created_at)}</p></div>
    <button className="portal-outline" onClick={() => toggle(post)}>{post.is_hidden ? '숨김 해제' : '게시글 숨기기'}</button>
  </div>) : <p className="muted">작성된 게시글이 없습니다.</p>}</div>;
}
function AdminMembers({ session, ownId }) {
  const { data, loading, error } = useFetch('/api/admin/members');
  const [message, setMessage] = useState('');
  async function save(id, value) {
    await request(`/api/admin/members/${id}`, { method: 'PATCH', session, body: JSON.stringify(value) });
  }
  return <div className="portal-card"><h2>학회원 승인 · 상태 관리</h2><p className="muted">기수와 가입 요청은 학회원이 직접 입력합니다. 승인 및 활동 상태·현재 운영진 지정은 사이트 관리자만 변경할 수 있습니다.</p>
    <Alert message={error || message}/>{loading ? <p>불러오는 중…</p> : data?.members?.length ? data.members.map(member => <AdminMember key={member.id} member={member} ownId={ownId} save={save}/>) : <p className="muted">등록된 회원이 없습니다.</p>}</div>;
}
function AdminTerms({ session }) {
  const { data, loading, error, setData } = useFetch('/api/admin/officer-terms');
  const members = useFetch('/api/admin/members');
  const [form, setForm] = useState({ profile_id: '', term_label: '', position: 'president', start_on: '', end_on: '', is_published: false });
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [edits, setEdits] = useState({});
  async function add(event) {
    event.preventDefault(); setPending(true); setMessage('');
    try { const result = await request('/api/admin/officer-terms', { method:'POST', session,
      body: JSON.stringify(form), });
      setMessage('운영진 이력을 추가했습니다.');
      setData(old => ({ terms: [{ ...form, id: result.id, end_on: form.end_on || null }, ...(old?.terms || [])] }));
      setForm({ profile_id: '', term_label: '', position:'president', start_on:'', end_on:'', is_published:false });
    } catch (e) { setMessage(e.message); }
    finally { setPending(false); }
  }
  async function update(entry) {
    const edit = edits[entry.id] || {};
    try { await request(`/api/admin/officer-terms/${entry.id}`, { method:'PATCH', session,
      body: JSON.stringify({ is_published: edit.is_published ?? entry.is_published, end_on: edit.end_on === undefined ? entry.end_on : (edit.end_on || null) }),
    });
      setMessage('운영진 이력이 변경되었습니다.');
      setData(old => ({ terms: old.terms.map(t => t.id === entry.id ? { ...t, ...edit, end_on: edit.end_on === '' ? null : (edit.end_on ?? t.end_on) } : t) }));
    } catch (e) { setMessage(e.message); }
  }
  const eligible = (members.data?.members || []).filter(m => m.is_verified);
  const labels = new Map((members.data?.members || []).map(m => [m.id, `${m.display_name} · ${m.cohort}기`]));
  return <div className="portal-card"><h2>역대 회장·부회장단 등록</h2><p className="muted">학회원 공개 동의를 확인한 뒤 이력을 공개해 주세요. 공개하지 않은 기록은 관리자만 볼 수 있습니다.</p>
    <Alert message={message || error || members.error}/>
    <form className="portal-form term-form" onSubmit={add}>
      <label>학회원<select required value={form.profile_id} onChange={e => setForm({ ...form, profile_id:e.target.value })}><option value="">학회원 선택</option>{eligible.map(m => <option key={m.id} value={m.id}>{m.display_name} / {m.cohort}기 {m.public_opt_in ? '(공개 동의)' : '(공개 비동의)'}</option>)}</select></label>
      <label>활동 학기<input required maxLength={50} value={form.term_label} placeholder="예: 2026년 2학기" onChange={e => setForm({ ...form,term_label:e.target.value })}/></label>
      <label>직책<select value={form.position} onChange={e => setForm({ ...form,position:e.target.value })}><option value="president">회장</option><option value="vice_president">부회장</option></select></label>
      <div className="date-pair"><label>시작일<input required type="date" value={form.start_on} onChange={e => setForm({ ...form,start_on:e.target.value })}/></label><label>종료일 (재임 중이면 비움)<input type="date" value={form.end_on} onChange={e => setForm({ ...form,end_on:e.target.value })}/></label></div>
      <label className="inline-check"><input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form,is_published:e.target.checked })}/> 학회원 공개 동의를 확인했고 이력을 공개합니다.</label>
      <button type="submit" disabled={pending} className="portal-button">이력 추가</button>
    </form>
    <h3>등록된 이력</h3>{loading ? <p className="muted">불러오는 중…</p> : data?.terms?.length ? data.terms.map(t => <div className="admin-post" key={t.id}>
      <div><strong>{labels.get(t.profile_id) || '탈퇴한 회원'} · {t.term_label} · {positionNames[t.position]}</strong><p className="muted">{t.start_on} ~ {t.end_on || '현재'}</p></div>
      <div className="term-edit"><label>종료일<input type="date" value={edits[t.id]?.end_on ?? t.end_on ?? ''} onChange={e => setEdits({ ...edits,[t.id]: { ...edits[t.id],end_on:e.target.value } })}/></label><label className="inline-check"><input type="checkbox" checked={edits[t.id]?.is_published ?? t.is_published} onChange={e => setEdits({ ...edits,[t.id]: { ...edits[t.id],is_published:e.target.checked } })}/>공개</label><button className="portal-outline" onClick={() => update(t)}>저장</button></div>
    </div>) : <p className="muted">등록된 이력이 없습니다.</p>}
  </div>;
}
export function Admin() {
  const { profile, session, ready } = useAuth();
  const [tab, setTab] = useState('posts');
  if (!ready) return <Page kicker="MANAGEMENT" title="Admin" description="권한 확인 중…"><p>불러오는 중…</p></Page>;
  if (!profile?.can_moderate) return <Page kicker="MANAGEMENT" title="Admin" description="현재 운영진 및 승인된 사이트 관리자 전용 페이지입니다."><div className="portal-card"><p>이 페이지에 접근할 수 없습니다.</p><a className="portal-button" href="/login">로그인하기</a></div></Page>;
  return <Page kicker="MANAGEMENT" title="Admin" description="비공개 문의 확인·답변과 학회원 승인, 운영진 이력을 관리합니다.">
    <div className="filter-tabs"><button className={tab === 'posts' ? 'selected' : ''} onClick={() => setTab('posts')}>게시판 관리</button>
      {profile.can_administer && <><button className={tab === 'members' ? 'selected' : ''} onClick={() => setTab('members')}>학회원 관리</button><button className={tab === 'terms' ? 'selected' : ''} onClick={() => setTab('terms')}>역대 운영진</button></>}</div>
    {tab === 'posts' && <AdminPosts session={session}/>}
    {tab === 'members' && profile.can_administer && <AdminMembers session={session} ownId={profile.id}/>}
    {tab === 'terms' && profile.can_administer && <AdminTerms session={session}/>}
    <div className="portal-info"><ShieldCheck size={21}/><p>회원·운영진 권한은 서버에서 매 요청마다 검증합니다. 운영진 표시만으로 관리자 권한이 자동 발급되지 않습니다.</p></div>
  </Page>;
}
export function PortalRoutes() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const routes = {
    '/board': <Board/>, '/board/new': <BoardCompose/>,
    '/members': <Members/>, '/recruit': <Recruit/>,
    '/login': <AuthPage mode="login"/>, '/register': <AuthPage mode="register"/>,
    '/recover-password': <AuthPage mode="recover"/>, '/reset-password': <AuthPage mode="reset"/>,
    '/me': <MyPage/>, '/admin': <Admin/>,
  };
  const match = /^\/board\/([0-9a-f-]{36})$/.exec(path);
  return routes[path] || (match ? <BoardDetail id={match[1]}/> : <Page kicker="404" title="페이지를 찾지 못했습니다" description="주소를 확인해 주세요."><a className="portal-button" href="/">홈으로</a></Page>);
}
