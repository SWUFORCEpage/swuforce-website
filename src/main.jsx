import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, ChevronDown,
  CircleDot, Code2, GitBranch, HardDrive,
  Instagram, Mail, Menu, MoveUpRight, BookOpen, Globe,
  ShieldCheck, Smartphone, X
} from 'lucide-react';
import { site, focusAreas, milestones, experiences, faqs } from './content';
import './styles.css';

const icons = { hardDrive: HardDrive, smartphone: Smartphone, code: Code2 };

function Brand({ inverted = false }) {
  return <a className={`brand ${inverted ? 'brand-inverted' : ''}`} href="#home" aria-label="SWUFORCE 홈으로 이동">
    <img className="brand-logo" src="/swuforce-symbol.png" alt="" />
    <span className="brand-wordmark"><strong>SWUFORCE<span className="brand-period">.</span></strong><small>DIGITAL FORENSICS SOCIETY</small></span>
  </a>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const closeOnEscape = e => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);
  const links = [
    ['#about', '소학회 소개'],
    ['#focus', '활동 분야'],
    ['#work', '프로젝트'],
    ['#history', '연혁'],
  ];
  return <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
    <div className="container header-inner">
      <Brand inverted />
      <nav className={`navigation ${open ? 'navigation-open' : ''}`} id="main-navigation" aria-label="주 메뉴">
        {links.map(([href, text]) => <a key={href} href={href} onClick={() => setOpen(false)}>{text}</a>)}
        <a href="#join" onClick={() => setOpen(false)} className="mobile-join">JOIN US <ArrowUpRight size={15} /></a>
      </nav>
      <a href="#join" className="header-join">JOIN US <ArrowUpRight size={15} strokeWidth={2.5} /></a>
      <button className="menu-button" type="button" aria-label={open ? '메뉴 닫기' : '메뉴 열기'} aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(value => !value)}>{open ? <X size={25} /> : <Menu size={25} />}</button>
    </div>
  </header>;
}

function ForensicVisual() {
  return <div className="forensic-visual" aria-label="디지털 증거 분석을 형상화한 장식 그래픽" role="img">
    <div className="visual-header"><span><span className="live-indicator" /> LIVE ANALYSIS</span><span>CASE // 001-SWF</span></div>
    <div className="scan-window">
      <img className="hero-official-logo" src="/swuforce-symbol.png" alt="SWUFORCE 공식 심볼" />
      <svg className="scan-svg" viewBox="0 0 500 490" aria-hidden="true">
        <defs>
          <linearGradient id="scanStroke" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#52b0fc" /><stop offset="1" stopColor="#a5dbff" /></linearGradient>
          <radialGradient id="scanFill"><stop offset="0" stopColor="#20436a" stopOpacity=".62"/><stop offset="1" stopColor="#0f1b2b" stopOpacity="0"/></radialGradient>
        </defs>
        <circle cx="250" cy="247" r="203" fill="url(#scanFill)" />
        {[82,119,159,200].map((r,i) => <circle cx="250" cy="247" r={r} key={r} fill="none" stroke="#547da0" strokeOpacity={i===3 ? .24 : .17} strokeDasharray={i%2 ? '5 11' : '2 5'} />)}
        <circle cx="250" cy="247" r="161" fill="none" stroke="url(#scanStroke)" strokeOpacity=".52" strokeWidth="1.4" strokeDasharray="95 17 7 50 23 34" className="outer-orbit" />
        <circle cx="250" cy="247" r="121" fill="none" stroke="#8fd1fc" strokeOpacity=".53" strokeWidth="1.3" strokeDasharray="60 17 36 70" className="inner-orbit" />
        <g stroke="#5895c5" strokeOpacity=".33" strokeWidth="1"><path d="M250 46 V447 M49 247 H451 M108 105 L392 389 M392 105 L108 389" /></g>
        <g className="fingerprint-lines" fill="none" stroke="url(#scanStroke)" strokeLinecap="round" strokeOpacity=".93">
          <path d="M186 259c0-47 26-85 65-85 42 0 69 35 69 82 0 31-8 59-24 88" strokeWidth="2.3"/>
          <path d="M199 261c0-43 20-73 52-73 34 0 56 31 56 69 0 32-9 61-23 81" strokeWidth="2.1" />
          <path d="M211 262c0-38 16-62 40-62 26 0 44 25 44 58 0 32-9 61-24 78" strokeWidth="1.9" />
          <path d="M225 266c0-33 10-50 27-50 18 0 30 19 30 45 0 23-6 46-18 65" strokeWidth="2" />
          <path d="M238 263c0-19 5-33 14-33 11 0 17 13 17 32 0 18-4 34-11 46" strokeWidth="1.9" />
          <path d="M177 229c6-40 30-73 60-82 48-14 95 18 109 64" strokeWidth="1.4" strokeOpacity=".6" />
          <path d="M169 246c0-58 36-101 79-102 48-3 95 35 101 91" strokeWidth="1.2" strokeOpacity=".4" />
          <path d="M183 289c7 32 28 55 52 66M199 285c7 25 20 41 36 49M212 285c4 15 12 28 20 35" strokeWidth="1.5" />
        </g>
        <circle cx="250" cy="247" r="6" fill="#99d7ff" className="scan-pulse" />
        <g stroke="#9dd9ff" fill="#9dd9ff"><circle cx="115" cy="160" r="4" /><circle cx="370" cy="158" r="4" /><circle cx="369" cy="351" r="4" /></g>
        <g stroke="#8ed1ff" opacity=".62" fill="none"><path d="M115 160L64 160L64 123M370 158L417 158L417 119M369 351L410 351L410 380" /></g>
      </svg>
      <div className="scan-label label-a"><span>01 / ACQUIRE</span><strong>Evidence</strong></div>
      <div className="scan-label label-b"><span>02 / ANALYZE</span><strong>Artifacts</strong></div>
      <div className="scan-label label-c"><span>03 / VERIFY</span><strong>Findings</strong></div>
      <div className="scan-crosshair crosshair-top"/><div className="scan-crosshair crosshair-bottom"/>
    </div>
    <div className="visual-footer"><span><span className="square-indicator"/> FORENSIC WORKFLOW</span><span className="mono">DATA NEVER LIES_</span></div>
  </div>;
}

