import React,{useEffect,useState} from 'react';
import './privacy.css';
async function privacyApi(path,session,method='GET'){
  const res=await fetch(path,{method,headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'});
  const value=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(value.error||`요청 실패 (${res.status})`);
  return value;
}
export function PrivacyAdminPanel({session}){
  const [runs,setRuns]=useState([]);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const [published,setPublished]=useState(false);
  const [checks,setChecks]=useState(null);
  const [result,setResult]=useState(null);
  async function reload(){
    setLoading(true);setError('');
    try{const [r,c]=await Promise.all([privacyApi('/api/admin/privacy/status',session),fetch('/api/privacy/config',{cache:'no-store'}).then(x=>x.json())]);setRuns(r.runs||[]);setPublished(r.privacyPublished);setChecks(c.publicationChecks||null);}
    catch(e){setError(e.message);}finally{setLoading(false);}
  }
  useEffect(()=>{if(session)reload();},[session?.access_token]);
  async function manual(){
    if(!window.confirm('보유 기간이 지난 멘토링 요청 및 비회원 글을 실제 삭제합니다. 실행하시겠습니까?'))return;
    setLoading(true);setError('');
    try{const r=await privacyApi('/api/admin/privacy/run',session,'POST');setResult(r.counts);await reload();}
    catch(e){setError(e.message);}finally{setLoading(false);}
  }
  return <section className="portal-card privacy-dashboard">
    <h2>개인정보·정기 삭제 관리</h2>
    <p>삭제 실행 내역에는 날짜와 유형별 건수만 저장되며 질문·이메일·사용자 ID는 기록하지 않습니다.</p>
    {!published&&<p className="privacy-pending">처리방침 게시에 필요한 운영진 검토 정보가 미설정 상태입니다. Render 환경변수에 운영 주체, 문의 이메일, 시행일, 외부 서비스 처리 상세, 검토 여부를 입력하세요.</p>}
    {!published&&checks&&<div className="privacy-review-checks"><h3>처리방침 공개 전 확인</h3><ul><li>운영 주체 확인: {checks.operatorConfirmed?'확인 표시됨':'미확인'}</li><li>국외 이전·계약 조건 검토: {checks.transfersVerified?'확인 표시됨':'미확인'}</li><li>전체 문안 최종 검토: {checks.documentReviewed?'확인 표시됨':'미확인'}</li><li>초안 표시·미확정 문구: {checks.containsDraftText?'남아 있음':'감지되지 않음'}</li></ul><p>이 상태 표시는 설정값과 초안 문구에 대한 점검입니다. 법률 검토나 실제 계약 확인을 자동으로 보증하지 않습니다.</p></div>}
    {error&&<p className="privacy-pending" role="alert">{error}</p>}
    <p><a href="/privacy" target="_blank" rel="noopener noreferrer">현재 개인정보처리방침 확인 ↗</a>　<a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">Supabase에서 Cron 활성화·실행 기록 확인 ↗</a></p>
    <p><strong>정기 실행 활성 여부는 Supabase Cron에서 확인해야 합니다.</strong> 여기에는 최근 성공한 삭제 기록만 표시됩니다. 실패한 작업은 Cron 실행 로그를 확인하세요.</p>
    <div className="portal-actions"><button className="portal-outline" type="button" onClick={reload} disabled={loading}>실행 내역 갱신</button>
      <button className="portal-button" type="button" onClick={manual} disabled={loading}>보유기간 만료 자료 지금 정리</button></div>
    {result&&<p role="status">수동 실행 완료 · 멘토링 만료 {result.expiredMentoring}건 · 멘토링 삭제 {result.deletedMentoring}건 · 비회원 글 삭제 {result.deletedGuestPosts}건</p>}
    {runs.length===0?<p>아직 정기 삭제 실행 내역이 없습니다. Cron 등록 후 최초 실행 시각을 확인해 주세요.</p>:<div style={{overflowX:'auto'}}><table className="privacy-history"><thead><tr><th>실행 시각</th><th>요청 만료</th><th>요청 삭제</th><th>비회원 글 삭제</th></tr></thead><tbody>
      {runs.map((r,i)=><tr key={r.ran_at+i}><td>{new Date(r.ran_at).toLocaleString('ko-KR')}</td><td>{r.expired_mentor_requests}</td><td>{r.deleted_mentor_requests}</td><td>{r.deleted_guest_posts}</td></tr>)}
    </tbody></table></div>}
  </section>;
}
