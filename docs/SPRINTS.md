# Sprints

각 Sprint는 앞 Sprint의 승인 후에만 시작한다.

## Sprint 0 — Foundation ✅

프로젝트 기반 + 디자인 시스템 + 반응형 Shell + PWA 기본 구조.

- [x] Next.js App Router + TypeScript strict 정상화 (`install` / `build` / `dev`)
- [x] Design Token (color / radius / spacing / typography)
- [x] Responsive App Shell (Mobile Bottom Nav, Desktop Sidebar, optional Context Panel)
- [x] Home 화면 (닉네임 placeholder, 상태 카드 6종, 단일 선택, [다음] 활성/비활성)
- [x] `lib/platform.ts` capability detection
- [x] PWA manifest 연결 (placeholder icon)
- [x] 접근성 기본 (semantic button, focus visible, 색 외 단서, AA 대비)

범위 밖(의도적으로 미구현): Supabase, Auth, DB, AI API, Web Push 발송,
Service Worker, Geolocation 권한 요청, 지도/장소 API, Premium/결제, 관리자 페이지,
실제 Post 저장.

## Sprint 0.1 — Repository & Source-of-Truth Correction ✅

- [x] 쉼 Community를 `musi0905-cloud/App`(Apps Script)과 분리된 독립 project root로 이전
- [x] 기존 Apps Script 5개 파일 무변경 확인 (blob hash 동일)
- [x] `prototype.html` → `prototype.sprint0-reference.html` 로 이름 변경 + 비공식 표기
- [x] `docs/SOURCE-OF-TRUTH.md` 신설, `docs/PRODUCT.md` 동기화
- [x] Bottom Navigation label 11px → 12px (padding/gap 조정으로 375px 수용)
- [x] `env(safe-area-inset-bottom)` 실제 반영 검증

- [x] `musi0905-cloud/shim-community` 정식 저장소로 이전 (main)
- [x] `docs/PRODUCT.md`를 쉼 Community 전용 Product Definition으로 재작성
- [x] PO-001 / PO-002 / PO-003 확정 기록

**미확정 제품 쟁점 0건.** PO-001(독립 제품) / PO-002(Community 예외 + 영구 금지목록) /
PO-003(Rest Plan + 3영역 렌더링)으로 모두 해소되었다. 상세는 `docs/SOURCE-OF-TRUTH.md`.

## Sprint 1 — Auth & 지속 익명 정체성 ✅ (완료)

- [x] Supabase Auth (Email Magic Link) + `@supabase/ssr` 구조
- [x] `profiles` 마이그레이션 + RLS 정책 4종 + updated_at 트리거
- [x] auth-aware `/`, `/auth`, `/auth/confirm`, `/onboarding/nickname`, `/settings`
- [x] 닉네임 검증(2~16자, 금칙어, 보이지 않는 문자) — 중복은 허용
- [x] 로그아웃, 라우트 가드, 탭 간 세션 동기화
- [x] **실제 Supabase 프로젝트 연결 + E2E 검증** — Sprint 2 의 Release
      Status(아래)에서 실제 로그인 계정으로 완료

설정 절차는 `docs/ARCHITECTURE.md` 「Supabase 설정 절차」 참고.

## Sprint 1.2 — Vercel 배포 + Supabase Production E2E (완료)

- [x] Vercel 배포 적합성 점검 (zero-config, proxy.ts, 환경변수 사용 방식)
- [x] Production 환경에서 매직 링크 주소를 잘못 잡던 origin fallback 수정
- [x] `docs/RUNBOOK-vercel-deploy.md` — 배포·대시보드 설정·E2E 절차
- [x] **Vercel 배포 및 실사용 E2E** — 이 항목이 쓰인 시점(매직 링크 시대)의
      인증 방식은 Sprint 2 에서 이메일+비밀번호로 바뀌었다. 실사용 E2E 는
      Sprint 2 의 Release Status(아래)에서 실제로 완주했다 — 이 체크박스는
      그걸로 흡수됐다.

## Sprint 2 — Complete MVP Activation (완료 — Production 검증 통과, Release: GO)

- [x] Auth 를 이메일+비밀번호로 전환 (최초 1회 이메일 인증)
- [x] 기존 매직링크 사용자 호환 — Settings 에서 비밀번호 설정, 재설정 메일 fallback
- [x] Home 상태 선택 → `/write` 실제 이동
- [x] Write → `posts` 실제 저장 (1~200자, 서버 검증, DB constraint)
- [x] Safety 3단계 분류 + 고위험 안내 화면
- [x] Rest Plan 저장 + 3영역 렌더링, 제공자 인터페이스 분리
- [x] 짧은 쉼 3/5/10분, `ends_at` 기준 타이머
- [x] Community Feed (approved 만, pagination, Infinite Scroll 없음)
- [x] Reactions 3종 toggle
- [x] 내 쉼 7일 기록 + 요약
- [x] Settings 닉네임 변경 / 비밀번호 설정 / 로그아웃
- [x] 네비게이션 5개 전부 실제 route (dead link 0)
- [x] **Production E2E** — 실제 로그인 브라우저로 완주함 (아래 Release Status)
- [ ] 계정 삭제 — service_role 이 필요해 보류. 사유와 계획은 ARCHITECTURE 참고

