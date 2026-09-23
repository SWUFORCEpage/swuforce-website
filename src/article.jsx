import React, {useEffect, useState} from 'react';
import {useAuth} from './portal.jsx';
import {MarkdownArticle} from './markdown.jsx';
import './article.css';
function safeUrl(value){if(typeof value!=='string')return null;try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
const backPaths={home:'/',about:'/about',study:'/study',news:'/news',community:'/board',members:'/members',recruit:'/recruit',me:'/me',mentoring:'/mentoring'};
export function ArticleDetail({id}) {
  const {session,ready}=useAuth();
  const [item,setItem]=useState(null);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    if(!ready)return;
    const controller=new AbortController();
    setLoading(true);setError('');
    fetch(`/api/articles/${encodeURIComponent(id)}`,{headers:session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{},cache:'no-store',signal:controller.signal})
      .then(async r=>{const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'글을 불러오지 못했습니다.');return data.article;})
      .then(setItem).catch(e=>{if(e.name!=='AbortError')setError(e.message);})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[id,ready,session?.access_token]);
  const cover=safeUrl(item?.image_url);const source=safeUrl(item?.link_url);
  const back=backPaths[item?.page]||'/news';
  const date=item?.published_on||item?.created_at?.slice(0,10);
  return <main className="article-page" id="main-content"><div className="container article-layout">
    <a className="article-back" href={back}>← 목록으로</a>
    {loading&&<p role="status">글을 불러오는 중입니다…</p>}
    {error&&<p className="cms-error" role="alert">{error}</p>}
    {item&&<article>
      {!item.is_published&&<div className="article-draft">관리자 미리보기 · 아직 공개되지 않은 글입니다.</div>}
      <header className="article-head"><span className="article-eyebrow">SWUFORCE / {item.category||'NEWS'}</span><h1>{item.title}</h1><p className="article-meta">{date ? new Date(`${date}T00:00:00`).toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'}) : ''} · SWUFORCE</p>{item.body&&<p className="article-summary">{item.body}</p>}</header>
      {cover&&<figure className="article-cover"><img src={cover} alt={`${item.title} 대표 이미지`} referrerPolicy="no-referrer"/></figure>}
      <MarkdownArticle markdown={item.article_body || item.body}/>
      {source&&<footer className="article-source"><a href={source} target="_blank" rel="noopener noreferrer">{item.link_label||'원문 보기'} ↗</a><p>외부에 게시된 기존 글을 이전한 경우 원문을 확인할 수 있습니다.</p></footer>}
      <nav className="article-bottom"><a href={back}>← 목록으로 돌아가기</a></nav>
    </article>}
  </div></main>;
}
