import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight, ChevronDown,
  Code2, GitBranch, HardDrive,
  Instagram, Menu, MoveUpRight, BookOpen,
  ShieldCheck, Smartphone, X, Trophy, UsersRound, Sparkles, Play, NotebookTabs
} from 'lucide-react';
import { site, focusAreas, activityItems, milestones, experiences, resourceLinks, faqs } from './content';
import './styles.css';
import './portal.css';
import './wing-nav.css';
import './site-v2.2.css';
import './site-content.css';
import { PageContent } from './site-content.jsx';
import { PortalProvider, PortalRoutes, useAuth } from './portal.jsx';

const icons = { hardDrive: HardDrive, smartphone: Smartphone, code: Code2 };

function Brand({ inverted = false }) {
  return <a className={`brand ${inverted ? 'brand-inverted' : ''}`} href="/" aria-label="SWUFORCE 홈으로 이동">
    <img className="brand-logo" src="/swuforce-symbol.png" alt="" />
    <span className="brand-wordmark"><strong>SWUFORCE<span className="brand-period">.</span></strong><small>DIGITAL FORENSICS</small></span>
  </a>;
}

function Header() {
  const { session, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = React.useRef(null);
  const closeRef = React.useRef(null);
  const drawerRef = React.useRef(null);
  const path = window.location.pathname;
  const links = [
    { href: '/', label: 'Home', note: '홈' },
    { href: '/about', label: 'About', note: '학회 소개 · 연혁' },
    { href: '/study', label: 'Study', note: '스터디 · 학습 자료' },
    { href: '/news', label: 'News', note: '활동 · 프로젝트' },
    { href: '/board', label: 'Community', note: '공개 · 비공개 문의' },
    { href: '/recruit', label: 'Recruit', note: '신입 모집 안내' },
    { href: session ? '/me' : '/login', label: 'My Page', note: session ? '내 프로필 · 배지' : '로그인 후 이용' },
  ];
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 22);
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = e => {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key !== 'Tab' || !drawerRef.current) return;
      const focusable = [...drawerRef.current.querySelectorAll('a[href],button:not([disabled])')];
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = original; document.removeEventListener('keydown', onKey); toggleRef.current?.focus(); };
  }, [open]);
  return <>
    <header className={`header swu-wing-header ${path !== '/' ? 'portal-header' : ''} ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container header-inner swu-wing-header-inner">
        <Brand inverted/>
        <div className="swu-wing-actions">
          <a className="header-join swu-wing-join" href="/register">JOIN US <ArrowUpRight size={15}/></a>
          <button ref={toggleRef} className="swu-wing-trigger" type="button" aria-label="페이지 메뉴 열기" aria-expanded={open} aria-controls="swu-wing-panel" onClick={() => setOpen(true)}>
            <span>MENU</span><Menu size={22}/>
          </button>
        </div>
      </div>
    </header>
    {open && <div className="swu-wing-layer">
      <button className="swu-wing-backdrop" type="button" aria-label="메뉴 닫기" onClick={() => setOpen(false)}/>
      <nav ref={drawerRef} className="swu-wing-panel" id="swu-wing-panel" aria-label="SWUFORCE 페이지 메뉴">
        <div className="swu-wing-panel-head">
          <div className="swu-wing-panel-brand"><img src="/swuforce-symbol.png" alt=""/><span>SWUFORCE<small>DIGITAL FORENSICS</small></span></div>
          <button ref={closeRef} className="swu-wing-close" type="button" aria-label="메뉴 닫기" onClick={() => setOpen(false)}><X size={20}/></button>
        </div>
        <div className="swu-wing-panel-caption"><span>EXPLORE</span><span>01 / 07</span></div>
        <div className="swu-wing-links">
          {links.map(({href,label,note},i) => {
            const selected = href === '/' ? path === '/' : path === href || (href === '/board' && path.startsWith('/board/')) || (href === '/me' && path === '/login');
            return <a key={href} href={href} className={`swu-wing-link ${selected ? 'is-active' : ''}`} aria-current={selected ? 'page' : undefined} onClick={() => setOpen(false)}>
              <span className="swu-wing-link-index">{String(i+1).padStart(2,'0')}</span>
              <span className="swu-wing-link-text"><strong>{label}</strong><small>{note}</small></span>
              <span className="swu-wing-link-end" aria-hidden="true">↗</span>
            </a>;
          })}
        </div>
        <div className="swu-wing-bottom">
          <a className="swu-wing-bottom-join" href="/register" onClick={() => setOpen(false)}>JOIN US <span aria-hidden="true">↗</span></a>
          {profile?.can_moderate ? <a className="swu-wing-minor" href="/admin">Admin ↗</a> : !session ? <a className="swu-wing-minor" href="/login">Log In ↗</a> : null}
          <span>SWUFORCE · DIGITAL FORENSICS</span>
        </div>
      </nav>
    </div>}
  </>;
}



function SectionHeading({ num, eyebrow, title, subtitle, light = false }) {
  return <div className={`section-heading ${light ? 'section-heading-light' : ''}`}>
    <div className="eyebrow"><span className="eyebrow-bar" /> {num} / {eyebrow}</div>
    <h2>{title}</h2>
    {subtitle && <p>{subtitle}</p>}
  </div>;
}

function AwardVisual({compact = false}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return <div className={`award-visual ${compact ? 'award-visual-compact' : ''}`}>
    {!failed && <img className={`award-real-photo ${loaded ? 'is-loaded' : ''}`} src={site.award.photo} alt="SWUFORCE KUCIS 우수 동아리 선정 사진" loading="lazy" onLoad={() => setLoaded(true)} onError={() => setFailed(true)}/>}
    {(!loaded || failed) && <div className="award-photo-fallback" aria-label="KUCIS 우수 동아리 선정 기록">
      <img src="/swuforce-symbol.png" alt=""/>
      <span>KUCIS · 2025</span>
      <strong>OUTSTANDING<br/>CLUB</strong>
      <small>SWUFORCE</small>
      <p>수상 사진은 공식 원본 확보 후 교체됩니다.</p>
    </div>}
  </div>;
}
function Hero() {
  return <section className="home-hero" aria-labelledby="home-title">
    <div className="container home-hero-grid">
      <div className="home-hero-copy">
        <span className="home-eyebrow">SEOUL WOMEN'S UNIVERSITY <b/> DIGITAL FORENSICS</span>
        <span className="home-overline">WE ARE SWUFORCE.</span>
        <h1 id="home-title">디지털포렌식 학습과<br/><em>연구를 함께합니다.</em></h1>
        <p>SWUFORCE는 서울여자대학교 정보보호학과 디지털포렌식 소학회입니다. 정기 스터디와 프로젝트, 대외 활동을 통해 관련 지식과 경험을 공유합니다.</p>
        <div className="home-hero-actions"><a className="home-primary" href="/about">About SWUFORCE <ArrowUpRight size={17}/></a><a className="home-minor" href="/news">Our News <ArrowUpRight size={16}/></a></div>
        <div className="home-since"><span>SINCE 2020</span><i/><span>STUDY · CHALLENGE · RESEARCH</span></div>
      </div>
      <a className="home-award" href="/news" aria-label="KUCIS 우수 동아리 선정 소식 보러가기">
        <div className="home-award-heading"><span className="home-award-badge">KUCIS</span><span>주요 성과 <ArrowUpRight size={16}/></span></div>
        <AwardVisual/>
        <div className="home-award-caption"><div><span>RECOGNITION</span><strong>KUCIS<br/>우수 동아리 선정</strong></div><ArrowUpRight size={27}/></div>
      </a>
    </div>
    <div className="container home-hero-bottom"><span>SWUFORCE · DIGITAL FORENSICS</span><span>ACTIVITIES · OFFICIAL CHANNELS ↓</span></div>
  </section>;
}
function HomeConnections() {
  const [play, setPlay] = useState(false);
  return <section className="home-connections" aria-labelledby="home-connect-title">
    <div className="container">
      <div className="home-connections-heading"><span>OFFICIAL CHANNELS</span><h2 id="home-connect-title">SWUFORCE 공식 채널</h2><p>스터디·대회·프로젝트 소식과 활동 자료를 공식 채널에서 확인할 수 있습니다.</p></div>
      <div className="home-connect-layout">
        <div className="home-video-card">
          <div className="home-card-top"><span>01 / VIDEO</span><span>ACTIVITY VIDEO</span></div>
          {play ? <iframe title="SWUFORCE 활동 소개 영상" src="https://www.youtube-nocookie.com/embed/SAcAfqFTG_I?start=15&autoplay=1" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/> : <button type="button" className="home-video-cover" onClick={() => setPlay(true)} aria-label="SWUFORCE 소개 영상 재생">
            <img src="https://i.ytimg.com/vi/SAcAfqFTG_I/hqdefault.jpg" alt="SWUFORCE 공식 YouTube 영상 미리보기" loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/>
            <span className="home-video-play"><Play fill="currentColor" size={22}/></span>
          </button>}
          <div className="home-video-meta"><div><strong>SWUFORCE 활동 영상</strong><span>SWUFORCE OFFICIAL VIDEO</span></div><a href={site.contact.youtube} target="_blank" rel="noopener noreferrer">YouTube에서 보기 <ArrowUpRight size={15}/></a></div>
        </div>
        <div className="home-social-stack">
          <a href={site.contact.notion} className="home-social-card home-notion" target="_blank" rel="noopener noreferrer"><div><span>02 / NOTION</span><ArrowUpRight size={18}/></div><strong>학회 소개 및<br/>활동 자료</strong><p>학회 운영 및 활동 기록을 확인하세요.</p><span className="home-social-link">OFFICIAL NOTION ↗</span></a>
          <a href={site.contact.instagram} className="home-social-card home-instagram" target="_blank" rel="noopener noreferrer"><div><span>03 / INSTAGRAM</span><ArrowUpRight size={18}/></div><strong>학회 소식 및<br/>활동 사진</strong><p>최신 소식과 행사 사진을 확인하세요.</p><span className="home-social-link">@SWU.F0RC3 ↗</span></a>
        </div>
      </div>
      <div className="home-bottom-links"><div><span>RELATED PAGES</span><h3>관련 페이지</h3></div><div><a href="/study">Study <ArrowUpRight size={17}/></a><a href="/news">News <ArrowUpRight size={17}/></a><a href="/board">Community <ArrowUpRight size={17}/></a></div></div>
    </div>
  </section>;
}

function About() {
  return <section className="about-modern" aria-labelledby="about-section-title">
    <div className="container">
      <div className="about-modern-head"><span>01 / WHO WE ARE</span><h2 id="about-section-title">SWUFORCE 소개</h2></div>
      <div className="about-modern-grid"><div className="about-modern-main"><span className="about-modern-kicker">SWUFORCE · SINCE 2020</span><p>SWUFORCE는 서울여자대학교 정보보호학과의 디지털포렌식 소학회입니다. 디지털포렌식 기초 및 심화 스터디, 대회 참가, 세미나, 프로젝트와 대외 활동을 운영합니다.</p><p>2020년 S.W.F.S.(Seoul Women's University Forensic Study)로 출발해 2022년 SWUFORCE로 명칭을 변경했습니다. 명칭에는 <strong>SWU + Forensics + Study</strong>와 <strong>SWU + FORCE</strong>의 의미를 담고 있습니다.</p></div>
        <div className="about-modern-aside"><div className="about-modern-aside-top">OUR FOUNDATION <span>2020 —</span></div><div><span>SWU</span><b>+</b><span>FORENSICS</span><b>+</b><span>STUDY</span></div><p>디지털포렌식 교육·연구·교류 활동을 추진합니다.</p></div>
      </div>
      <div className="about-affiliations"><span>ACTIVITIES & NETWORK</span><div>KUCIS <i/> CCA <i/> hspace</div></div>
    </div>
  </section>;
}
function Advisor() {
  return <section className="about-advisor" aria-labelledby="advisor-title"><div className="container advisor-layout"><div><span className="advisor-overline">02 / FACULTY ADVISOR</span><h2 id="advisor-title">지도교수 안내</h2><p>학회 지도와 활동에 관한 정보는 운영진 확인 후 최신 내용을 반영합니다.</p></div><div className="advisor-card"><span>2023 KUCIS ACTIVITY REPORT</span><strong>{site.advisor.name} 교수님</strong><p>{site.advisor.department}</p><small>2023년 공식 성과자료집에 기재된 지도교수 기록입니다. 현재 지도교수 정보는 운영진 확인이 필요합니다.</small><a href={site.advisor.source} target="_blank" rel="noopener noreferrer">기록 출처 확인 <ArrowUpRight size={15}/></a></div></div></section>;
}

function Focus() {
  return <section className="section focus-section" id="focus"><div className="container"><div className="heading-spread"><SectionHeading num="02" eyebrow="STUDY" title={<>디지털포렌식 스터디</>} subtitle="디지털포렌식 기초, 윈도우 포렌식, 모바일 포렌식 분야를 중심으로 학습합니다." /><div className="section-corner">FOCUS AREAS <span>↗</span></div></div><div className="focus-grid">{focusAreas.map(area => {const Icon = icons[area.icon];return <article className="focus-card" key={area.id}><div className="focus-top"><span>{area.id} / {String(focusAreas.length).padStart(2, '0')}</span><Icon size={29} strokeWidth={1.5} /></div><div><div className="focus-en">{area.name}</div><h3>{area.korean}</h3><p>{area.description}</p></div><div className="focus-tags">{area.tags.map(t => <span key={t}>{t}</span>)}</div></article>})}</div><p className="content-note">※ 학기별 세부 커리큘럼과 운영 방식은 모집·활동 공지에 따라 달라질 수 있습니다.</p></div></section>;
}

function Activities() {
  const eventIcons = { trophy: Trophy, users: UsersRound, sparkles: Sparkles };
  return <section className="section activity-section" id="activities"><div className="container">
    <div className="heading-spread"><SectionHeading num="01" eyebrow="BEYOND THE STUDY" title={<>주요 활동 및 대외 성과</>} subtitle="대회 참가, 프로젝트, 세미나 및 교류 활동을 소개합니다."/><div className="section-corner">ACTIVITIES <span>↗</span></div></div>
    <div className="activity-layout"><div className="activity-feature activity-feature-award"><span className="activity-feature-label">2025 · KUCIS</span><AwardVisual compact/><div className="activity-feature-copy"><span>OUTSTANDING CLUB</span><h3>KUCIS<br/>우수 동아리 선정</h3><p>2025년 KUCIS 우수 동아리 선정 이력을 소개합니다. 활동의 다음 기록은 공식 채널에서 확인할 수 있습니다.</p></div><a className="activity-feature-link" href={site.award.source} target="_blank" rel="noopener noreferrer">KUCIS 관련 안내 <ArrowUpRight size={18}/></a></div>
    <div className="activity-list">{activityItems.map((item,i)=>{const Icon=eventIcons[item.icon];return <article className="activity-item" key={item.title}><div className="activity-index">0{i+1}</div><div className="activity-icon"><Icon size={24} strokeWidth={1.6}/></div><div className="activity-item-copy"><span>{item.label}</span><h3>{item.title}</h3><p>{item.description}</p></div></article>})}<a className="activity-instagram" href={site.contact.instagram} target="_blank" rel="noopener noreferrer"><Instagram size={18}/> Instagram에서 더 보기 <ArrowUpRight size={17}/></a></div></div>
  </div></section>;
}

function ProjectVisual({visual}) {
  if (visual === 'ai') return <div className="project-graphic project-graphic-ai" aria-hidden="true"><div className="ai-sample ai-sample-left"><div className="ai-sample-header">SAMPLE_01</div><div className="ai-sample-content"><div className="ai-sample-shape"/></div><div className="ai-sample-bottom">IMAGE ANALYSIS</div></div><div className="ai-compare-line"><span>↔</span></div><div className="ai-sample ai-sample-right"><div className="ai-sample-header">SOURCE_TRACE</div><div className="ai-sample-content ai-sample-content-lines"><span/><span/><span/></div><div className="ai-sample-bottom">PROVENANCE CHECK</div></div><div className="project-graphic-tag">AI IMAGE FORENSICS <span>↗</span></div></div>;
  if (visual === 'cloud') return <div className="project-graphic project-graphic-cloud" aria-hidden="true"><div className="artifact-browser"><div className="artifact-browser-head"><span/><span/><span/><b>evidence://cloud-activity</b></div><div className="artifact-browser-content"><div className="tree-line tree-1"><GitBranch size={13}/> /GoogleDrive</div><div className="tree-line tree-2"><span className="tiny-folder"/> logs</div><div className="tree-line tree-3"><span className="tiny-file"/> sync_events.db <span className="db-ok">VERIFIED</span></div><div className="tree-line tree-3"><span className="tiny-file"/> activity.log</div><div className="tree-line tree-2"><span className="tiny-folder"/> artifacts</div><div className="tree-line tree-3"><span className="tiny-file"/> deletion_trace</div></div></div><div className="project-graphic-tag">RECOVERED ARTIFACTS <span>↗</span></div></div>;
  if (visual === 'seminar') return <div className="project-graphic project-graphic-seminar" aria-hidden="true"><div className="seminar-orbit orbit-one"/><div className="seminar-orbit orbit-two"/><div className="seminar-orbit orbit-three"/><div className="seminar-center"><span>SWU</span><strong>WITH<span>·</span></strong></div><div className="seminar-mark mark-one">01</div><div className="seminar-mark mark-two">02</div><div className="seminar-mark mark-three">03</div><div className="project-graphic-tag">SHARE · CONNECT · GROW <span>↗</span></div></div>;
  return <div className="project-graphic project-graphic-community" aria-hidden="true"><div className="community-back">CCA</div><div className="community-front"><span>COMMUNITY</span><strong>SHARE<br/>KNOWLEDGE.</strong><div className="community-bottom">2023 <span>↗</span></div></div><div className="project-graphic-tag">BEYOND CAMPUS <span>↗</span></div></div>;
}

function Projects() {
  return <section className="section projects-section" id="work"><div className="container"><div className="heading-spread"><SectionHeading num="04" eyebrow="SELECTED RECORDS" title={<>주요 프로젝트 및 발표</>} subtitle="AI 이미지 출처 판별부터 클라우드 포렌식까지, 대표 프로젝트와 발표를 소개합니다." /><span className="year-mark">PROJECTS / HIGHLIGHTS</span></div><div className="project-grid">{experiences.map((e, i) => <article className="project-card" key={e.title}><ProjectVisual visual={e.visual}/><div className="project-content"><div className="project-meta"><span>{e.type}</span><span>{e.year}</span></div><div className="project-category">{e.tag}</div><h3>{e.title}</h3><p>{e.description}</p><div className="project-footnote"><ShieldCheck size={15}/>{e.footnote}</div></div></article>)}</div><div className="projects-bottom"><div><span className="tiny-arrow">↗</span><strong>추가 활동 안내</strong><p>최근 활동과 소식은 News 및 공식 채널에서 확인할 수 있습니다.</p></div><a href="/recruit" className="text-link">모집 안내 보기 <ArrowUpRight size={18}/></a></div></div></section>;
}

function History() {
  return <section className="section history-section" id="history"><div className="history-noise" aria-hidden="true"/><div className="container history-layout"><div className="history-intro"><SectionHeading num="05" eyebrow="OUR HISTORY" title={<>주요 연혁</>} subtitle="SWUFORCE의 주요 활동과 연도별 기록을 소개합니다." light /><div className="history-since">SINCE <strong>2020.</strong></div></div><div className="timeline">{milestones.map((m,i) => <div className="timeline-item" key={m.year}><div className="timeline-dot"><span/></div><div className="timeline-year">{m.year}</div><div className="timeline-detail"><h3>{m.title}</h3><p>{m.text}</p>{m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" className="timeline-source">관련 활동 기록 <ArrowUpRight size={14}/></a>}</div></div>)}<div className="timeline-item timeline-future"><div className="timeline-dot"><span/></div><div className="timeline-year">NEXT <ArrowUpRight size={17}/></div><div className="timeline-detail"><h3>다음 기록을 향해</h3><p>새로운 활동과 이야기를 함께 만들어갑니다.</p></div></div></div></div></section>;
}

function Resources() {
  const archiveIcons = { book: NotebookTabs, smartphone: Smartphone, hardDrive: HardDrive, video: Play };
  return <section className="section resources-section" id="resources"><div className="container"><div className="heading-spread"><SectionHeading num="06" eyebrow="KNOWLEDGE ARCHIVE" title={<>스터디 자료 및 학습 기록</>} subtitle="공식 기술 블로그와 공개 학습 자료, 활동 영상으로 SWUFORCE의 기록을 확인하세요." /><div className="section-corner">OPEN ARCHIVE <span>↗</span></div></div><div className="resources-grid">{resourceLinks.map((item,i) => {const Icon=archiveIcons[item.icon];return <a className="resource-card" key={item.url} href={item.url} target="_blank" rel="noopener noreferrer"><div className="resource-card-top"><span>{String(i+1).padStart(2,'0')} / {item.type}</span><ArrowUpRight size={20}/></div><div className="resource-card-icon"><Icon size={28} strokeWidth={1.5}/></div><h3>{item.title}</h3><p>{item.description}</p><span className="resource-cta">{item.cta}<ArrowUpRight size={15}/></span></a>})}</div></div></section>;
}

function Faq() {
  const [active, setActive] = useState(null);
  return <section className="section faq-section" id="faq"><div className="container faq-layout"><SectionHeading num="07" eyebrow="FAQ" title={<>자주 묻는<br/>질문들.</>} subtitle="SWUFORCE에 대해 궁금한 점을 확인해 보세요."/><div className="faq-list">{faqs.map((faq,i) => <article className={`faq-item ${active===i ? 'faq-open' : ''}`} key={faq.question}><h3><button type="button" aria-expanded={active===i} aria-controls={`faq-panel-${i}`} onClick={() => setActive(active===i ? null : i)}><span className="faq-no">0{i+1}</span><span>{faq.question}</span><ChevronDown size={19}/></button></h3><div id={`faq-panel-${i}`} className="faq-panel" hidden={active!==i}><p>{faq.answer}</p></div></article>)}</div></div></section>;
}



function Footer() {
  const year = new Date().getFullYear();
  return <footer className="footer swu-compact-footer"><div className="container footer-top"><div><Brand inverted/><p>서울여자대학교 정보보호학과 · 디지털포렌식 소학회</p></div><div className="footer-right"><span>EXPLORE</span><a href="/about">About</a><a href="/study">Study</a><a href="/news">News</a><a href="/board">Community</a><a href="/recruit">Recruit</a><a href="/me">My Page</a><a href="/register">Join Us</a><a href={site.contact.notion} target="_blank" rel="noopener noreferrer">Notion ↗</a><a href={site.contact.instagram} target="_blank" rel="noopener noreferrer">Instagram ↗</a></div></div><div className="container footer-bottom"><span>© {year} SWUFORCE. All rights reserved.</span><span>SWUFORCE · DIGITAL FORENSICS</span></div></footer>;
}

function SubpageIntro({ index, name, description, detail }) {
  return <section className="swu-subpage-intro" aria-labelledby="subpage-title"><div className="container swu-subpage-intro-inner">
    <div><div className="swu-subpage-overline"><span className="live-indicator"/> SWUFORCE / {index}</div><h1 id="subpage-title">{name}<span>.</span></h1><p>{description}</p><span className="swu-subpage-detail">{detail}</span></div>
    <div className="swu-subpage-mark" aria-hidden="true"><img src="/swuforce-symbol.png" alt=""/><span>LOOK CLOSER.</span></div>
  </div></section>;
}
function AboutPage() {
  return <main id="main-content" className="swu-subpage"><SubpageIntro index="01" name="About" description="SWUFORCE의 시작부터 오늘까지." detail="ABOUT / FACULTY / HISTORY"/><About/><PageContent page="about" title="학회 안내"/><Advisor/><History/>
    <section className="swu-subpage-cta"><div className="container"><div><span>OUR PEOPLE</span><h2>학회원 명단</h2><p>공개에 동의한 학회원들의 기수와 배지를 확인할 수 있습니다.</p></div><a href="/members">Members <ArrowUpRight size={18}/></a></div></section><Faq/></main>;
}

function StudyPage() {
  return <main id="main-content" className="swu-subpage"><SubpageIntro index="02" name="Study" description="디지털포렌식 기초 및 심화 스터디 안내" detail="BASICS / WINDOWS / MOBILE"/><Focus/><PageContent page="study" title="스터디 안내"/><Resources/>
    <section className="swu-subpage-cta"><div className="container"><div><span>KEEP LEARNING</span><h2>스터디 소식이 궁금하다면</h2><p>새로운 학습 소식은 공식 채널을 통해 공유합니다.</p></div><a href={site.contact.velog} target="_blank" rel="noopener noreferrer">Velog <ArrowUpRight size={19}/></a></div></section></main>;
}
function NewsPage() {
  return <main id="main-content" className="swu-subpage"><SubpageIntro index="03" name="News" description="학회 활동, 주요 성과 및 프로젝트 소개" detail="RECOGNITION / ACTIVITIES / PROJECTS"/><PageContent page="news" title="최근 소식"/><Activities/><Projects/></main>;
}
function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const pages = { '/about': <AboutPage/>, '/study': <StudyPage/>, '/news': <NewsPage/> };
  return <PortalProvider><a className="skip-link" href="#main-content">본문으로 건너뛰기</a><Header/>{path === '/' ? <main id="main-content" className="swu-home"><Hero/><PageContent page="home" title="추가 공지"/><HomeConnections/></main> : (pages[path] || <PortalRoutes/>)}<Footer/></PortalProvider>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
