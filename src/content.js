/**
 * SWUFORCE public website content.
 * Keep current recruitment and email fields blank until the officers approve them.
 * Historical entries include source/context notes so future officers can revise them.
 */
export const site = {
  name: 'SWUFORCE',
  koreanName: '서울여자대학교 디지털포렌식 소학회',
  tagline: 'DIG DEEPER. FIND THE TRUTH.', // Website creative tagline, not an official motto.
  yearEstablished: '2020',
  partnerships: ['KUCIS', 'CCA', 'hspace'],
  contact: {
    email: '',
    instagram: 'https://www.instagram.com/swu.f0rc3/',
    github: '',
    notion: 'https://educated-height-aae.notion.site/swuforce',
    tistory: 'https://swfs-swuforensics.tistory.com/',
    velog: 'https://velog.io/@swuf0rc3_',
    facebook: 'https://www.facebook.com/swuforce',
    youtube: 'https://www.youtube.com/watch?v=SAcAfqFTG_I&t=15',
    application: '',
  },
  recruiting: {
    isOpen: false,
    term: '',
    deadline: '',
    description: '7.5기 모집이 마감되었습니다. 2027년도 1학기에 예정된 8기 모집에 많은 관심 부탁드립니다.',
  },
};

export const focusAreas = [
  {
    id: '01',
    icon: 'hardDrive',
    name: 'Digital Forensics Basics',
    korean: '디지털포렌식 기초',
    description: '증거 수집·보존과 파일시스템의 기본 개념을 익히고, 다양한 분석 도구와 아티팩트를 학습합니다.',
    tags: ['Evidence', 'File System', 'Artifact'],
  },
  {
    id: '02',
    icon: 'code',
    name: 'Windows Forensics',
    korean: '윈도우 포렌식',
    description: '윈도우 운영체제의 파일·레지스트리·이벤트 로그에 남은 흔적을 분석하는 심화 스터디입니다.',
    tags: ['Registry', 'Event Log', 'Timeline'],
  },
  {
    id: '03',
    icon: 'smartphone',
    name: 'Mobile Forensics',
    korean: '모바일 포렌식',
    description: '스마트폰의 데이터 구조, 앱 데이터베이스와 로그를 탐색하고 분석한 내용을 함께 공유합니다.',
    tags: ['Android', 'SQLite', 'App Artifact'],
  },
];

export const activityItems = [
  {
    label: 'CHALLENGE',
    title: 'CTF · 포렌식 챌린지',
    description: '문제 풀이와 대회 참가로 분석 실습 경험을 쌓고, 풀이 과정과 접근법을 공유합니다.',
    icon: 'trophy',
  },
  {
    label: 'SEMINAR',
    title: '교내·외 연합 행사',
    description: '정보보안 동아리 연합 행사와 세미나를 통해 다른 분야의 연구와 경험을 나눕니다.',
    icon: 'users',
  },
  {
    label: 'COMMUNITY',
    title: '여성 보안인의 밤',
    description: '홈커밍 데이 등 교류 활동을 통해 선후배 및 보안 커뮤니티와의 연결을 이어갑니다.',
    icon: 'sparkles',
  },
];

export const milestones = [
  {
    year: '2020',
    title: '소학회의 시작',
    text: '디지털포렌식에 관심 있는 학우들이 모여 S.W.F.S.라는 이름으로 활동을 시작했습니다.',
  },
  {
    year: '2022',
    title: '함께 배우고 교류하다',
    text: '정보보호학과 소학회 연합세미나와 CCA 교류 등 활동 범위를 넓혔습니다.',
  },
  {
    year: '2023',
    title: '스터디에서 프로젝트까지',
    text: 'KUCIS 활동, CCA 여름 세미나 발표, 교내 소학회 연합세미나 등을 진행했습니다.',
  },
  {
    year: '2025',
    title: '더 넓은 보안 커뮤니티로',
    text: '7월 INCOGNITO 2025에 참가한 이야기를 공식 Velog에 기록했습니다.',
    url: 'https://velog.io/@swuf0rc3_',
  },
  {
    year: '2026',
    title: '연합세미나 참여',
    text: '3월 「Inter Us, Force On」 세미나에 참여한 후기를 공식 Velog에 공유했습니다.',
    url: 'https://velog.io/@swuf0rc3_',
  },
];

