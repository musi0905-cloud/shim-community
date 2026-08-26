# 쉼 — 나만의 공간 · Product Definition v0.1

> **적용 범위**: 이 제품(Responsive Web / PWA). 쉼 iOS 앱에는 적용되지 않는다.
> **지위**: 이 문서가 이 제품의 최상위 제품 기준이다.
> **확정일**: 2026-08-26 (Sprint 0.1, Product Owner 결정 PO-001 / PO-002 / PO-003)
>
> 이 문서는 `musi0905-cloud/shim-ios` `docs/PRODUCT.md`(쉼 제품 기획 기준서 v0.1)의
> 사본이 아니다. 두 제품은 브랜드 철학을 공유하지만 독립된 제품이며, iOS 기준서의
> 플랫폼·범위 제약은 이 제품에 적용되지 않는다. (PO-001, PO-002)

---

## 0. 브랜드

| 항목 | 값 |
| --- | --- |
| Brand | **쉼** |
| Subtitle | **나만의 공간** |
| Brand Message | **도파민보다, 쉼.** |
| Product Description | **오늘의 마음을 잠깐 내려놓는 곳.** |

표기 규칙:

- 이름과 부제를 **두 줄 계층**으로 쓴다. `쉼: 나만의 공간` 처럼 한 줄로
  붙이지 않는다.

  ```
  쉼
  나만의 공간
  ```

- **브랜드 메시지는 Landing 등 브랜드 화면에서만** 쓴다. 앱 안쪽 화면마다
  반복하면 카피가 아니라 소음이 된다.
- 브라우저 탭처럼 한 줄이 강제되는 곳에서만 `쉼 — 나만의 공간` 을 쓴다.

**이름이 겹치는 문제.** 쉼 iOS 도 브랜드가 「쉼」이다. 사용자에게는 둘 다
「쉼」으로 보이는 것이 의도된 것이고, 문서·코드에서 두 제품을 구분해야 할
때는 기술 식별자(`shim-ios` / `shim-community`)나 「iOS」/「웹」으로 쓴다.
이전 이름 「쉼 Community」는 더 이상 사용자에게 노출하지 않는다.

**기술 식별자는 브랜드와 별개다.** 저장소·Vercel·Supabase·npm package 이름은
그대로 `shim-community` 다. 브랜드 변경으로 인프라를 rename 하지 않는다.

---

## 1. Product Statement

> **"오늘의 마음을 잠깐 내려놓는 곳."**

---

## 2. Product Purpose

힘든 순간, 잠시 현실에서 거리를 두고 나에게 돌아올 수 있는 시간을 만든다.

문제를 해결해주는 것이 아니다. 상담을 대신하는 것도 아니다.
지금 당장 풀리지 않는 것에서 잠깐 떨어져 나올 여백을 만드는 것이 전부다.

---

## 3. Product Principle

> 사용자를 오래 붙잡는 서비스가 아니라, 가능한 빨리 자기 자신에게 돌려보내는 서비스.

- 체류시간을 성공 지표로 삼지 않는다.
- 사용자가 해야 할 선택을 최소화한다.
- 조언보다 실행이 먼저다.
- 쉼이 끝나면 화면 밖으로 돌려보낸다.

---

## 4. Platform

**Mobile-first Responsive Web / PWA.**

이 제품의 첫 플랫폼은 웹이다. iOS 기준서의 "첫 플랫폼은 iOS" 조항은
이 제품의 플랫폼 제약으로 적용하지 않는다. (PO-001)

지원 뷰포트:

| 폭 | 기준 |
| --- | --- |
| 375px | 모바일 최소 |
| 390px | 모바일 표준 |
| 768px | 태블릿 |
| 1024px | 데스크톱 진입 (Left Sidebar 전환) |
| 1440px | 데스크톱 넓은 화면 |

---

## 5. Core Flow

### 최초 방문

```
Landing
 → Auth
 → Persistent Anonymous Nickname
 → Home
 → State (오늘의 상태 선택)
 → Write
 → AI Rest Suggestion
 → Rest (실제 쉼)
 → Community
```

### 재방문

```
접속
 → Session Restore
 → 동일 닉네임
 → Home
```

재방문 시 Landing과 Auth를 다시 통과시키지 않는다. 지친 사람에게 로그인 화면을
다시 보여주는 것 자체가 마찰이다.

---

## 6. Persistent Anonymous Identity

**익명 ≠ 매번 랜덤 닉네임.**

익명이란 현실 신원은 공개하지 않지만, 서비스 안에서는 동일한 정체성이 지속되는 구조다.

- 사용자는 현실 신원(실명, 전화번호, 지인 관계)을 노출하지 않는다.
- 동시에 서비스 안에서는 **같은 닉네임이 계속 유지된다.**
- 접속할 때마다 새 닉네임을 부여하지 않는다. 그러면 자기 기록으로 돌아갈 수 없다.

