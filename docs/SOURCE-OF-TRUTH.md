# Source of Truth — 쉼 Community

이 문서는 "무엇을 제품 기준으로 삼는가"만 정의한다. 기준 자체는 `docs/PRODUCT.md`에 있다.

## 우선순위

충돌하면 위가 이긴다.

| 순위 | 문서 | 범위 |
| --- | --- | --- |
| 1 | `docs/PRODUCT.md` | **쉼 Community 최상위 제품 기준** |
| 2 | 이 문서 (`docs/SOURCE-OF-TRUTH.md`) | 기준의 출처와 확정된 결정 기록 |
| 3 | `docs/ARCHITECTURE.md` | 기술 구조 결정 |
| 4 | `docs/SPRINTS.md` | 작업 순서 |

`musi0905-cloud/shim-ios`의 문서는 **이 제품의 기준이 아니다.** 쉼 iOS는 독립 제품이며,
그 저장소의 `docs/PRODUCT.md`(쉼 제품 기획 기준서 v0.1)는 iOS 제품 범위에 대한 기준서다.
브랜드 철학은 공유하지만 플랫폼·기능 범위 제약은 이 제품에 적용되지 않는다. (PO-001)

---

## 확정된 Product Owner 결정

### PO-001 — 쉼 Community의 제품 지위

**확정.** 쉼 Community는 쉼 iOS의 보조 웹 채널이 **아니다. 독립된 제품이다.**

```
쉼
├─ 쉼 iOS
└─ 쉼 Community Web/PWA
```

공유하는 것: 브랜드 철학, "현실의 쉼으로 돌려보낸다"는 핵심 원칙, 유사한 AI Rest 철학.

독립적인 것: repository, UX, roadmap, release cycle.

따라서 iOS 기준서의 **"첫 플랫폼은 iOS"는 쉼 Community의 플랫폼 제약으로 적용하지 않는다.**
쉼 Community의 첫 플랫폼은 **Responsive Web / PWA**다.

### PO-002 — Community 예외

**확정.** iOS 기준서 §15의 "처음부터 복잡한 커뮤니티 / SNS형 피드를 만들지 않는다"는
**iOS 제품 범위에 대한 결정**이며 쉼 Community에는 적용하지 않는다.

다만 쉼 Community도 SNS engagement 서비스가 되어서는 안 된다.
아래는 **제품 차원의 영구 금지사항**이다.

댓글 / DM / Follow / 친구 추가 / 인기글 / Trending / 조회수 경쟁 /
Like 숫자 경쟁 / Ranking / Streak / Gamification / Infinite Scroll /
자극적인 추천 알고리즘

Community의 목적은 "사람을 붙잡는 것"이 아니라
**"내가 혼자가 아니라는 느낌을 잠깐 전달하는 것"**이다.

Feed는 Community 제품의 **핵심 기능이지만**, SNS Feed와 동일하게 설계하지 않는다.

### PO-003 — AI Rest 출력 형식

**확정.** 구조화된 Rest Plan과 자연어 3단 구조는 충돌하지 않는다. **둘 다 사용한다.**

- **Backend / Domain**: 구조화된 Rest Plan
  (`acknowledgement`, `action{type, duration_minutes, instruction}`, `closing`)
  확장 예정 필드: `placeRecommendation`, `safetyLevel`, `fallbackType`
- **Frontend**: 3영역 렌더링 — 짧은 공감 / 구체적인 쉼 행동 1개 / 휴대폰을 내려놓도록 안내

**AI가 사용자와 장시간 대화를 시작해서는 안 된다.**

상세는 `docs/PRODUCT.md` §8.

---

## 공식 기준이 아닌 것

### `prototype.sprint0-reference.html` — Historical Sprint 0 Reference

**공식 Design Source of Truth가 아니다.**

Sprint 0에서 원본 UX Reference를 찾지 못한 상태로 Claude가 임시 생성한 산출물이며,
"Sprint 0 시점에 무엇을 만들었는가"의 **역사적 기록**으로만 보존한다.
문서와 코드에서는 항상 **Historical Sprint 0 Reference**로 표기한다.

향후 공식 디자인이 확정되면 별도 design specification을 따른다.
이 파일과 공식 기준이 충돌하면 언제나 공식 기준이 이긴다.

### 확정 카피가 아닌 것

Sprint 0에서 구현한 Home 화면의 상태 카드 문구·순서·hint 텍스트는 확정된 카피가 아니다.
공식 UX 정의가 도착하면 교체 대상이다.

---

## 미확정 쟁점

**없음.** PO-001 / PO-002 / PO-003으로 Sprint 0.1 시점의 제품 충돌은 모두 해소되었다.

---

## 관련 저장소

- `musi0905-cloud/shim-community` — **이 저장소.** 쉼 Community의 정식 저장소.
- `musi0905-cloud/shim-ios` — 쉼 iOS 앱. 독립 제품.
- `musi0905-cloud/App` — **무관한 Google Apps Script 프로젝트.** 쉼 파일을 넣지 않는다.
  근거: `shim-ios/docs/DECISIONS.md` D-002.
