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

## Sprint 1 — Auth & 지속 익명 정체성 ✅ (코드 완료 / 실제 연결 대기)

- [x] Supabase Auth (Email Magic Link) + `@supabase/ssr` 구조
- [x] `profiles` 마이그레이션 + RLS 정책 4종 + updated_at 트리거
- [x] auth-aware `/`, `/auth`, `/auth/confirm`, `/onboarding/nickname`, `/settings`
- [x] 닉네임 검증(2~16자, 금칙어, 보이지 않는 문자) — 중복은 허용
- [x] 로그아웃, 라우트 가드, 탭 간 세션 동기화
- [ ] **실제 Supabase 프로젝트 연결 + E2E 검증** — credential 미제공으로 미수행

설정 절차는 `docs/ARCHITECTURE.md` 「Supabase 설정 절차」 참고.

## Sprint 2 — Write & Post 저장

- `/write` 화면, 상태 선택 → Write 연결
- `posts` 테이블 + RLS, `MoodStateId` 영속화
- `NAV_ITEMS` 의 `routed` 를 페이지가 생기는 대로 켠다

> `docs/PRODUCT.md` §5 Core Flow를 기준으로 진행한다.
> 공식 디자인이 확정되기 전까지 Home/Write/AI Rest/Feed/My Rest를 임의로 재설계하지 않는다.
> `prototype.sprint0-reference.html`은 Historical Reference이며 설계 근거로 쓰지 않는다.

## Sprint 3 — AI Rest

- Rest Plan 생성 (Backend structured / Frontend 3영역, PO-003)
- Safety Flow 분리 (`docs/PRODUCT.md` §13)
- 대화형 아님. 장시간 대화를 시작하지 않는다.

## Sprint 4 — Rest Timer

- 3 / 5 / 10분. 화면을 보지 않는 것이 정상 상태인 UI

## Sprint 5 — Community Feed

- 같은 상태를 보낸 사람들의 기록
- 댓글·인기순·Infinite Scroll 없음 (PO-002 영구 금지)
- 다른 사용자 닉네임 공개 조회용 public-safe view 설계

## Sprint 6 — 내 쉼 / 짧은 쉼

- 지나온 기록, 짧은 쉼 콘텐츠

## Sprint 7 — PWA 완성

- Service Worker, Web Push subscription/발송, 설치 유도, 아이콘 확정
