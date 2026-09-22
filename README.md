# SWUFORCE v2.0 — 학회원 포털 · 공개/비공개 게시판 · 운영진 관리

서울여자대학교 디지털포렌식 소학회 SWUFORCE의 공식 소개 홈페이지(v1.1)를 유지하면서 학회원 포털을 추가한 **Render Web Service**용 프로젝트입니다. 사용자가 제공한 공식 로고를 그대로 사용합니다. 실제 학회원 및 역대 회장·부회장 정보는 임의로 만들어 넣지 않았으며, 관리자가 가입을 승인하고 본인 공개 동의를 확인한 경우에만 공개됩니다.

## 새로 추가된 페이지

| 경로 | 기능 |
| --- | --- |
| `/register`, `/login` | 최소 정보(이메일, 표시 이름, 활동 기수, 현재/졸업 신청 상태)로 가입 신청·로그인 |
| `/me` | 확인된 기수·활동 상태·회장/부회장 배지 및 공개 명단 동의 |
| `/members` | 승인 + 공개 동의한 활동/졸업 학회원 명단 |
| `/officers` | 승인 + 공개 동의 후 게시된 역대 회장·부회장단 이력 |
| `/board` | 누구나 읽을 수 있는 공개 문의 목록, 로그인 사용자는 자신이 쓴 비공개 글도 조회 |
| `/board/new` | 회원/비회원 공개 또는 비공개 문의 작성 |
| `/board/:id` | 문의 본문·운영진 답변; 비공개 글은 작성자/현재 운영진만 접근 |
| `/recruit` | 7.5기 모집 마감 / 2027년 1학기 8기 모집 예정 공지 |
| `/admin` | 현 운영진의 게시글 관리 및 답변; 사이트 관리자의 회원 승인/상태 변경·운영진 이력 관리 |

### 권한 정책

- **방문자**: 공식 소개·모집 안내·공개에 동의한 명단 확인, 공개 글 열람, 비회원 글쓰기(프로덕션에서는 Turnstile 설정 후 활성화).
- **가입 신청자**: 이메일 확인 후 로그인, 회원 정보를 등록할 수 있으나 공식 배지는 운영진 승인 전에는 보이지 않음.
- **승인된 학회원**: `7기` / `7.5기` 등의 기수 + `활동 학회원` / `졸업 학회원` 배지. 선택 시 공개 명단 등재.
- **현 운영진**: 위 기능 + 모든 비공개 글 열람, **게시글 숨김/복원**, **공식 답변 작성**.
- **사이트 관리자**: 현 운영진 업무 + 가입 승인, 회원 활동 상태 변경, 현 운영진 지정/해제, 과거 회장·부회장 이력 기록/공개. 사이트 관리자가 현재 운영진이 아니면 **답변 작성 불가**.
- **회장/부회장 배지**: 직책을 직접 가입자가 입력하지 못하며, 사이트 관리자가 `officer_terms`에 기간을 등록하고 해당 회원의 공개 동의를 확인해야 외부에 표시됨. 재임 종료일 기준으로 `현 회장`, `전 부회장` 등이 자동 계산됨.

## 선택한 기술 구성

```text
브라우저 (React + Vite)
    │
    ├── 인증: Supabase Auth (이메일/비밀번호 및 이메일 확인)
    └── 동일 출처 HTTPS /api/* (Bearer access token)
             │
        Render Web Service (Node.js + Express)
             │ 권한을 매 요청 검사
        Supabase Postgres (회원/임기/게시글/답변)
```

**중요:** Render 무료 Web Service의 파일 시스템은 재배포·재시작·유휴 정지 시 초기화됩니다. 따라서 SQLite 파일이나 업로드 파일을 Render 로컬에 저장하지 않고 외부 Supabase DB를 사용합니다. 새 버전부터 기존의 `serve -s dist` 명령이 아닌 Node API 서버를 실행해야 합니다.

