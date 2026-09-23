import React, { useEffect, useState } from 'react';
import './privacy.css';

export const PRIVACY_NOTICE_VERSION = '2026-09-23-v2';

const providers = [
  ['Supabase', '회원 인증, 계정 및 홈페이지 데이터베이스'],
  ['Render', '홈페이지 및 API 서버 호스팅'],
  ['Cloudflare Turnstile', '비회원 글쓰기의 자동화 요청 방지 (사용할 때)'],
  ['Resend', '멘토링 이메일 알림 발송 (설정한 경우에만)'],
];
const Row = ({title, children}) => <section className="privacy-section"><h2>{title}</h2><div>{children}</div></section>;

/** Render /api/privacy/config contains public policy metadata only (never secrets). */
export function PrivacyPage() {
  const [config,setConfig] = useState(null);
  const [error,setError] = useState('');
  useEffect(()=>{
    const controller = new AbortController();
    fetch('/api/privacy/config',{signal:controller.signal,cache:'no-store'})
      .then(async r=>{if(!r.ok)throw new Error('개인정보처리방침 정보를 불러오지 못했습니다.');return r.json();})
      .then(setConfig).catch(e=>{if(e.name!=='AbortError')setError(e.message);});
    return ()=>controller.abort();
  },[]);
  const operator=config?.operator||'[개인정보 처리 주체 확정 필요]';
  const contact=config?.contactEmail||'[운영진 개인정보 문의 이메일 등록 필요]';
  const effective=config?.effectiveDate||'[시행일 확정 필요]';
  return <main className="privacy-page" id="main-content">
    <div className="privacy-intro"><div className="container"><span>SWUFORCE / PRIVACY</span><h1>개인정보처리방침</h1><p>홈페이지 이용 과정에서 처리하는 개인정보 및 정보주체의 권리를 안내합니다.</p></div></div>
    <div className="container privacy-layout">
      {error&&<p className="privacy-pending" role="alert">{error}</p>}
      {!config?.published&&<aside className="privacy-pending" role="status"><strong>운영진 확인 중인 문안</strong><p>처리 주체·연락처·국외 처리 및 위탁 현황·시행일을 확정하고, 실제 서버 설정과 일치하는지 점검한 뒤 공개해야 합니다. 현재 문안만으로 법적 검토가 완료된 것은 아닙니다.</p></aside>}
      <p className="privacy-meta">처리 주체: <strong>{operator}</strong> · 시행일: <strong>{effective}</strong> · 문안 버전: {config?.noticeVersion||PRIVACY_NOTICE_VERSION}</p>
      <Row title="1. 처리 목적 및 개인정보 항목">
        <table><thead><tr><th>업무</th><th>처리 목적과 항목</th></tr></thead><tbody>
          <tr><td>학회원 계정</td><td>회원가입·이메일 인증·계정 복구를 위한 이메일·인증 정보, 학회원 확인·배지 표시를 위한 닉네임·기수·신청 상태·승인 상태. 비밀번호는 인증 서비스에서 관리합니다. 명단 공개는 별도 선택입니다.</td></tr>
          <tr><td>문의 게시판</td><td>회원 글의 작성자 ID·글 내용 및 답변. 비회원은 작성 닉네임·글 내용·접근 링크의 해시값을 처리합니다. 자동 작성 방지 및 서비스 남용 방지 과정에서 접속 정보가 처리될 수 있습니다.</td></tr>
          <tr><td>졸업생 멘토링</td><td>동의한 멘토의 닉네임·직무·선택한 기수 및 소개, 멘토링 신청자의 닉네임·선택한 기수·질문·답변·선택 동의 이력. 이메일 알림은 수신에 동의한 경우에만 사용합니다.</td></tr>
        </tbody></table>
      </Row>
      <Row title="2. 처리 및 보유 기간">
        <ul><li>회원 계정과 승인 정보: 회원 탈퇴 또는 이용 목적 종료까지. 법정 보존 의무가 있는 경우 해당 정보만 별도 분리 보관합니다.</li>
          <li>회원 작성 게시글: 작성자 삭제 또는 탈퇴 시 관련 답변과 함께 삭제합니다. 다만 법령상 별도 보존 의무가 확인된 경우는 예외입니다.</li>
          <li>비회원 게시글: 이 정책 적용 이후 등록한 글은 작성일부터 <strong>180일</strong> 후 자동 삭제합니다. 비밀 링크를 보유한 작성자는 그 전에 직접 삭제할 수 있습니다. 이전 게시글은 운영진이 별도 고지·정리합니다.</li>
          <li>멘토링 요청: 미답변 요청은 생성 후 <strong>14일</strong> 경과 시 만료 처리, 종료 또는 만료 후 <strong>30일</strong>이 지나면 질문·답변·동의 이력을 삭제합니다. 회원 탈퇴 또는 멘토 정보 삭제 시 연결된 요청도 즉시 삭제됩니다.</li>
          <li>멘토 직무 공개 정보: 본인이 공개 설정을 해제하거나 멘토 정보를 삭제·탈퇴할 때까지 보유합니다.</li>
          <li>정기 삭제 실행 내역: 개인 식별정보 없이 삭제 건수와 실행 시각만 기록합니다.</li></ul>
      </Row>
      <Row title="3. 동의에 따른 정보 공개 및 전달">
        <p>학회원 명단은 본인이 공개에 동의한 경우에만 닉네임·기수·승인된 활동 상태 및 직책 배지를 공개합니다. 멘토링의 경우 신청자가 선택한 졸업 학회원 1인에게 닉네임·질문과 선택 공개 기수가 전달됩니다. 멘토 목록 공개와 질문 전문 이메일 발송은 각각 별도의 선택에 따릅니다. 이메일로 이미 발송한 질문은 홈페이지에서 회수할 수 없습니다.</p>
      </Row>
      <Row title="4. 개인정보 처리위탁 및 국외 처리">
        <p>서비스 운영에 아래 외부 제공자의 기능을 사용합니다. 실제 위탁 범위·계약 주체·보관 국가·국외이전의 법적 근거 및 상세 고지 항목은 운영진이 이용 중인 계약과 리전을 확인한 결과에 따라 확정해야 합니다.</p>
        <table><thead><tr><th>서비스</th><th>사용 목적</th></tr></thead><tbody>{providers.filter(p=>p[0]!=='Resend'||config?.emailProviderEnabled).filter(p=>p[0]!=='Cloudflare Turnstile'||config?.turnstileEnabled).map(([name,purpose])=><tr key={name}><td>{name}</td><td>{purpose}</td></tr>)}</tbody></table>
        <p><strong>운영진이 확정한 상세 안내:</strong> {config?.processorDetails||'[위탁받는 자, 소재 국가, 개인정보 항목 및 처리 범위·기간·연락처 등 사실관계 확인 후 등록해야 합니다.]'}</p>
      </Row>
      <Row title="5. 파기 절차 및 방법">
        <p>보유 기간 경과·탈퇴·삭제 요청 또는 멘토링 철회로 불필요해진 데이터를 삭제합니다. 멘토링·비회원 문의는 Supabase의 정기 삭제 작업으로 처리하며, 삭제 성공 여부는 개인정보 없는 집계 로그로 확인합니다. 실제 실행 현황은 관리자가 점검합니다. 별도 법령에 따라 보존이 필요한 자료는 접근을 제한하고 분리 관리합니다. 외부 이메일 사본 및 각 외부 서비스 백업·로그는 각 서비스의 별도 정책을 확인해야 합니다.</p>
      </Row>
      <Row title="6. 정보주체의 권리 및 행사 방법">
        <p>본인의 계정 정보 확인, 학회원 명단 공개 동의 변경, 멘토 공개·알림 동의 철회, 본인 게시글 삭제, 멘토링 요청 철회 및 회원 탈퇴를 홈페이지에서 진행할 수 있습니다. 그 밖의 열람·정정·삭제·처리정지 요청은 아래 개인정보 문의처로 연락해 주세요. 신청자 확인 후 처리하며, 법령에 따른 예외가 있는 경우 그 사유를 안내합니다.</p>
      </Row>
      <Row title="7. 안전성 확보 조치와 접속 정보">
        <p>HTTPS 통신, 서버 측 회원·운영진 권한 확인, 데이터베이스 접근 제한, 비공개 글 접근 토큰 및 자동 작성 방지 기능을 적용합니다. 로그인 세션은 브라우저 저장소에 보관되며 로그아웃 및 브라우저 저장소 초기화로 지울 수 있습니다. YouTube 영상을 재생하면 영상 제공자와 통신이 발생할 수 있습니다. 다만 홈페이지 외부 호스팅·인증·자동화 방지 서비스에서 생성되는 접속 로그와 쿠키의 실제 처리 내역은 서비스별 설정을 점검해야 합니다.</p>
      </Row>
      <Row title="8. 개인정보 보호 문의 및 개정 안내">
        <p>개인정보 관련 업무 담당: <strong>{operator}</strong><br/>담당 부서 또는 담당자: <strong>{config?.contactUnit||'[담당 부서·담당자 확인 필요]'}</strong><br/>문의 이메일: <strong>{contact}</strong>{config?.contactPhone&&<><br/>전화번호: <strong>{config.contactPhone}</strong></>}</p>
        <p>처리방침이 변경되는 경우 본 페이지에 시행일과 변경 사항을 표시합니다. 법령 또는 계약상 처리사항에 관한 확정 전 문구는 실제 운영 내용과 일치하도록 수정해야 합니다.</p>
      </Row>
      <p className="privacy-links"><a href="https://www.law.go.kr/" target="_blank" rel="noopener noreferrer">국가법령정보센터 ↗</a>　<a href="https://www.privacy.go.kr/" target="_blank" rel="noopener noreferrer">개인정보 포털 ↗</a></p>
    </div>
  </main>;
}
