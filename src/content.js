/**
 * 이 파일만 수정해도 홈페이지 주요 내용이 바뀝니다.
 * 확인되지 않은 최신 운영정보는 임의로 작성하지 않았습니다.
 * 공개 전 모집 일정 / 연락처 / 공식 SNS / 사진 사용 동의를 확인해 주세요.
 */
export const site = {
  name: 'SWUFORCE',
  koreanName: '서울여자대학교 디지털포렌식 소학회',
  tagline: 'DIG DEEPER. FIND THE TRUTH.',
  yearEstablished: '2020',
  partnerships: ['KUCIS', 'CCA', 'hspace'],
  contact: {
    email: '',         // e.g. 실제 공식 메일 주소
    instagram: 'https://www.instagram.com/swu.f0rc3/',     // e.g. https://www.instagram.com/...
    github: '',        // e.g. https://github.com/...
    notion: 'https://educated-height-aae.notion.site/swuforce',
    tistory: 'https://swfs-swuforensics.tistory.com/',
    facebook: 'https://www.facebook.com/swuforce',
    application: '',   // e.g. 공식 모집 공고 또는 지원서 URL
  },
  recruiting: {
    isOpen: false,
    term: '',          // e.g. '2027학년도 1학기'
    deadline: '',      // e.g. '2027.03.15 23:59'
    description: '새로운 구성원과 함께할 다음 모집 일정은 공식 채널을 통해 안내합니다.',
  },
};

export const focusAreas = [
  {
    id: '01',
    icon: 'hardDrive',
    name: 'Digital Evidence',
    korean: '디지털 증거 분석',
    description: '파일시스템과 운영체제에 남은 흔적을 탐색하고, 분석 과정과 결과를 재현 가능한 형태로 기록합니다.',
    tags: ['File System', 'Artifact', 'Timeline'],
  },
  {
    id: '02',
    icon: 'smartphone',
    name: 'Mobile Forensics',
    korean: '모바일 포렌식',
    description: '모바일 환경의 앱 데이터, 로그, 데이터베이스 등 다양한 아티팩트를 탐구합니다.',
    tags: ['Android', 'App Artifact', 'SQLite'],
  },
  {
    id: '03',
    icon: 'code',
    name: 'Challenge & Research',
    korean: '문제 풀이와 연구',
    description: '실습과 문제 풀이를 통해 분석 역량을 기르고, 발견한 내용을 발표와 프로젝트로 확장합니다.',
    tags: ['DFC / CTF', 'Write-up', 'Research'],
  },
];

// 아래 연혁은 KISIA의 「2023 대학정보보호동아리 성과자료집」에 게재된 과거 기록입니다.
// 최신 연혁이 확보되면 같은 형식으로 추가해 주세요.
export const milestones = [
  {
    year: '2020',
    title: '소학회의 시작',
    text: '디지털포렌식 학습을 함께하는 S.W.F.S.(Seoul Women’s University Forensic Study) 활동 시작',
  },
  {
    year: '2022',
    title: 'SWUFORCE라는 이름으로',
    text: 'S.W.F.S.에서 SWUFORCE로 소학회명 변경 · 정보보호학과 소학회 연합세미나 · CCA 활동',
  },
  {
    year: '2023',
    title: '배움의 범위를 넓히다',
    text: 'KUCIS 활동 · CCA 여름 세미나 발표 · 교내 소학회 연합세미나 개최',
  },
];

export const experiences = [
  {
    type: 'PROJECT',
    year: '2023',
    tag: 'CLOUD FORENSICS',
    title: '클라우드 환경의 사용 및 삭제 행위 추적',
    description: 'Google Drive를 중심으로 업로드·동기화·삭제 흔적을 추적한 연구 프로젝트.',
    footnote: '2023 KUCIS 성과자료집에 소개된 프로젝트',
    visual: 'cloud',
  },
  {
    type: 'SEMINAR',
    year: '2023',
    tag: 'KNOWLEDGE SHARING',
    title: '정보보호학과 소학회 연합세미나',
    description: '서로 다른 보안 분야의 학습 경험과 프로젝트를 나누는 교내 교류 활동.',
    footnote: '2023년 연혁에 기재된 활동',
    visual: 'seminar',
  },
  {
    type: 'PRESENTATION',
    year: '2023',
    tag: 'COMMUNITY',
    title: 'CCA 여름 세미나 발표',
    description: '전국 정보보호 동아리 구성원과 만나 학습 결과를 공유한 외부 발표 활동.',
    footnote: '2023년 연혁에 기재된 활동',
    visual: 'community',
  },
];

export const faqs = [
  {
    question: '디지털포렌식을 처음 공부해도 지원할 수 있나요?',
    answer: '지원 자격과 선발 기준은 학기별 모집 공고에 따라 달라질 수 있습니다. 최신 모집 안내를 확인해 주세요.',
  },
  {
    question: '어떤 활동을 하나요?',
    answer: '디지털포렌식 기초 학습, 문제 풀이, 프로젝트, 세미나 등 다양한 형태의 활동을 소개하고 있습니다. 구체적인 학기별 커리큘럼은 운영진의 공지를 확인해 주세요.',
  },
  {
    question: '모집은 언제 하나요?',
    answer: '현재 확인된 모집 일정은 등록되어 있지 않습니다. 공식 채널이 등록되면 이 페이지에서 확인할 수 있습니다.',
  },
];