### Release Status (2026-08-30) — Release Recommendation: GO

Production 대상 QA 230건 이상(코드 레벨·HTTP 레벨·anon RLS·A/B 계정 DB
레벨)에 이어 **실제 로그인 사용자 기준 브라우저 E2E 1회를 끝까지 완주**했다:

```
Login → Home 상태 선택 → Write → Safety 분기 → Rest Suggestion
→ 3분 Timer → Community → Reaction → My Rest → Logout → Relogin
```

- P0 FAIL 0 / P1 FAIL 0
- Production RLS / A-B 교차 접근(IDOR) 검증 PASS, 5xx 0건, 개인정보 노출 0건
  (profiles/posts/reactions/community_feed/community_feed_page 전부
  실제 계정으로 확인)
- 이 브라우저 E2E 도중 **Reaction 버튼이 실제로는 아무 것도 저장하지
  않는 P1 결함**을 발견했다 — `formAction` 이 서버 액션 참조일 때 React 가
  버튼의 `name`/`value` 를 FormData 로 그대로 넘기지 않는 문제였다.
  `.bind()` 로 값을 직접 실어 보내도록 고쳤다(커밋 `5883348`). 수정 후
  Production 에서 insert / toggle delete / 다른 반응 타입 / count 반영을
  전부 재확인했다 — PASS.

**non-blocking backlog로 남긴 것**:

- `FINAL-QA-071` — `classify()`가 국제 전화번호 형식(`+82 10 …`)을
  REVIEW로 잡지 못함. `lib/rest/safety.ts` `contact_info` 정규식이 국내
  형식(`010-…`)만 커버. 자해·자살 HIGH_RISK 탐지에는 영향 없음.
- 계정 삭제 미구현 — 위 체크박스 참고.

**정리 필요 (Supabase Dashboard, 사람이 수행)**:

- QA 계정 `zzz-qa-a` / `zzz-qa-b` — 앱에 계정 삭제 기능이 없어
  (`service_role` 필요) Dashboard → Authentication → Users 에서 수동 삭제.
- leftover 글 `"[QA] 실제 브라우저 E2E 테스트 — 오늘은 그럭저럭 괜찮은
  하루였어요."`(및 연결된 `ai_suggestion`/`rest_session`) — 앱에 글 삭제
  UI가 없어 Dashboard → Table Editor 에서 수동 삭제. 계정 자체를 지우면
  `on delete cascade` 로 함께 지워지므로 계정만 지워도 된다.

**참고 (다음에 브라우저 자동화가 다시 필요할 때)**: `claude-in-chrome` 은
이 저장소를 다루는 세션들에서 연결되지 않았다(원인 불명). 대안으로
**Playwright** 는 동작한다 — `npx --yes playwright install chromium` 로
브라우저를 받고, Node 의 ESM 리졸버가 `NODE_PATH` 를 무시하므로 실행할
스크립트가 있는 위치에서 `import { chromium } from "playwright"` 가
resolve 되려면 npx 캐시의 `playwright`/`playwright-core` 를
`node_modules/` 에 임시로 복사해야 한다. `package.json` 에는 추가하지
않는다 — 작업이 끝나면 복사본을 지운다. Supabase 는 이메일 발송에
project 단위 rate limit(`over_email_send_rate_limit`, HTTP 429)이 있다 —
짧은 시간에 회원가입/재설정 메일을 여러 번 보내면 걸리고, 확인 자체도
메일을 소모하니 신중하게 재시도한다.

## Brand Rename — 쉼 (Sprint 2 이후)

사용자 노출명을 「쉼 Community」에서 **「쉼」 / 부제 「나만의 공간」**으로 바꿨다.
브랜드 규칙은 `docs/PRODUCT.md` §0.

바꾸지 않은 것: 저장소·Vercel 프로젝트·npm package name·Supabase 프로젝트 ref·
DB 스키마·마이그레이션 이력. 전부 `shim-community` 그대로다.
**이미 적용된 마이그레이션 파일의 주석도 고치지 않았다** — 적용된 파일은
그대로 두는 것이 원칙이다.

## Sprint 3 이후 (다음 Phase)

Sprint 2 가 기존 3~6 계획(Write / AI Rest / Timer / Feed / 내 쉼)을 흡수했다.
남은 것은 아래이며, **이번 Sprint 범위가 아니다.**

- 실제 AI provider 연결 (`RestPlanProvider` 구현 교체)
- 계정 삭제 (Edge Function + service_role)
- Premium
- Geolocation / 장소 추천
- Web Push

## Sprint 7 — PWA 완성

- Service Worker, Web Push subscription/발송, 설치 유도, 아이콘 확정