export const experiences = [
  {
    type: 'PROJECT',
    year: 'FEATURED',
    tag: 'AI IMAGE FORENSICS',
    title: '생성형 이미지 탐지 및 출처 판별',
    description: 'AI 이미지 탐지와 생성형 이미지의 출처를 판별하는 모델 프로젝트를 진행했습니다.',
    footnote: '활동 소개에 제공된 프로젝트 · 진행 연도 미표기',
    visual: 'ai',
  },
  {
    type: 'PROJECT',
    year: '2023',
    tag: 'CLOUD FORENSICS',
    title: '클라우드 환경의 사용 및 삭제 행위 추적',
    description: 'Google Drive를 중심으로 업로드·동기화·삭제 흔적을 추적한 연구 프로젝트입니다.',
    footnote: '2023년 KUCIS 성과자료집 소개',
    visual: 'cloud',
  },
  {
    type: 'SEMINAR',
    year: '2023',
    tag: 'KNOWLEDGE SHARING',
    title: '정보보호학과 소학회 연합세미나',
    description: '서로 다른 보안 분야의 학습 경험과 프로젝트를 나누는 교내 교류 활동입니다.',
    footnote: '2023년 활동 기록',
    visual: 'seminar',
  },
];

export const resourceLinks = [
  {
    type: 'OFFICIAL BLOG',
    title: 'SWUFORCE Velog',
    description: '소학회 스터디와 행사 후기를 기록하는 공식 기술 블로그입니다.',
    cta: '공식 Velog 방문',
    url: 'https://velog.io/@swuf0rc3_',
    icon: 'book',
  },
  {
    type: 'STUDY NOTE',
    title: '모바일 포렌식 학습 기록',
    description: '모바일 포렌식 학습 내용을 살펴볼 수 있는 외부 블로그 모음입니다.',
    cta: '모바일 포렌식 글 보기',
    url: 'https://hxxxxng.tistory.com/m/category/SWUFORCE/%EB%AA%A8%EB%B0%94%EC%9D%BC%20%ED%8F%AC%EB%A0%8C%EC%8B%9D',
    icon: 'smartphone',
  },
  {
    type: 'STUDY NOTE',
    title: '디지털포렌식 기초 학습 기록',
    description: '디지털포렌식 기초 개념과 학습 과정을 공유한 외부 블로그입니다.',
    cta: '기초 학습 글 보기',
    url: 'https://yujinswork.tistory.com/category/SWUFORCE/%EB%94%94%EC%A7%80%ED%84%B8%ED%8F%AC%EB%A0%8C%EC%8B%9D%20%EA%B8%B0%EC%B4%88?page=2',
    icon: 'hardDrive',
  },
  {
    type: 'VIDEO',
    title: 'SWUFORCE 활동 영상',
    description: '소학회 활동을 영상으로 만나볼 수 있습니다.',
    cta: 'YouTube에서 시청',
    url: 'https://www.youtube.com/watch?v=SAcAfqFTG_I&t=15',
    icon: 'video',
  },
];

export const faqs = [
  {
    question: '디지털포렌식을 처음 공부해도 지원할 수 있나요?',
    answer: '지원 자격과 선발 기준은 학기별 모집 공고에 따라 달라질 수 있습니다. 최신 모집 안내를 확인해 주세요.',
  },
  {
    question: '어떤 스터디와 활동을 하나요?',
    answer: '디지털포렌식 기초·윈도우·모바일 포렌식 스터디를 비롯해 CTF, 세미나, 프로젝트 및 대외 교류 활동을 진행합니다. 학기별 세부 계획은 운영진 공지를 확인해 주세요.',
  },
  {
    question: '모집은 언제 하나요?',
    answer: '7.5기 모집은 마감되었습니다. 2027년도 1학기에 예정된 8기 모집 공지는 공식 Instagram과 홈페이지에서 안내할 예정입니다.',
  },
];