function SectionHeading({ num, eyebrow, title, subtitle, light = false }) {
  return <div className={`section-heading ${light ? 'section-heading-light' : ''}`}>
    <div className="eyebrow"><span className="eyebrow-bar" /> {num} / {eyebrow}</div>
    <h2>{title}</h2>
    {subtitle && <p>{subtitle}</p>}
  </div>;
}

function Hero() {
  return <section className="hero" id="home">
    <div className="hero-grid-overlay" aria-hidden="true" />
    <div className="container hero-main">
      <div className="hero-copy">
        <div className="hero-eyebrow"><span className="hero-eyebrow-line"/> SEOUL WOMEN'S UNIVERSITY <span className="hero-eyebrow-divider">/</span> DIGITAL FORENSICS</div>
        <h1>흔적을 읽고,<br/><span>진실을 증명하다.</span></h1>
        <p className="hero-description">디지털 세상에 남겨진 단서를 탐구하는 사람들.<br/>우리는 함께 배우고, 분석하고, 발견한 것을 기록합니다.</p>
        <div className="hero-actions"><a href="#about" className="button button-primary">SWUFORCE 알아보기 <ArrowUpRight size={18} /></a><a href="#work" className="button button-outline">프로젝트 살펴보기 <ArrowRight size={18} /></a></div>
        <div className="hero-small-note"><span className="small-note-icon"><CircleDot size={14} /></span> SINCE 2020 <span className="note-divider"/> FROM CURIOSITY TO EVIDENCE</div>
      </div>
      <ForensicVisual />
    </div>
    <div className="container hero-bottom"><div className="hero-bottom-label">EXPLORE THE EVIDENCE <ArrowDownRight size={16}/></div><div className="hero-bottom-track"><span>STUDY</span><b/> <span>CHALLENGE</span><b/><span>RESEARCH</span><b/><span>COMMUNITY</span></div></div>
  </section>;
}

function About() {
  return <section className="section about-section" id="about">
    <div className="container about-layout">
      <div className="about-title"><SectionHeading num="01" eyebrow="ABOUT US" title={<>우리는<br/>SWUFORCE입니다.</>} /><div className="about-stamp"><span>SWU<span>FORCE</span></span><small>SEOUL WOMEN'S UNIVERSITY</small></div></div>
      <div className="about-body"><span className="overline">WHO WE ARE</span><h3>호기심을 질문으로,<br/>질문을 <em>증거로.</em></h3><p>SWUFORCE는 서울여자대학교 정보보호학과의 디지털포렌식 소학회입니다. 2020년부터 스터디, 대회 참가, 프로젝트를 통해 서로 배우고 경험을 나누고 있습니다.</p><p>기존 S.W.F.S.(Seoul Women’s University Forensic Study)에서 SWUFORCE로 이름을 바꿨습니다. SWU + 포렌식 + 스터디, 그리고 SWU + FORCE라는 의미를 담고 있습니다. KUCIS 소속, CCA 연합, hspace 파트너 소학회로 활동합니다.</p><div className="about-stat-row"><div><strong>2020<span>—</span></strong><small>소학회 출범</small></div><div><strong>SWU<span>+</span></strong><small>FORENSICS + STUDY</small></div></div></div>
    </div>
  </section>;
}

