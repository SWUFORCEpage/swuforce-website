# SWUFORCE Website

서울여자대학교 디지털포렌식 소학회 **SWUFORCE**의 반응형 공식 홈페이지 초안.

> **공개 전 확인:** 2020/2022/2023 연혁은 2023 KUCIS 성과자료집에 공개된 과거 내용에 근거합니다. 2026년 운영진, 모집 일정, 공식 SNS 링크는 공개 Notion에서 확인한 URL을 반영했습니다. 이메일, 모집 일정은 확인되지 않아 임의로 만들지 않았습니다. 실제 배포 전 운영진과 검수해 주세요.

## 주요 기능

- 반응형 랜딩 페이지 (모바일 내비게이션 / 접근성 고려)
- About / 활동 분야 / 대표 활동 / 연혁 / FAQ / 모집 안내
- 순수 프런트엔드 React + Vite, 별도의 DB 및 서버 불필요
- 공유용 OG 이미지 및 favicon
- Render Static Site 설정 파일 (`render.yaml`)
- 연락처와 모집 일정을 설정 파일로 분리 (`src/content.js`)

## 1. 로컬 실행

Node.js 20 이상 권장.

```powershell
npm install
npm run dev
```

표시된 `http://localhost:5173`에 접속합니다.

프로덕션 빌드 확인:

```powershell
npm run build
npm run preview
```

## 2. 내용 수정

`src/content.js`를 열어 아래 항목을 수정합니다.

- `site.contact.email` — 실제 공식 이메일 주소
- `site.contact.instagram` — 실제 공식 인스타그램 URL (공개 Notion에서 확인 완료)
- `site.contact.github` — 실제 공식 GitHub URL
- `site.contact.application` — 실제 지원 폼/공고 링크
- `site.recruiting.isOpen` — 신입 부원 모집 중일 때만 `true`
- `site.recruiting.term` / `deadline` / `description` — 모집 공지 내용
- `focusAreas`, `milestones`, `experiences` — 학기별 확정 활동을 추가하거나 수정
- `faqs` — 확정된 지원 자격/모집 일정이 있다면 기존 안내 교체

**유의:** 모집 여부가 열려 있어도 `application`이 비어 있으면 모집 버튼은 표시되지 않습니다. 새로운 실제 프로젝트나 구성원 사진은 검증/초상권 동의 후에 추가하는 것이 좋습니다.

사이트 대표 색상은 `src/styles.css`에서 수정할 수 있습니다.

## 3. GitHub에 업로드

GitHub에서 `swuforce-website`라는 빈 저장소를 만든 다음 아래 명령어를 프로젝트 폴더에서 실행합니다.

```powershell
git init
git add .
git commit -m "feat: launch SWUFORCE website"
git branch -M main
git remote add origin https://github.com/본인계정/swuforce-website.git
git push -u origin main
```

기존 리포지토리가 있다면 `git remote add` 대신 해당 저장소 주소와 브랜치를 사용하세요.

## 4. Render로 무료 배포

1. [Render Dashboard](https://dashboard.render.com/)에 로그인하고 GitHub를 연결합니다.
2. **New → Static Site**를 선택하고 `swuforce-website` 저장소를 연결합니다.
3. 아래와 같이 설정합니다.

   | 항목 | 입력 |
   | --- | --- |
   | Name | `swuforce-website` (이미 사용 중이면 다른 이름) |
   | Branch | `main` |
   | Build Command | `npm install && npm run build` |
   | Publish Directory | `dist` |

4. **Deploy Static Site**를 선택합니다.
5. 배포 성공 후 Render가 발급하는 `https://<고유이름>.onrender.com` 주소로 접속합니다.
6. 이후 GitHub `main` 브랜치에 `git push`하면 자동으로 새 버전이 배포됩니다.

**대안:** 제공된 `render.yaml`을 사용하려면 Render의 **New → Blueprint**에서 저장소를 연결하면 됩니다. 기존에 수동으로 만든 동일한 서비스와 중복 생성되지 않도록 주의하세요.

## 5. 운영 노트

- 현재 버전은 **정적 홍보 사이트**입니다. 회원 로그인, 관리자 대시보드, 게시물 작성, 부원 개인정보 관리 기능은 포함하지 않습니다.
- 모집 폼은 검증된 공식 링크를 연결할 때에만 표시됩니다. 사용자 데이터를 이 웹사이트 자체에서 수집하지 않습니다.
- 인스타그램/이메일은 실제 정보를 넣어야만 사이트에 나타납니다.
- 2023년 과거 활동 참고: KISIA, 「2023 대학정보보호동아리 성과자료집」, SWUFORCE 소개(pp. 34–35). 발간 당시 정보이므로 현 임원진·운영 방식으로 간주하면 안 됩니다.
- 실제 사진을 추가할 경우 사용·공개 동의 및 저작권을 확인하세요.

## 공개 Notion 반영 (2026-09-23 확인)

- [SWUFORCE 공개용 페이지](https://educated-height-aae.notion.site/swuforce)의 소학회 설명, 명칭 유래, KUCIS/CCA/hspace 관계, 공식 Instagram/Tistory/Facebook 링크를 반영했습니다.
- 공개 페이지 본문은 마지막 편집 표시가 2025-09-06이므로, 2026년 모집 및 운영진 현황을 확정하지 않았습니다.
- Notion에 연결된 활동/외부 활동/부서/2022~2024 활동 내역 하위 페이지는 외부 접근 권한이 없어 상세 내용을 아직 가져오지 못했습니다.
- 사용자가 제공한 로고 이미지는 `public/swuforce-logo-main.png`, 배경제거 심볼은 `public/swuforce-symbol.png` 및 `public/favicon.png`입니다.
