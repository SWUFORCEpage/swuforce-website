import React, { useEffect, useState } from 'react';

export const CONTENT_PAGE_NAMES = {
  home:'Home', about:'About', study:'Study', news:'News',
  community:'Community', members:'Members', recruit:'Recruit', me:'My Page',
};
const emptyForm = page => ({ page, category:'', title:'', body:'', link_label:'', link_url:'', image_url:'', sort_order:100, is_published:false });
function externalHttps(value) {
  if (typeof value !== 'string' || !value) return null;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}
async function getJSON(url, options = {}) {
  let response;
  try { response = await fetch(url, { cache:'no-store', ...options }); }
  catch { throw new Error('서버에 연결하지 못했습니다.'); }
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error || `요청 실패 (${response.status})`);
  return json;
}

/** Published text, images and links only; never interpret content as raw HTML. */
export function PageContent({ page, embedded = false, title = '추가 안내', session = null }) {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    setEntries([]); setError('');
    getJSON(`/api/content/${encodeURIComponent(page)}`, { headers: session?.access_token ? {Authorization:`Bearer ${session.access_token}`} : {} })
      .then(result => { if (alive) setEntries(result.entries || []); })
      .catch(err => { if (alive) setError(err.message); });
    return () => { alive = false; };
  }, [page, session?.access_token]);
  if (!entries.length && !error) return null;
  return <section className={`cms-section ${embedded ? 'cms-embedded' : ''}`} aria-label={`${CONTENT_PAGE_NAMES[page] || page} 추가 정보`}>
    <div className={embedded ? '' : 'container'}>
      {entries.length > 0 && <><div className="cms-heading"><span>SWUFORCE / {CONTENT_PAGE_NAMES[page]}</span><h2>{title}</h2></div>
        <div className="cms-grid">{entries.map(item => {
          const link = externalHttps(item.link_url);
          const image = externalHttps(item.image_url);
          return <article className="cms-item" key={item.id}>
            {image && <img src={image} alt={item.title} loading="lazy" referrerPolicy="no-referrer"/>}
            <div className="cms-item-content">
              {item.category && <span className="cms-item-category">{item.category}</span>}
              <h3>{item.title}</h3>
              {item.body && <p>{item.body}</p>}
              {link && <a href={link} target="_blank" rel="noopener noreferrer">{item.link_label || '자세히 보기'} <span aria-hidden="true">↗</span></a>}
            </div>
          </article>;
        })}</div></>}
      {error && <p className="cms-error" role="status">추가 정보를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>}
    </div>
  </section>;
}