function Focus() {
  return <section className="section focus-section" id="focus"><div className="container"><div className="heading-spread"><SectionHeading num="02" eyebrow="WHAT WE EXPLORE" title={<>다양한 관점으로<br/>흔적을 탐구합니다.</>} subtitle="스터디·대회·프로젝트를 중심으로 디지털포렌식을 함께 탐구합니다." /><div className="section-corner">FOCUS AREAS <span>↗</span></div></div><div className="focus-grid">{focusAreas.map(area => {const Icon = icons[area.icon];return <article className="focus-card" key={area.id}><div className="focus-top"><span>{area.id} / 03</span><Icon size={29} strokeWidth={1.5} /></div><div><div className="focus-en">{area.name}</div><h3>{area.korean}</h3><p>{area.description}</p></div><div className="focus-tags">{area.tags.map(t => <span key={t}>{t}</span>)}</div></article>})}</div><p className="content-note">※ 활동 분야는 홈페이지 구성을 위한 소개 항목이며, 학기별 실제 커리큘럼은 운영진 공지를 따릅니다.</p></div></section>;
}

function ProjectVisual({visual}) {
  if (visual === 'cloud') return <div className="project-graphic project-graphic-cloud" aria-hidden="true"><div className="artifact-browser"><div className="artifact-browser-head"><span/><span/><span/><b>evidence://cloud-activity</b></div><div className="artifact-browser-content"><div className="tree-line tree-1"><GitBranch size={13}/> /GoogleDrive</div><div className="tree-line tree-2"><span className="tiny-folder"/> logs</div><div className="tree-line tree-3"><span className="tiny-file"/> sync_events.db <span className="db-ok">VERIFIED</span></div><div className="tree-line tree-3"><span className="tiny-file"/> activity.log</div><div className="tree-line tree-2"><span className="tiny-folder"/> artifacts</div><div className="tree-line tree-3"><span className="tiny-file"/> deletion_trace</div></div></div><div className="project-graphic-tag">RECOVERED ARTIFACTS <span>↗</span></div></div>;
  if (visual === 'seminar') return <div className="project-graphic project-graphic-seminar" aria-hidden="true"><div className="seminar-orbit orbit-one"/><div className="seminar-orbit orbit-two"/><div className="seminar-orbit orbit-three"/><div className="seminar-center"><span>SWU</span><strong>WITH<span>·</span></strong></div><div className="seminar-mark mark-one">01</div><div className="seminar-mark mark-two">02</div><div className="seminar-mark mark-three">03</div><div className="project-graphic-tag">SHARE · CONNECT · GROW <span>↗</span></div></div>;
  return <div className="project-graphic project-graphic-community" aria-hidden="true"><div className="community-back">CCA</div><div className="community-front"><span>COMMUNITY</span><strong>SHARE<br/>KNOWLEDGE.</strong><div className="community-bottom">2023 <span>↗</span></div></div><div className="project-graphic-tag">BEYOND CAMPUS <span>↗</span></div></div>;
}

function Projects() {
  return <section className="section projects-section" id="work"><div className="container"><div className="heading-spread"><SectionHeading num="03" eyebrow="SELECTED RECORDS" title={<>질문을 넘어,<br/>기록으로 남긴 도전.</>} subtitle="공개 자료로 확인된 2023년의 대표 활동을 소개합니다." /><span className="year-mark">ARCHIVE / 2023</span></div><div className="project-grid">{experiences.map((e, i) => <article className="project-card" key={e.title}><ProjectVisual visual={e.visual}/><div className="project-content"><div className="project-meta"><span>{e.type}</span><span>{e.year}</span></div><div className="project-category">{e.tag}</div><h3>{e.title}</h3><p>{e.description}</p><div className="project-footnote"><ShieldCheck size={15}/>{e.footnote}</div></div></article>)}</div><div className="projects-bottom"><div><span className="tiny-arrow">↗</span><strong>다음 이야기는 우리가 만들어갑니다.</strong><p>새로운 연구와 활동 기록은 확인 후 차례로 추가할 수 있습니다.</p></div><a href="#join" className="text-link">함께할 기회 알아보기 <ArrowUpRight size={18}/></a></div></div></section>;
}

