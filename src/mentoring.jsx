import React, { useEffect, useState } from 'react';
import { useAuth } from './portal.jsx';
import { PageContent } from './site-content.jsx';
import './mentoring.css';

const defaultProfile = {
  job_field:'', job_title:'', introduction:'', show_cohort:false, accepting_requests:false,
  email_notifications:false, allow_full_question_email:false, consent_directory:false,
};
const initialQuestion = { question:'', share_cohort:false, allow_full_email:false, agree_collect:false, agree_share:false };
const statuses = {pending:'수락 대기',accepted:'수락됨',declined:'거절됨',answered:'답변 완료',expired:'만료',closed:'종료'};
async function api(path,{session,method='GET',body}={}) {
  let res;
  try {res=await fetch(path,{method,headers:{...(session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{ }),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});}
  catch {throw new Error('서버에 연결할 수 없습니다.');}
  const json=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(json.error||`처리하지 못했습니다. (${res.status})`);
  return json;
}
export function MentoringPage() {
  const {session,profile,ready} = useAuth();
  const [mentors,setMentors]=useState([]);
  const [mine,setMine]=useState(null);
  const [canOffer,setCanOffer]=useState(false);
  const [requests,setRequests]=useState([]);
  const [selected,setSelected]=useState(null);
  const [form,setForm]=useState(defaultProfile);
  const [question,setQuestion]=useState(initialQuestion);
  const [answer,setAnswer]=useState({});
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const allowed=Boolean(profile?.is_verified && ['active','alumni'].includes(profile?.membership_status));
  const currentMember=Boolean(profile?.is_verified && profile?.membership_status==='active');
  async function load(token=session){
    if(!token) return;
    setLoading(true); setError('');
    try {
      const [list,settings,history]=await Promise.all([
        api('/api/mentoring/mentors',{session:token}),api('/api/mentoring/profile',{session:token}),api('/api/mentoring/requests',{session:token}),
      ]);
      setMentors(list.mentors||[]);setMine(settings.mentor);setCanOffer(settings.can_offer);setRequests(history.requests||[]);
      if(settings.mentor) setForm({...defaultProfile,...settings.mentor,consent_directory:Boolean(settings.mentor.accepting_requests)});
    }catch(e){setError(e.message);}finally{setLoading(false);}
  }
  useEffect(()=>{if(ready&&session&&allowed) load(session);},[ready,session?.access_token,allowed]);
  async function saveProfile(e){
    e.preventDefault();setBusy(true);setNotice('');setError('');
    try {
      const result=await api('/api/mentoring/profile',{session,method:'PUT',body:form});
      setMine(result.mentor);setNotice('멘토 정보가 저장되었습니다.');await load();
    }catch(err){setError(err.message);}finally{setBusy(false);}
  }
  async function removeProfile(){
    if(!window.confirm('멘토 정보와 연결된 질문·답변을 즉시 삭제합니다. 진행 중인 요청도 삭제됩니다. 계속하시겠습니까?'))return;
    setBusy(true);setError('');setNotice('');
    try{await api('/api/mentoring/profile',{session,method:'DELETE'});setMine(null);setForm(defaultProfile);setNotice('멘토 정보 및 연결된 요청을 삭제했습니다.');await load();}
    catch(e){setError(e.message);}finally{setBusy(false);}
  }
  async function requestAdvice(e){
    e.preventDefault();if(!selected)return;
    setBusy(true);setNotice('');setError('');
    try {
      const result=await api('/api/mentoring/requests',{session,method:'POST',body:{...question,mentor_id:selected.id}});
      setNotice(result.notice);setSelected(null);setQuestion(initialQuestion);await load();
    }catch(err){setError(err.message);}finally{setBusy(false);}
  }
  async function action(id,command){
    setBusy(true);setNotice('');setError('');
    try {
      await api(`/api/mentoring/requests/${encodeURIComponent(id)}`,{session,method:'PATCH',body:{action:command,...(command==='answer'?{answer:answer[id]||''}:{})}});
      setNotice(command==='answer'?'답변을 등록했습니다.':command==='accept'?'요청을 수락했습니다.':command==='decline'?'요청을 거절했습니다.':'요청을 종료했습니다.');
      setAnswer(old=>({...old,[id]:''}));await load();
    }catch(err){setError(err.message);}finally{setBusy(false);}
  }
  return <main className="mentor-page" id="main-content">
    <section className="mentor-intro"><div className="container"><span className="mentor-kicker">SWUFORCE / MEMBERS ONLY</span><h1>Mentoring</h1><p>졸업 학회원의 직무를 확인하고, 관심 분야에 대한 조언을 요청할 수 있습니다.</p></div></section>
    <div className="container mentor-layout">
      {!ready?<p>로그인 정보를 확인하고 있습니다.</p>:!session?<div className="mentor-note"><p>멘토링은 로그인 후 이용할 수 있습니다.</p><a href="/login">로그인</a></div>:!allowed?<div className="mentor-note"><p>운영진이 승인한 활동·졸업 학회원만 멘토 정보를 확인할 수 있습니다.</p><a href="/me">가입 상태 확인</a></div>:<>
        <PageContent page="mentoring" embedded title="멘토링 안내" session={session}/>
        {error&&<div className="mentor-alert" role="alert">{error}</div>}
        {notice&&<div className="mentor-notice" role="status">{notice}</div>}
        <section className="mentor-section"><div className="mentor-head"><div><span>01 / ALUMNI</span><h2>직무별 멘토</h2></div><p>멘토가 자발적으로 공개한 닉네임과 직무만 표시됩니다.</p></div>
          {loading?<p>불러오는 중…</p>:mentors.length===0?<p className="mentor-empty">현재 조언 요청을 받는 졸업 학회원이 없습니다.</p>:<div className="mentor-grid">{mentors.map(m=><article className="mentor-card" key={m.id}>
            <div className="mentor-card-top"><span>{m.job_field}</span>{m.cohort&&<small>{m.cohort}기</small>}</div>
            <h3>{m.nickname}</h3>{m.job_title&&<p className="mentor-job">{m.job_title}</p>}
            {m.introduction&&<p>{m.introduction}</p>}
            {currentMember&&<button type="button" onClick={()=>{setSelected(m);setError('');setNotice('');setQuestion(initialQuestion);}}>조언 요청하기</button>}
          </article>)}</div>}
        </section>
        {currentMember&&selected&&<section className="mentor-section mentor-request-panel" aria-labelledby="mentor-request-title"><h2 id="mentor-request-title">{selected.nickname} 멘토에게 조언 요청</h2><p>선택한 멘토에게만 전달됩니다. 질문에 실명·연락처 등 불필요한 개인정보를 적지 마세요.</p>
          <form onSubmit={requestAdvice} className="mentor-form">
            <label>질문 내용 (20~2000자)<textarea required minLength={20} maxLength={2000} rows={7} value={question.question} onChange={e=>setQuestion({...question,question:e.target.value})} placeholder="궁금한 직무나 준비 과정에 대해 구체적으로 작성해 주세요."/></label>
            <fieldset><legend>공유할 정보</legend><p>멘토에게 닉네임 <strong>{profile.display_name}</strong>과 질문이 전달됩니다. 이메일과 실명은 공개되지 않습니다.</p>
              <label className="mentor-check"><input type="checkbox" checked={question.share_cohort} onChange={e=>setQuestion({...question,share_cohort:e.target.checked})}/> 활동 기수({profile.cohort}기)도 멘토에게 공개 (선택)</label>
              <label className="mentor-check"><input type="checkbox" checked={question.allow_full_email} onChange={e=>setQuestion({...question,allow_full_email:e.target.checked})}/> 멘토가 이메일 전문 수신을 허용한 경우 질문 전문도 이메일로 전달 (선택)</label>
              <p className="mentor-muted">기본 이메일 알림에는 닉네임과 선택한 기수, 사이트 링크만 포함됩니다. 이메일로 발송된 내용은 나중에 회수할 수 없습니다. <a href="/privacy" target="_blank" rel="noopener noreferrer">개인정보처리방침</a></p>
            </fieldset>
            <fieldset><legend>개인정보 안내 및 동의</legend><p><a href="/privacy" target="_blank" rel="noopener noreferrer">개인정보처리방침 전문 보기 ↗</a></p>
              <p>처리 목적: SWUFORCE 멘토링 요청·답변 제공. 수집 항목: 기존 계정의 닉네임·기수(선택), 선택한 멘토, 질문, 답변, 동의 기록. 답변을 받지 못한 요청은 14일 후 만료됩니다. 종료된 요청과 답변은 30일 후 삭제합니다. <a href="/privacy" target="_blank" rel="noopener noreferrer">개인정보처리방침</a>에서 상세 기준을 확인할 수 있습니다. 서비스 탈퇴 또는 삭제 요청은 운영진 공식 채널을 통해 처리합니다.</p>
              <label className="mentor-check"><input type="checkbox" required checked={question.agree_collect} onChange={e=>setQuestion({...question,agree_collect:e.target.checked})}/> [필수] 위 멘토링 개인정보 수집·이용에 동의합니다.</label>
              <p>제공받는 사람: 위에서 선택한 졸업 학회원 1명. 제공 항목: 닉네임, 선택 공개한 기수, 질문 내용. 목적: 조언 요청 확인 및 답변. 보관: 사이트 내 요청 종료 후 30일. 동의하지 않아도 멘토 목록은 열람할 수 있으나 요청을 보낼 수는 없습니다.</p>
              <label className="mentor-check"><input type="checkbox" required checked={question.agree_share} onChange={e=>setQuestion({...question,agree_share:e.target.checked})}/> [별도 동의] 선택한 졸업 학회원에게 위 정보를 제공하는 데 동의합니다.</label>
            </fieldset>
            <div className="mentor-actions"><button disabled={busy||!question.agree_collect||!question.agree_share} type="submit">{busy?'전송 중…':'요청 보내기'}</button><button className="mentor-quiet" type="button" onClick={()=>setSelected(null)}>취소</button></div>
          </form>
        </section>}
        {canOffer&&<section className="mentor-section"><div className="mentor-head"><div><span>02 / MENTOR SETTINGS</span><h2>멘토 정보 및 수신 설정</h2></div><p>직무 공개와 요청 수신은 졸업 학회원이 직접 선택합니다.</p></div>
          <form className="mentor-form" onSubmit={saveProfile}>
            <div className="mentor-form-row"><label>직무 분야<input value={form.job_field} maxLength={80} onChange={e=>setForm({...form,job_field:e.target.value})} placeholder="예: 디지털포렌식"/></label><label>직무 소개 (선택)<input value={form.job_title} maxLength={80} onChange={e=>setForm({...form,job_title:e.target.value})} placeholder="예: 모바일 포렌식 분석"/></label></div>
            <label>한 줄 소개 (선택)<textarea value={form.introduction} maxLength={500} rows={3} onChange={e=>setForm({...form,introduction:e.target.value})}/></label>
            <fieldset><legend>공개 및 알림 선택</legend>
              <label className="mentor-check"><input type="checkbox" checked={form.show_cohort} onChange={e=>setForm({...form,show_cohort:e.target.checked})}/> 내 활동 기수도 멘토 목록에 표시</label>
              <label className="mentor-check"><input type="checkbox" checked={form.accepting_requests} onChange={e=>setForm({...form,accepting_requests:e.target.checked})}/> 조언 요청 받기 (언제든 해제 가능)</label>
              {form.accepting_requests&&<label className="mentor-check"><input type="checkbox" required checked={form.consent_directory} onChange={e=>setForm({...form,consent_directory:e.target.checked})}/> [필수] 승인된 학회원에게 닉네임·직무 분야·선택한 기수 및 소개를 공개하는 데 동의합니다.</label>}
              <label className="mentor-check"><input type="checkbox" checked={form.email_notifications} onChange={e=>setForm({...form,email_notifications:e.target.checked,allow_full_question_email:e.target.checked?form.allow_full_question_email:false})}/> 가입 이메일로 새 요청 알림 받기 (선택)</label>
              {form.email_notifications&&<label className="mentor-check"><input type="checkbox" checked={form.allow_full_question_email} onChange={e=>setForm({...form,allow_full_question_email:e.target.checked})}/> 후배가 별도로 동의한 질문 전문도 이메일로 받기 (선택)</label>}
              <p className="mentor-muted">이메일 알림을 끄면 홈페이지에서만 확인할 수 있습니다. 이메일 알림은 사이트 운영자가 메일 발송 서비스를 연결한 경우 제공됩니다.</p>
            </fieldset><button disabled={busy} type="submit">설정 저장</button>{mine&&<button disabled={busy} type="button" className="mentor-quiet" onClick={removeProfile}>멘토 정보 및 연결된 요청 삭제</button>}
          </form>
        </section>}
        <section className="mentor-section"><div className="mentor-head"><div><span>03 / MY REQUESTS</span><h2>내 멘토링 요청</h2></div><p>조언 요청 내역은 신청자와 선택한 멘토만 확인할 수 있습니다.</p></div>
          {requests.length===0?<p className="mentor-empty">아직 멘토링 요청이 없습니다.</p>:<div className="mentor-history">{requests.map(r=><article className="mentor-history-card" key={r.id}>
            <div className="mentor-history-head"><strong>{r.role==='mentor'?r.requester_nickname:r.mentor_name}</strong><span>{statuses[r.status]||r.status}</span></div>
            <small>{new Date(r.created_at).toLocaleDateString('ko-KR')}{r.requester_cohort&&` · ${r.requester_cohort}기`}</small>
            <p className="mentor-question">{r.question}</p>
            {r.answer&&<div className="mentor-response"><b>답변</b><p>{r.answer}</p></div>}
            {r.role==='mentor'&&r.status==='pending'&&<div className="mentor-actions"><button disabled={busy} onClick={()=>action(r.id,'accept')}>요청 수락</button><button className="mentor-quiet" disabled={busy} onClick={()=>action(r.id,'decline')}>거절</button></div>}
            {r.role==='mentor'&&r.status==='accepted'&&<div className="mentor-form"><label>조언 작성<textarea rows={5} minLength={2} maxLength={5000} value={answer[r.id]||''} onChange={e=>setAnswer({...answer,[r.id]:e.target.value})}/></label><button disabled={busy||(answer[r.id]||'').trim().length<2} onClick={()=>action(r.id,'answer')}>답변 등록</button></div>}
            {r.role==='requester'&&['pending','accepted'].includes(r.status)&&<button className="mentor-quiet" disabled={busy} onClick={()=>action(r.id,'close')}>요청 철회</button>}
          </article>)}</div>}
          <p className="mentor-muted">답변을 받지 못한 요청은 14일 후 만료됩니다. 종료된 질문·답변은 30일 후 삭제됩니다(일일 정기 작업 실행 현황은 운영자가 확인합니다). 메일로 발송된 사본은 사이트에서 삭제할 수 없습니다.</p>
        </section>
      </>}
    </div>
  </main>;
}
