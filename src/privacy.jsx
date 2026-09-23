import React, { useEffect, useState } from 'react';
import './privacy.css';

export const PRIVACY_NOTICE_VERSION = '2026-09-23-v3';

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
      <Row title="4. 외부 서비스 이용 및 개인정보 처리 현황">
        <p>홈페이지 운영에 사용하는 외부 서비스의 역할과 처리 범위를 구분하여 안내합니다. 아래의 서비스별 일반적인 처리 조건은 해당 제공자의 공개 문서에 따른 것이며, SWUFORCE 계정에 적용되는 계약과 실제 국외 이전 범위가 확인되었다는 의미는 아닙니다.</p>
        <table><thead><tr><th>외부 서비스</th><th>서비스 이용 목적 및 처리 역할</th></tr></thead><tbody>
          <tr><td>Supabase</td><td>회원 인증·이메일 확인, 학회원 정보 및 게시판·멘토링 데이터 저장. 프로젝트의 주 데이터 저장 지역은 선택한 리전에 따릅니다. 운영 로그·지원 업무 등 일부 처리는 다른 지역에서 이루어질 수 있으므로 적용 계약과 계정 설정을 별도로 확인합니다.</td></tr>
          <tr><td>Render Services, Inc.</td><td>홈페이지와 API 서버 운영. 현재 홈페이지의 정적 파일은 별도 Static Site가 아니라 API Web Service에서 제공합니다. API의 실제 배포 지역, 접속 로그, 하위처리업체의 처리 범위는 운영 환경과 계약을 확인합니다.</td></tr>
          {config?.turnstileEnabled&&<tr><td>Cloudflare Turnstile</td><td>비회원 문의의 자동 작성 및 악성 봇 방지. 웹사이트 보호에 필요한 신호를 SWUFORCE의 지시에 따라 처리하는 수탁자 역할과, Turnstile의 봇 탐지 성능 개선을 위하여 해당 신호를 자체적으로 처리하는 독립적인 개인정보처리자 역할을 구분합니다.</td></tr>}
          {config?.emailProviderEnabled&&<tr><td>Resend</td><td>멘토링 이메일 알림 발송. 실제 계약 주체, 발송 내용, 수신자 정보, 처리 국가 및 보유기간은 서비스 설정과 계약에 따라 확인합니다.</td></tr>}
        </tbody></table>
        {config?.turnstileEnabled&&<div className="privacy-service-note">
          <h3>Cloudflare Turnstile에서 처리할 수 있는 정보</h3>
          <p>방문자 IP 주소, TLS 지문, User-Agent, Sitekey와 웹사이트 출처 정보 등 보안 검증에 필요한 신호가 포함됩니다. Cloudflare의 일반 개인정보 처리방침은 정보를 주로 미국과 유럽경제지역에 저장하며 글로벌 운영 과정에서 다른 국가로 이전하거나 접근할 수 있다고 설명합니다. 이는 SWUFORCE의 Turnstile 신호가 해당 모든 국가에서 처리된다는 의미는 아닙니다.</p>
          <p><a href="https://www.cloudflare.com/turnstile-privacy-policy/" target="_blank" rel="noopener noreferrer">Turnstile 전용 개인정보 안내 ↗</a> · <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">Cloudflare 개인정보 처리방침 ↗</a> (독립적 처리에 관한 문의: dpo@cloudflare.com)</p>
        </div>}
        <div className="privacy-service-note">
          <h3>개인정보 국외 이전 안내</h3>
          <p>개인정보 보호법 제28조의8에 따라 해당되는 국외 처리위탁·보관의 법적 근거와 이전 항목, 국가·시기·방법, 수령자 명칭·연락처, 이용 목적·보유기간, 거부 방법·절차·효과를 확인하여 공개합니다. 이용 중인 업체의 일반적인 해외 소재 국가 목록을 실제 이전 대상 국가로 단정하지 않습니다.</p>
          <p>국외 이전을 포함한 개인정보 처리에 관한 문의 및 권리 행사는 아래 SWUFORCE 개인정보 문의처로 요청할 수 있습니다. 서비스 이용 제한을 비롯한 구체적인 거부 효과는 실제 처리 방식과 적용 가능한 법적 근거를 확인한 뒤 안내합니다.</p>
          <p><a href="https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029331979" target="_blank" rel="noopener noreferrer">개인정보 보호법 제28조의8 ↗</a> · <a href="https://supabase.com/docs/guides/platform/regions" target="_blank" rel="noopener noreferrer">Supabase 리전 안내 ↗</a> · <a href="https://render.com/docs/regions" target="_blank" rel="noopener noreferrer">Render 리전 안내 ↗</a></p>
        </div>
        <div className="privacy-service-detail">
          <h3>{config?.published?'운영진 검토·확정 외부 서비스 처리 현황':'운영진 검토 중인 외부 서비스 처리 현황'}</h3>
          <p>아래 내용은 SWUFORCE가 운영 설정에 입력한 정보입니다. 미확정 사항이 포함된 경우 최종 개인정보처리방침으로 확정된 것이 아닙니다.</p>
          <div className="privacy-provider-text">{config?.processorDetails||'외부 서비스별 계약 주체, 이전 항목·국가·시기·방법, 수령자 연락처, 이용 목적·보유기간 및 거부 방법을 확인한 후 공개합니다.'}</div>
        </div>
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
