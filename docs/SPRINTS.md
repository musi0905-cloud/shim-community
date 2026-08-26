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

## Sprint 1.2 — Vercel 배포 + Supabase Production E2E (진행 중)

- [x] Vercel 배포 적합성 점검 (zero-config, proxy.ts, 환경변수 사용 방식)
- [x] Production 환경에서 매직 링크 주소를 잘못 잡던 origin fallback 수정
- [x] `docs/RUNBOOK-vercel-deploy.md` — 배포·대시보드 설정·E2E 절차
- [ ] **Vercel 배포 및 실사용 E2E** — 세션에서 `*.vercel.app` / `*.supabase.co`
      접근이 차단되어 사람이 브라우저에서 수행해야 한다

## Sprint 2 — Complete MVP Activation (코드 완료 / Production 검증 대기)

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
- [ ] **Production E2E** — 세션에서 Vercel/Supabase 접근이 차단되어 사람이 수행
- [ ] 계정 삭제 — service_role 이 필요해 보류. 사유와 계획은 ARCHITECTURE 참고

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