이 구조가 있어야 "내 쉼"(개인 기록)과 Community가 동시에 성립한다.

---

## 7. Community Rules

Community의 목적은 **사람을 붙잡는 것이 아니라, 내가 혼자가 아니라는 느낌을
잠깐 전달하는 것**이다. (PO-002)

Feed는 Community의 핵심 기능이지만 **SNS Feed와 동일하게 설계하지 않는다.**

### 영구 금지 (제품 차원)

- 댓글
- DM
- Follow
- 친구 추가
- 인기글
- Trending
- 조회수 경쟁
- Like 숫자 경쟁
- Ranking
- Streak
- Gamification
- Infinite Scroll
- 자극적인 추천 알고리즘

이 목록은 "아직 안 만든 것"이 아니라 **만들지 않기로 확정한 것**이다.
성장 지표를 이유로 되돌리지 않는다.

---

## 8. AI Rest

AI는 상담 챗봇이 아니다. **AI가 사용자와 장시간 대화를 시작해서는 안 된다.**

### Backend / Domain — 구조화된 Rest Plan

```ts
{
  acknowledgement: string,      // 짧은 공감
  action: {
    type: string,               // 쉼 행동의 종류
    duration_minutes: number,   // 3 | 5 | 10
    instruction: string         // 지금 할 수 있는 구체적 행동 1개
  },
  closing: string               // 휴대폰을 내려놓도록 안내하는 메시지
}
```

이후 확장 가능한 필드: `placeRecommendation`, `safetyLevel`, `fallbackType`.

### Frontend — 3-zone presentation

같은 데이터를 화면에서는 세 영역으로 렌더링한다.

1. **짧은 공감**
2. **구체적인 쉼 행동 1개**
3. **휴대폰을 내려놓도록 안내하는 쉼의 메시지**

행동은 반드시 **1개**다. 선택지를 늘리면 지친 사람에게 또 하나의 결정을 떠넘기게 된다.

---

## 9. Rest Timer

**3분 / 5분 / 10분.**

타이머가 도는 동안 사용자는 화면을 보지 않는 것이 정상 상태다.
남은 시간을 확인하려고 다시 들어오게 만드는 설계를 하지 않는다.

---

## 10. PWA / Notification

| 플랫폼 | 방식 |
| --- | --- |
| iOS | Home Screen 설치를 전제로 한 Web Push flow |
| Android / Desktop | feature detection 기반 Web Push |

OS 이름으로 기능을 단정하지 않고 **feature detection을 우선**한다.
OS 판별은 안내 문구를 고를 때만 쓴다. (`lib/platform.ts`)

실제 Service Worker와 Push 발송 구현은 이후 Sprint에서 다룬다.

---

## 11. Geolocation / Rest Places

- 위치 권한은 **해당 기능을 실행하는 시점에만** 요청한다.
- 앱 진입 시 선제적으로 권한을 요구하지 않는다.
- **지속적인 위치 추적을 하지 않는다.**
- 정밀 좌표를 장기 보관하지 않는다.

---

## 12. Premium

- 전체 기록
- 개인 상태 패턴
- 시간 / 요일 패턴
- 잘 맞는 쉼 추천
- 주간 / 월간 AI Reflection

Premium은 **더 오래 머물게 하는 기능이 아니라 자기 이해를 돕는 기능**이어야 한다.
체류시간이나 경쟁 요소를 Premium으로 팔지 않는다.

---

## 13. Safety

- **진단·치료·상담 서비스로 포지셔닝하지 않는다.**
- 의료 행위나 심리 상담을 대체한다고 표현하지 않는다.
- 고위험 자해·자살 표현이 감지되면 일반 AI Rest 흐름과 **분리된 Safety Flow**로 전환한다.
- Safety Flow는 생성형 AI의 자유 판단에 맡기지 않고 별도 정책으로 설계한다.

---

## 14. 성공 지표

체류시간과 세션 수를 핵심 지표로 삼지 않는다.

- 쉼 시작률 / 완료율
- 쉼 이후 "조금 나아졌어요" 비율
- 화면을 보지 않고 쉼을 완료한 비율
- 재방문율 (붙잡아서가 아니라, 필요할 때 다시 떠올라서)

> **North Star 후보**: 쉼을 완료한 뒤 이전보다 조금 나아졌다고 응답한 횟수.

---

## 15. 관련 제품

```
쉼
├─ 쉼 iOS            musi0905-cloud/shim-ios
└─ 쉼 (웹/PWA)       musi0905-cloud/shim-community  (이 저장소)
```

두 제품은 브랜드 철학과 "현실의 쉼으로 돌려보낸다"는 핵심 원칙, 유사한 AI Rest 철학을
공유한다. 그러나 **독립 repository / 독립 UX / 독립 roadmap / 독립 release cycle**을
가진다. 한쪽의 결정이 다른 쪽을 자동으로 구속하지 않는다. (PO-001)
