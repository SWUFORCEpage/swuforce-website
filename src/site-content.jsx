import React, {useEffect,useRef,useState} from 'react';
import {MarkdownArticle} from './markdown.jsx';

export const CONTENT_PAGE_NAMES={home:'Home',about:'About',study:'Study',news:'News',community:'Community',members:'Members',recruit:'Recruit',me:'My Page',mentoring:'Mentoring'};
const emptyForm=page=>({page,category:'',title:'',body:'',article_body:'',published_on:null,link_label:'',link_url:'',image_url:'',sort_order:100,is_published:false});
const MAX_PHOTO=6*1024*1024;
function externalHttps(value){
  if(typeof value!=='string'||!value)return null;
  try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}
}
async function getJSON(url,options={}){
  let r;try{r=await fetch(url,{cache:'no-store',...options});}catch{throw new Error('서버에 연결하지 못했습니다.');}
  const body=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(body.error||`요청 실패 (${r.status})`);
  return body;
}
const backPaths={news:'/news',home:'/',about:'/about',study:'/study',community:'/board',members:'/members',recruit:'/recruit',me:'/me',mentoring:'/mentoring'};
export function PageContent({page,embedded=false,title='추가 안내',session=null}){
  const [entries,setEntries]=useState([]);const [error,setError]=useState('');const [hasMore,setHasMore]=useState(false);const [moreBusy,setMoreBusy]=useState(false);
  useEffect(()=>{let alive=true;setEntries([]);setError('');setHasMore(false);
    getJSON(`/api/content/${encodeURIComponent(page)}`,{headers:session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{}})
      .then(v=>{if(alive){setEntries(v.entries||[]);setHasMore(Boolean(v.hasMore));}}).catch(e=>{if(alive)setError(e.message);});
    return()=>{alive=false;};
  },[page,session?.access_token]);
  async function more(){setMoreBusy(true);setError('');try{const v=await getJSON(`/api/content/${encodeURIComponent(page)}?offset=${entries.length}`,{headers:session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{}});setEntries(old=>[...old,...(v.entries||[])]);setHasMore(Boolean(v.hasMore));}catch(e){setError(e.message);}finally{setMoreBusy(false);}}
  if(!entries.length&&!error)return null;
  return <section className={`cms-section ${embedded?'cms-embedded':''}`} aria-label={`${CONTENT_PAGE_NAMES[page]||page} 추가 정보`}><div className={embedded?'':'container'}>
    {entries.length>0&&<><div className="cms-heading"><span>SWUFORCE / {CONTENT_PAGE_NAMES[page]}</span><h2>{title}</h2></div>
    <div className="cms-grid">{entries.map(item=>{
      const link=externalHttps(item.link_url);const cover=externalHttps(item.image_url);const detail=`/articles/${item.id}`;
      return <article className="cms-item cms-blog-card" key={item.id}>
        {cover&&<a href={detail} className="cms-card-cover" aria-label={`${item.title} 자세히 읽기`}><img src={cover} alt={`${item.title} 대표 사진`} loading="lazy" referrerPolicy="no-referrer"/></a>}
        <div className="cms-item-content">
          <div className="cms-card-top">{item.category&&<span className="cms-item-category">{item.category}</span>}{(item.published_on||item.created_at)&&<time dateTime={item.published_on||item.created_at?.slice(0,10)}>{(item.published_on||item.created_at?.slice(0,10)).replaceAll('-','. ')}</time>}</div>
          <h3><a href={detail} className="cms-card-title">{item.title}</a></h3>
          {item.body&&<p className="cms-excerpt">{item.body}</p>}
          <div className="cms-card-actions"><a href={detail}>글 전체 보기 →</a>{link&&<a href={link} target="_blank" rel="noopener noreferrer">{item.link_label||'외부 원문'} ↗</a>}</div>
        </div>
      </article>;
    })}</div></>}
    {hasMore&&<div className="cms-loadmore"><button type="button" disabled={moreBusy} onClick={more}>{moreBusy?'불러오는 중…':'글 더 보기'}</button></div>}
    {error&&<p className="cms-error" role="status">추가 정보를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>}
  </div></section>;
}
function imageLabel(file){return (file.name.replace(/\.[^.]+$/,'').replace(/[\[\]()!\r\n]/g,' ').trim()||'SWUFORCE 활동 사진').slice(0,90);}
async function uploadImage(file,token,page){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||!file.size||file.size>MAX_PHOTO)
    throw new Error('JPEG·PNG·WebP 사진만 업로드할 수 있습니다. 사진당 최대 6MB입니다.');
  return getJSON('/api/admin/content/upload-image',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/octet-stream','X-Image-Type':file.type,'X-Content-Page':page},body:file});
}
/** Only confirmed site_admin may use these endpoints. No Supabase secret ever goes to browsers. */
export function AdminPageContent({session}){
  const [page,setPage]=useState('news');const [entries,setEntries]=useState([]);
  const [form,setForm]=useState(emptyForm('news'));const [editingId,setEditingId]=useState(null);
  const [busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[loading,setLoading]=useState(false);
  const [error,setError]=useState(''),[message,setMessage]=useState(''),[preview,setPreview]=useState(false);
  const coverRef=useRef(null),bodyRef=useRef(null);
  const token=session?.access_token||'';
  async function load(targetPage,auth=token){if(!auth)return;setLoading(true);setError('');try{
    const data=await getJSON(`/api/admin/content/${targetPage}`,{headers:{Authorization:`Bearer ${auth}`}});
    setEntries(data.entries||[]);
  }catch(e){setError(e.message);}finally{setLoading(false);}}
  useEffect(()=>{load(page);},[page,token]);
  function changePage(next){if(uploading)return;setPage(next);setForm(emptyForm(next));setEditingId(null);setMessage('');setError('');setPreview(false);}
  function change(field,value){setForm(old=>({...old,[field]:value}));}
  function resetForm(){setForm(emptyForm(page));setEditingId(null);setPreview(false);}
  function edit(item){setEditingId(item.id);setForm({page:item.page,category:item.category||'',title:item.title,body:item.body||'',article_body:item.article_body||'',published_on:item.published_on||null,link_label:item.link_label||'',link_url:item.link_url||'',image_url:item.image_url||'',sort_order:item.sort_order,is_published:item.is_published});setMessage('');setError('');setPreview(false);window.scrollTo({top:0,behavior:'smooth'});}
  async function coverPhoto(ev){const file=ev.target.files?.[0];ev.target.value='';if(!file)return;setUploading(true);setError('');setMessage('');try{
    const r=await uploadImage(file,token,page);change('image_url',r.url);setMessage('대표 사진이 업로드되었습니다. 저장 버튼을 눌러 글에 반영하세요.');
  }catch(e){setError(e.message);}finally{setUploading(false);}}
  async function bodyPhotos(ev){const files=[...(ev.target.files||[])];ev.target.value='';if(!files.length)return;
    if(files.length>12){setError('본문 사진은 한 번에 12장까지 올릴 수 있습니다.');return;}
    setUploading(true);setError('');setMessage('');const markdown=[];
    try{for(const file of files){const r=await uploadImage(file,token,page);markdown.push(`![${imageLabel(file)}](${r.url})`);}
      setForm(old=>({...old,article_body:[old.article_body,...markdown].filter(Boolean).join('\n\n')}));
      setMessage(`사진 ${markdown.length}장을 본문 맨 아래에 추가했어요. 원하는 위치로 사진 코드를 옮길 수 있습니다.`);
    }catch(e){if(markdown.length)setForm(old=>({...old,article_body:[old.article_body,...markdown].filter(Boolean).join('\n\n')}));setError(`업로드 중단: ${e.message} (성공한 사진 ${markdown.length}장)`);}
    finally{setUploading(false);}
  }
  async function save(ev){ev.preventDefault();if(uploading)return;setBusy(true);setError('');setMessage('');try{
    const path=editingId?`/api/admin/content/${editingId}`:'/api/admin/content';
    const r=await getJSON(path,{method:editingId?'PATCH':'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({...form,sort_order:Number(form.sort_order)})});
    resetForm();setMessage(`저장되었습니다. ${editingId?'':'새 글을 등록했어요.'} ${r.id?`글 주소: /articles/${r.id}`:''}`);await load(page);
  }catch(e){setError(e.message);}finally{setBusy(false);}}
  async function toggle(item){setBusy(true);setError('');setMessage('');try{
    await getJSON(`/api/admin/content/${item.id}`,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({...item,article_body:item.article_body||'',published_on:item.published_on||null,link_url:item.link_url||'',image_url:item.image_url||'',is_published:!item.is_published})});
    setMessage(item.is_published?'비공개로 변경했습니다.':'공개했습니다.');await load(page);
  }catch(e){setError(e.message);}finally{setBusy(false);}}
  async function remove(item){if(!window.confirm(`“${item.title}” 글을 삭제할까요? 글은 되돌릴 수 없습니다. 업로드한 사진은 별도 정리해야 합니다.`))return;
    setBusy(true);setError('');setMessage('');try{
      await getJSON(`/api/admin/content/${item.id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});
      if(editingId===item.id)resetForm();setMessage('글이 삭제되었습니다. 사진은 Storage에 남으니 필요 없는 사진은 별도 정리해 주세요.');await load(page);
    }catch(e){setError(e.message);}finally{setBusy(false);}}
  const locked=busy||uploading;
  const publicImagePage = page!=='me' && page!=='mentoring';
  return <div className="portal-card cms-admin">
    <h2>페이지 콘텐츠·블로그 관리</h2>
    <p className="muted">공지와 활동 기록을 블로그처럼 작성하고 대표 이미지 및 본문 사진 원본을 직접 업로드할 수 있습니다. 기존 Velog·Tistory 글의 본문을 옮기고 외부 원문도 연결할 수 있어요.</p>
    <label className="cms-admin-page">편집할 페이지<select disabled={locked} value={page} onChange={e=>changePage(e.target.value)}>{Object.entries(CONTENT_PAGE_NAMES).map(([k,v])=><option value={k} key={k}>{v}</option>)}</select></label>
    {error&&<p className="cms-error" role="alert">{error}</p>}{message&&<p className="cms-success" role="status">{message}</p>}
    <form className="cms-admin-form" onSubmit={save}>
      <h3>{editingId?'등록된 글 수정':`${CONTENT_PAGE_NAMES[page]}에 새 글 추가`}</h3>
      <div className="cms-admin-fields">
        <label>분류<input value={form.category} maxLength={35} placeholder="공지 / 스터디 / 행사 / 프로젝트" onChange={e=>change('category',e.target.value)}/></label>
        <label>원래 게시 날짜(선택)<input type="date" value={form.published_on||''} onChange={e=>change('published_on',e.target.value||null)}/></label>
        <label className="cms-wide">제목<input required minLength={2} maxLength={120} value={form.title} placeholder="예: SWUFORCE 2025 연합세미나 후기" onChange={e=>change('title',e.target.value)}/></label>
        <label className="cms-wide">목록에 표시할 짧은 소개<textarea value={form.body} maxLength={2200} rows={3} placeholder="글 목록 카드와 상세 화면 상단에 표시됩니다." onChange={e=>change('body',e.target.value)}/></label>
        <div className="cms-wide cms-photo-upload"><strong>대표 사진 원본</strong><input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" disabled={locked||!publicImagePage} onChange={coverPhoto}/><small>사진당 6MB 이하. 업로드 완료 후 저장하세요.</small>{form.image_url&&<div className="cms-cover-preview"><img src={externalHttps(form.image_url)||undefined} alt="대표 이미지 미리보기" referrerPolicy="no-referrer"/><button type="button" className="portal-outline" onClick={()=>change('image_url','')}>대표 이미지 연결 해제</button></div>}</div>
        <label className="cms-wide">또는 대표 사진 HTTPS 주소<input type="url" value={form.image_url} placeholder="https://... (기존 링크가 있을 때)" onChange={e=>change('image_url',e.target.value)}/></label>
        <div className="cms-wide cms-article-editor"><strong>블로그 본문</strong><p className="muted">Velog Markdown을 붙여넣거나 직접 작성하세요. 제목은 <code>## 제목</code>, 굵은 글씨는 <code>**문구**</code>, 링크는 <code>[이름](https://...)</code> 형식입니다. HTML 삽입 코드는 지원하지 않습니다.</p>
          <div className="cms-markdown-tools"><button type="button" disabled={locked} onClick={()=>change('article_body',form.article_body+'\n\n## 소제목\n')}>소제목 추가</button><button type="button" disabled={locked} onClick={()=>change('article_body',form.article_body+'\n\n**강조할 내용**')}>굵게 추가</button><button type="button" disabled={locked} onClick={()=>setPreview(v=>!v)}>{preview?'편집 화면':'본문 미리보기'}</button></div>
          {preview?<div className="cms-editor-preview"><MarkdownArticle markdown={form.article_body||form.body}/></div>:<textarea className="cms-article-textarea" value={form.article_body} maxLength={100000} rows={16} placeholder={'## 행사 소개\n\n행사 내용을 자유롭게 작성해 주세요.\n\n아래에서 사진을 업로드하면 이곳에 자동 삽입됩니다.'} onChange={e=>change('article_body',e.target.value)}/>}
          <label className="cms-body-upload">본문 사진 원본 여러 장 선택<input ref={bodyRef} type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={locked||!publicImagePage} onChange={bodyPhotos}/></label><small>사진을 업로드하면 본문 맨 아래에 삽입됩니다. 사진과 문단 순서는 삽입된 코드를 옮겨 조절할 수 있습니다.</small>
        </div>
        <label>외부 원문 링크 이름(선택)<input maxLength={45} value={form.link_label} placeholder="기존 Velog 원문 보기" onChange={e=>change('link_label',e.target.value)}/></label>
        <label>외부 원문 HTTPS 주소(선택)<input type="url" value={form.link_url} placeholder="https://velog.io/..." onChange={e=>change('link_url',e.target.value)}/></label>
        <label>정렬 순서<input type="number" min="0" max="9999" step="1" value={form.sort_order} onChange={e=>change('sort_order',e.target.value)}/></label>
        <label className="cms-check"><input type="checkbox" checked={form.is_published} onChange={e=>change('is_published',e.target.checked)}/> 즉시 공개</label>
      </div>
      <div className="cms-public-warning">사진은 원본 그대로 Supabase의 공개 이미지 저장소에 업로드됩니다. My Page·Mentoring 등 접근 제한 페이지에서는 사진 업로드를 비활성화했습니다. 글이 임시 저장 상태여도 이미지 주소를 아는 사람은 접근할 수 있으므로, 사진에 담긴 개인정보·GPS 메타데이터 및 촬영 대상의 공개 동의를 먼저 확인해 주세요.</div>
      <div className="cms-admin-actions"><button className="portal-button" type="submit" disabled={locked}>{uploading?'사진 업로드 중…':busy?'저장 중…':editingId?'변경 사항 저장':'새 글 저장'}</button>{editingId&&<button className="portal-outline" type="button" disabled={locked} onClick={resetForm}>수정 취소</button>}</div>
    </form>
    <div className="cms-admin-list"><h3>등록된 항목 {loading?'불러오는 중…':`(${entries.length})`}</h3>{entries.map(item=><div className="cms-admin-row" key={item.id}><div>
      <span className={`cms-state ${item.is_published?'published':''}`}>{item.is_published?'공개':'임시 저장'}</span><span className="cms-order">순서 {item.sort_order}</span><strong>{item.title}</strong><small>{item.category||'기타'} · {item.published_on||new Date(item.updated_at).toLocaleDateString('ko-KR')}</small>
      <a href={`/articles/${item.id}`} target="_blank" rel="noopener noreferrer">{item.is_published?'실제 게시글 보기':'관리자 미리보기'} ↗</a>
    </div><div className="cms-row-actions"><button type="button" className="portal-outline" disabled={locked} onClick={()=>edit(item)}>수정</button><button type="button" className="portal-outline" disabled={locked} onClick={()=>toggle(item)}>{item.is_published?'비공개':'공개'}</button><button type="button" className="portal-outline cms-delete" disabled={locked} onClick={()=>remove(item)}>삭제</button></div></div>)}{!loading&&!entries.length&&<p className="muted">아직 등록된 항목이 없습니다.</p>}</div>
  </div>;
}