## 설치 전 준비할 것

1. Node.js 20 이상
2. 기존 GitHub 저장소와 Render **Web Service** (기존 서비스를 그대로 사용 가능)
3. 새 [Supabase](https://supabase.com/dashboard) 프로젝트 1개
4. 공개 비회원 게시판을 열 때는 [Cloudflare Turnstile](https://dash.cloudflare.com/) 위젯의 사이트 키/비밀 키 1쌍
5. 사이트 관리자 1명(처음 1회 SQL Editor에서 직접 권한 부여)

### 1. Supabase 데이터베이스 만들기

1. Supabase에서 프로젝트 생성 후 **SQL Editor → New query**를 열고 `supabase/schema.sql` 파일의 전체 내용을 실행합니다.
2. **Project Settings → API Keys**(또는 Connect)에 표시되는 다음 세 값을 확인합니다.
   - `Project URL` → `SUPABASE_URL`
   - `Publishable key` (`sb_publishable_...`) → `SUPABASE_PUBLISHABLE_KEY`
   - `Secret key` (`sb_secret_...`) → `SUPABASE_SECRET_KEY`
3. **Authentication → Providers → Email**에서 이메일 인증(Confirm Email)을 활성화해 두는 것이 좋습니다.
4. **Authentication → URL Configuration**에서 Site URL을 `https://실제-서비스주소.onrender.com`으로, Redirect URLs에 다음을 등록합니다.
   - `https://실제-서비스주소.onrender.com/login`
   - `https://실제-서비스주소.onrender.com/reset-password`
   - 로컬 테스트 시 `http://localhost:5173/login`, `http://localhost:5173/reset-password`
5. 새 프로젝트의 이메일 발송량 제한에 주의합니다. 실제 대규모 운영 시 도메인 및 SMTP 설정을 별도 검토하세요.

`SUPABASE_SECRET_KEY`는 비밀번호만큼 중요한 서버 전용 비밀입니다. **절대로 GitHub, 프런트엔드 코드, VITE_ 환경 변수 또는 학회원에게 공유하지 마세요.** Publishable key는 공개 가능하지만 데이터 API 직접 접근은 SQL에서 차단되어 있습니다.

### 2. 비회원 게시판을 열 때 Turnstile 설정

1. Cloudflare Turnstile에서 사이트를 만들고 로컬 및 Render 서비스 도메인을 허용합니다.
2. 사이트 키는 `TURNSTILE_SITE_KEY`, 비밀 키는 `TURNSTILE_SECRET_KEY`에 입력합니다.
3. 운영 환경에서는 **두 키가 모두 설정된 경우에만 비회원 글쓰기**가 열립니다. 둘 중 하나만 입력하면 서버가 시작하지 않습니다.
4. Turnstile 토큰은 Express 서버가 Cloudflare의 Siteverify API로 검증하며, 추가적으로 비회원 작성 요청에 IP당 시간당 5회 제한이 있습니다.
5. 로컬 개발(`NODE_ENV`가 production 아님)에서는 Turnstile 없이도 게스트 글을 시험할 수 있습니다. 실서비스에 게스트 글쓰기를 열 때는 반드시 두 키를 설정하세요.

### 3. Windows CMD에서 새 버전 적용하기

현재 프로젝트가 `F:\swuforce-website`이고 이 경로가 이미 Git 저장소라면 **Git 초기화를 다시 하지 마세요.** 기존 작업 내용을 백업/커밋한 뒤, 제공한 ZIP의 *내용물*을 `F:\swuforce-website`에 덮어씁니다. `.git` 폴더와 개인 `.env` 파일은 지우지 않습니다.

```cmd
cd /d F:\swuforce-website

git status
npm install
npm run build
npm test

git add .
git commit -m "feat: add member portal, private board and officer admin"
git push origin main
```

만약 `git status`에 커밋하지 않은 기존 변경 내용이 보인다면 덮어쓰기 전에 현재 수정본을 먼저 백업 또는 커밋해 두세요. 위 ZIP에는 `node_modules`, `dist`, `.env`, `.git`이 없습니다. 새 의존성(`express`, `@supabase/supabase-js` 등)은 `npm install`에서 설치됩니다. 생성된 `package-lock.json`도 같이 커밋해 주세요.

### 4. Render의 **기존 Web Service** 설정 변경

Render Dashboard에서 기존 `swuforce-website` Web Service를 선택하세요. 새 Web Service를 중복 생성할 필요가 없습니다.

| 항목 | 설정 |
| --- | --- |
| Language | Node |
| Branch | `main` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Root Directory | `package.json`이 저장소 최상위에 있으면 비워두기 |

**Environment**에서 다음 값을 새로 등록하고 저장하세요.

| Key | 설명 | 브라우저 노출 |
| --- | --- | --- |
| `SUPABASE_URL` | Supabase 프로젝트 URL | URL만 공개 |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key | 공개 가능 |
| `SUPABASE_SECRET_KEY` | Supabase secret key | **비공개 서버 전용** |
| `TURNSTILE_SITE_KEY` | Cloudflare 공개 사이트 키(게스트 글쓰기용) | 공개 가능 |
| `TURNSTILE_SECRET_KEY` | Cloudflare 비밀 키(게스트 글쓰기용) | **비공개 서버 전용** |

`PORT`는 Render가 제공하며 수동 등록이 필요 없습니다. `NODE_ENV=production`이 없으면 Render에서 설정해 주세요. 처음 3개 Supabase 값은 **필수**, Turnstile은 비회원 글쓰기를 열 때 함께 설정하세요. Render의 Auto-Deploy를 사용한다면 **환경 변수와 Start Command를 먼저 준비한 뒤 푸시**하는 편이 편리합니다.

### 5. 최초 사이트 관리자 지정

1. Render에 배포된 홈페이지의 `/register`에서 공식 관리자용 계정으로 가입합니다.
2. 메일 인증을 완료합니다.
3. Supabase **SQL Editor**에서 다음 SQL을 한 번만 실행합니다. `OFFICIAL_ADMIN_EMAIL`을 관리자 계정의 이메일로 바꿉니다.

```sql
update public.profiles
set membership_status = 'active',
    is_verified = true,
    site_admin = true,
    current_executive = true
where id = (select id from auth.users where email = 'OFFICIAL_ADMIN_EMAIL');
```

4. `/login` → `/me` → `/admin` 순서로 이동합니다.
5. 다른 학회원이 가입하면 관리자 페이지에서 가입 신청 기수/상태를 확인하고 `승인 완료` + `활동 학회원/졸업 학회원`을 설정합니다. 현재 운영진에게는 `현재 운영진`도 체크합니다.
6. 과거 회장/부회장 이력은 운영진 메뉴에서 승인된 회원을 선택하고, 직책 및 기간을 입력한 뒤 당사자 공개 동의를 확인하고 공개합니다.

**사칭 방지:** 신규 가입자가 신청한 기수와 활동 상태는 미검증입니다. 가입 즉시 공식 배지나 운영진 권한을 받을 수 없습니다. 관리자 권한을 본인이 획득할 수 있는 회원용 API도 없습니다.

### 6. 기능 점검 체크리스트

- [ ] `/api/health`에서 `{"ok":true}` 응답
- [ ] `/register`에서 가입 후 확인 메일 수신, `/login` 로그인
- [ ] 승인 대기 중인 계정에 공식 배지와 관리 버튼 없음
- [ ] 관리자 승인 후 `/me`에 기수 및 활동 상태 배지 표시
- [ ] 본인이 공개 동의를 켜야 `/members`에 등재
- [ ] 운영진 이력 등록 + 공개 동의 후 `/officers` 표시, 임기 종료 시 `전 회장/전 부회장`으로 표시
- [ ] 비회원 공개·비공개 글 작성; 비공개 글은 발급된 **비밀 링크**를 보관
- [ ] 비회원이 다른 사람의 비공개 글 URL만 알아도 내용을 볼 수 없음
- [ ] 현재 운영진만 비공개 글 관리/답변 가능, 일반 학회원 답변 요청은 403
- [ ] 운영진에서 해제한 계정은 답변·관리 기능을 즉시 잃음
- [ ] Render 재배포/유휴 정지 후에도 Supabase 데이터 유지

### 개발용 로컬 서버

`F:\swuforce-website\.env`에 세 가지 필수 Supabase 환경 변수를 입력할 경우 Node가 **자동으로 .env를 읽지 않으므로** 로컬에서는 `node --env-file=.env server/index.js`로 실행하세요.

첫 CMD:

```cmd
cd /d F:\swuforce-website
node --env-file=.env server/index.js
```

둘째 CMD:

```cmd
cd /d F:\swuforce-website
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속하면 Vite가 `/api` 요청을 Node(10000 포트)에 프록시합니다.

### 개인정보 및 운영 주의 사항

- **수집하는 회원 정보:** 이메일(로그인/복구), Supabase가 관리하는 비밀번호, 표시 이름, 신청 기수·활동 상태. 전화번호·학번·생년월일·주소는 수집하지 않습니다.
- **공개되는 회원 정보:** 운영진이 승인했고 본인이 명단 공개에 동의한 경우에만 표시 이름, 기수, 승인된 활동 상태·직책 배지가 공개됩니다.
- **게시글:** 공개 문의에는 타인이 볼 수 있는 개인정보를 적지 않도록 안내합니다. 비공개 문의는 작성자/현 운영진 및 사이트 관리자만 볼 수 있으며, 비회원의 비밀 링크를 잃으면 복구할 수 없습니다.
- **게시글 관리:** 운영진은 부적절한 글을 숨김 처리할 수 있고, 숨겨진 글은 원 작성자라도 조회할 수 없습니다.
- **공식 개인정보처리방침:** 개인정보 처리 주체·연락처, 보유/파기 기준, 정보주체 권리 행사 방법 등을 운영진이 확정한 뒤 **회원가입/게시판을 대외 공개하기 전** 사이트에 실제 내용을 게시하세요. 이 프로젝트의 짧은 가입 동의 문구만으로 모든 고지·운영 의무가 충족된다고 간주하면 안 됩니다.
- **탈퇴·삭제:** 현 버전에는 셀프 탈퇴 UI가 없습니다. 관리자와 함께 탈퇴·게시글 삭제 처리 흐름을 추가하기 전에는 운영진 공식 연락 채널 및 처리 절차를 확정하세요.
- **운영 기록:** 운영진 변경·회원 승인 이력 로그, 백업 및 게시글 신고 기능 등은 추후 추가를 권장합니다.
- **제약:** 브라우저 실제 기능 테스트와 Supabase 실연동은 본인 프로젝트의 키/DB가 있어야 완료할 수 있습니다. 제공한 Node 권한 단위 테스트와 정적 구문 검사는 프로젝트 파일에 포함되어 있습니다.

## 파일 구조

```text
src/main.jsx           기존 소개 홈페이지 + 전체 메뉴
src/portal.jsx         회원·게시판·모집·관리자 페이지
src/styles.css         기존 홈페이지 스타일
src/portal.css         신규 페이지 스타일
src/content.js         기존 공개 소개 및 모집 문구
server/index.js        Render Web Service API·권한 검사·보안 헤더
server/permissions.js  회원·운영진/게시글 접근 권한 규칙
supabase/schema.sql    DB 테이블·Auth 가입 트리거·RLS 설정
render.yaml            Node Web Service Blueprint 설정
.env.example           필수/선택 환경 변수 예시
```