function History() {
  return <section className="section history-section" id="history"><div className="history-noise" aria-hidden="true"/><div className="container history-layout"><div className="history-intro"><SectionHeading num="04" eyebrow="OUR HISTORY" title={<>지금까지의 발자취,<br/><span>그리고 앞으로.</span></>} subtitle="작은 호기심에서 시작한 여정은 함께한 사람들의 기록으로 이어집니다." light /><div className="history-since">SINCE <strong>2020.</strong></div></div><div className="timeline">{milestones.map((m,i) => <div className="timeline-item" key={m.year}><div className="timeline-dot"><span/></div><div className="timeline-year">{m.year}</div><div className="timeline-detail"><h3>{m.title}</h3><p>{m.text}</p></div></div>)}<div className="timeline-item timeline-future"><div className="timeline-dot"><span/></div><div className="timeline-year">NEXT <ArrowUpRight size={17}/></div><div className="timeline-detail"><h3>다음 기록을 향해</h3><p>새로운 활동과 이야기를 함께 만들어갑니다.</p></div></div></div></div></section>;
}

function Faq() {
  const [active, setActive] = useState(null);
  return <section className="section faq-section" id="faq"><div className="container faq-layout"><SectionHeading num="05" eyebrow="FAQ" title={<>자주 묻는<br/>질문들.</>} subtitle="SWUFORCE에 대해 궁금한 점을 확인해 보세요."/><div className="faq-list">{faqs.map((faq,i) => <article className={`faq-item ${active===i ? 'faq-open' : ''}`} key={faq.question}><h3><button type="button" aria-expanded={active===i} aria-controls={`faq-panel-${i}`} onClick={() => setActive(active===i ? null : i)}><span className="faq-no">0{i+1}</span><span>{faq.question}</span><ChevronDown size={19}/></button></h3><div id={`faq-panel-${i}`} className="faq-panel" hidden={active!==i}><p>{faq.answer}</p></div></article>)}</div></div></section>;
}

function Join() {
  const links = [
    site.contact.instagram && { label: 'Instagram', url: site.contact.instagram, icon: Instagram },
    site.contact.github && { label: 'GitHub', url: site.contact.github, icon: GitBranch },
    site.contact.email && { label: 'E-mail', url: `mailto:${site.contact.email}`, icon: Mail },
    site.contact.tistory && { label: 'Tistory', url: site.contact.tistory, icon: BookOpen },
    site.contact.facebook && { label: 'Facebook', url: site.contact.facebook, icon: Globe },
    site.contact.notion && { label: 'Notion', url: site.contact.notion, icon: BookOpen },
  ].filter(Boolean);
  return <section className="join-section" id="join"><div className="container join-inner"><div className="join-decoration" aria-hidden="true"><div className="decor-ring"/><div className="decor-ring"/><div className="decor-ring"/><div className="decor-cross">+</div></div><div className="join-copy"><div className="eyebrow"><span className="eyebrow-bar"/> 06 / JOIN SWUFORCE</div><h2>다음 단서를 찾을<br/><span>당신을 기다립니다.</span></h2><p>{site.recruiting.description}</p><div className="join-availability"><span className={site.recruiting.isOpen ? 'status-open' : 'status-closed'}/><span>{site.recruiting.isOpen ? `${site.recruiting.term || '신입 부원'} 모집 중` : '현재 확인된 모집 공고가 없습니다'}</span></div></div><div className="join-action">{site.recruiting.isOpen && site.contact.application ? <a className="button button-white" href={site.contact.application} target="_blank" rel="noopener noreferrer">지원하기 <ArrowUpRight size={19}/></a> : <a className="button button-white" href="#faq">모집 관련 FAQ 보기 <ArrowUpRight size={19}/></a>}{links.length ? <div className="join-links">{links.map(({label,url,icon:Icon}) => <a href={url} key={label} target={url.startsWith('mailto:') ? undefined : '_blank'} rel={url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}><Icon size={17}/>{label}<ArrowUpRight size={14}/></a>)}</div> : <p className="join-contact-note">공식 연락처 및 SNS는 운영진 확인 후 등록됩니다.</p>}</div></div></section>;
}

function Footer() {
  const now = new Date().getFullYear();
  return <footer className="footer"><div className="container footer-top"><div><Brand inverted/><p>서울여자대학교 디지털포렌식 소학회<br/>Curiosity into Evidence.</p></div><div className="footer-right"><span>EXPLORE</span><a href={site.contact.notion} target="_blank" rel="noopener noreferrer">Official Notion ↗</a><a href="#about">About</a><a href="#focus">What We Explore</a><a href="#work">Selected Records</a><a href="#join">Join Us</a></div></div><div className="container footer-bottom"><span>© {now} SWUFORCE. All rights reserved.</span><span>MADE FOR THOSE WHO LOOK CLOSER. <MoveUpRight size={13}/></span></div></footer>;
}

function App() {
  return <><a className="skip-link" href="#main-content">본문으로 건너뛰기</a><Header/><main id="main-content"><Hero/><About/><Focus/><Projects/><History/><Faq/><Join/></main><Footer/></>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