/** Site administrators may add, edit, order, unpublish and remove page entries. */
export function AdminPageContent({ session }) {
  const [page, setPage] = useState('news');
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(emptyForm('news'));
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const token = session?.access_token || '';
  async function load(targetPage, currentToken = token) {
    if (!currentToken) return;
    setLoading(true); setError('');
    try {
      const data = await getJSON(`/api/admin/content/${targetPage}`, { headers:{ Authorization:`Bearer ${currentToken}` } });
      setEntries(data.entries || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(page); }, [page, token]);
  function changePage(next) {
    setPage(next); setForm(emptyForm(next)); setEditingId(null); setMessage(''); setError('');
  }
  function change(field, value) { setForm(old => ({ ...old, [field]:value })); }
  function resetForm() { setForm(emptyForm(page)); setEditingId(null); }
  function edit(item) {
    setEditingId(item.id);
    setForm({ page:item.page, category:item.category || '', title:item.title, body:item.body || '',
      link_label:item.link_label || '', link_url:item.link_url || '', image_url:item.image_url || '',
      sort_order:item.sort_order, is_published:item.is_published });
    setMessage(''); setError('');
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    const payload = { ...form, sort_order:Number(form.sort_order) };
    try {
      const url = editingId ? `/api/admin/content/${editingId}` : '/api/admin/content';
      await getJSON(url, { method:editingId ? 'PATCH' : 'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body:JSON.stringify(payload) });
      resetForm(); setMessage('저장되었습니다.'); await load(page);
    } catch(e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function toggle(item) {
    setBusy(true); setError(''); setMessage('');
    try {
      await getJSON(`/api/admin/content/${item.id}`, { method:'PATCH',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body:JSON.stringify({ ...item, image_url:item.image_url || '', link_url:item.link_url || '',
          is_published:!item.is_published }) });
      setMessage(item.is_published ? '비공개로 변경했습니다.' : '공개했습니다.'); await load(page);
    } catch(e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function remove(item) {
    if (!window.confirm(`“${item.title}” 항목을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await getJSON(`/api/admin/content/${item.id}`, { method:'DELETE',
        headers:{ Authorization:`Bearer ${token}` } });
      if (editingId===item.id) resetForm();
      setMessage('삭제되었습니다.'); await load(page);
    } catch(e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <div className="portal-card cms-admin">
    <h2>페이지 콘텐츠 관리</h2>
    <p className="muted">공지, 활동 기록, 스터디 안내 등을 코드 수정 없이 등록할 수 있습니다. 공개 전에는 임시 저장으로 보관할 수 있습니다. 기존 고정 소개문 및 메뉴 구성은 별도 관리 대상입니다.</p>
    <label className="cms-admin-page">편집할 페이지
      <select value={page} onChange={e=>changePage(e.target.value)}>
        {Object.entries(CONTENT_PAGE_NAMES).map(([value,label])=><option key={value} value={value}>{label}</option>)}
      </select>
    </label>
    {error && <p className="cms-error" role="alert">{error}</p>}
    {message && <p className="cms-success" role="status">{message}</p>}
    <form className="cms-admin-form" onSubmit={save}>
      <h3>{editingId ? '항목 수정' : `${CONTENT_PAGE_NAMES[page]}에 항목 추가`}</h3>
      <div className="cms-admin-fields">
        <label>구분 <input value={form.category} maxLength={35} placeholder="예: 공지 / 프로젝트 / 수상" onChange={e=>change('category',e.target.value)}/></label>
        <label>제목 <input required minLength={2} maxLength={120} value={form.title} placeholder="예: 2026 하반기 스터디 일정" onChange={e=>change('title',e.target.value)}/></label>
        <label className="cms-wide">본문 <textarea value={form.body} maxLength={2200} rows={5} placeholder="공식 안내 내용을 입력하세요. 줄바꿈이 유지됩니다." onChange={e=>change('body',e.target.value)}/></label>
        <label>링크 버튼 문구(선택) <input value={form.link_label} maxLength={45} placeholder="예: 자세히 보기" onChange={e=>change('link_label',e.target.value)}/></label>
        <label>링크 주소(선택, HTTPS) <input value={form.link_url} type="url" placeholder="https://..." onChange={e=>change('link_url',e.target.value)}/></label>
        <label className="cms-wide">사진 주소(선택, HTTPS) <input value={form.image_url} type="url" placeholder="https://..." onChange={e=>change('image_url',e.target.value)}/></label>
        <label>정렬 순서 (작을수록 먼저) <input type="number" min="0" max="9999" step="1" value={form.sort_order} onChange={e=>change('sort_order',e.target.value)}/></label>
        <label className="cms-check"><input type="checkbox" checked={form.is_published} onChange={e=>change('is_published',e.target.checked)}/> 즉시 공개</label>
      </div>
      <div className="cms-admin-actions"><button className="portal-button" type="submit" disabled={busy}>{busy ? '처리 중…' : editingId ? '변경 사항 저장' : '새 항목 저장'}</button>{editingId && <button className="portal-outline" type="button" onClick={resetForm}>취소</button>}</div>
      <small className="muted">사진은 웹에서 접근 가능한 HTTPS URL을 입력합니다. 파일 직접 업로드는 이 버전에 포함하지 않았습니다.</small>
    </form>
    <div className="cms-admin-list"><h3>등록된 항목 {loading ? '불러오는 중…' : `(${entries.length})`}</h3>
      {entries.map(item=><div className="cms-admin-row" key={item.id}>
        <div><span className={`cms-state ${item.is_published ? 'published' : ''}`}>{item.is_published ? '공개' : '임시 저장'}</span> <span className="cms-order">순서 {item.sort_order}</span>
          <strong>{item.title}</strong><small>{item.category || '기타'} · {new Date(item.updated_at).toLocaleDateString('ko-KR')}</small>
        </div><div className="cms-row-actions">
          <button type="button" className="portal-outline" disabled={busy} onClick={()=>edit(item)}>수정</button>
          <button type="button" className="portal-outline" disabled={busy} onClick={()=>toggle(item)}>{item.is_published ? '비공개' : '공개'}</button>
          <button type="button" className="portal-outline cms-delete" disabled={busy} onClick={()=>remove(item)}>삭제</button>
        </div></div>)}
      {!loading && !entries.length && <p className="muted">아직 등록된 항목이 없습니다.</p>}
    </div>
  </div>;
}
