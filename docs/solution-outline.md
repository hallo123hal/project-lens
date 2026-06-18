# Solution Outline: ProjectLens

## Executive Summary

**Bài toán kinh doanh:** PMO, Engineering Manager và Delivery Manager phải mở từng Jira board riêng lẻ để đánh giá rủi ro giao hàng, dẫn đến báo cáo chậm, thiếu nhất quán và bỏ sót rủi ro khi quản lý nhiều dự án đồng thời.

**Giải pháp đề xuất:** ProjectLens là Forge app trên Jira Cloud giúp hiển thị bảng điều khiển rủi ro cross-project duy nhất — phát hiện tự động bốn tín hiệu rủi ro (blocked issues, velocity drop, scope creep, unassigned work), tính Risk Score mỗi project, và dự báo khả năng hoàn thành sprint qua mô phỏng Monte Carlo — không cần backend ngoài.

**Lợi ích kỳ vọng:**
- Triển khai nhanh: cài trực tiếp từ Atlassian Marketplace, không cần cơ sở hạ tầng riêng
- Dễ mở rộng: hỗ trợ đa site, mỗi site tự cấu hình độc lập thông qua giao diện Settings
- Chi phí vận hành thấp: toàn bộ logic chạy trong Forge runtime + Forge storage, không egress ngoài

**Scope:** Một Forge app duy nhất (`jira:globalPage`), hỗ trợ tất cả Jira Cloud site, không giới hạn số project, Marketplace-ready từ ngày đầu.

### Differentiation vs. Native Jira Dashboards

| Capability | Native Jira Dashboard | ProjectLens |
|---|---|---|
| Cross-project risk aggregate | Manual, per-gadget setup | Automatic, configured once |
| Risk Score calculation | Not available | Weighted formula across 4 signals |
| Velocity drop detection | Manual chart inspection | Automated sub-risk signal |
| Scope creep detection | Not available natively | Calculated from sprint start vs current |
| Monte Carlo completion probability | Not available | 1,000-iteration simulation |
| Blocked work risk signal | Not available | Configurable age threshold detection |
| Fallback states for missing data | No — broken gadgets | First-class, labeled states |
| Multi-site, marketplace-safe | Not applicable | Built-in from day one |

---

## Bối cảnh & Yêu cầu

### Môi trường
- **Platform:** Atlassian Forge (Custom UI)
- **Sản phẩm:** Jira Cloud (Scrum boards là primary target, Kanban graceful degradation)
- **Phân phối:** Atlassian Marketplace — multi-tenant, chạy trên nhiều Jira site khác nhau
- **Người dùng chính:** Engineering Manager, PMO, Delivery Manager, Scrum Master, Tech Lead

### Functional Requirements (23 FR)
| Nhóm | Mô tả |
|------|--------|
| FR-1 → FR-4 | Portfolio Risk Dashboard: hiển thị summary, filter/sort, refresh, drill-down |
| FR-5 → FR-10 | Project Risk Detail: breakdown 4 tín hiệu rủi ro, evidence, recommended actions |
| FR-11 → FR-13 | Risk Scoring: tính sub-risk 0–100, tổng hợp có trọng số, map sang Low/Medium/High |
| FR-14 → FR-15 | Sprint Completion Prediction: Monte Carlo 1000 iterations, fallback issue count |
| FR-16 → FR-20 | Settings & Onboarding: project selection, board mapping, field config, threshold |
| FR-21 → FR-23 | Marketplace-ready: permission-aware, missing-data fallback, resilient multi-project |

### Non-Functional Requirements
- **Performance:** <3s cho 10 project, <5s cho 20, <10s cho 50 (warm cache)
- **Security:** least-privilege read-only scopes, không lưu issue payload đầy đủ
- **Privacy:** chỉ lưu derived metrics và settings, không lưu comment/attachment
- **Accessibility:** Risk indicator dùng cả màu + text + icon/badge (WCAG compliant)
- **Testability:** pure functions có thể unit test độc lập với Jira

### Constraints (Forge platform)
- Forge function timeout và memory limit: không xử lý batch quá lớn trong một lần gọi
- Forge storage quota: chỉ lưu derived metrics, không lưu full issue payload
- Không có external egress trong MVP: mọi data đến từ Jira REST qua Forge APIs
- Chỉ được dùng một `jira:globalPage` module
- Jira API rate limit: phải paginate, cache kết quả, hỗ trợ manual refresh

---

## Solution Overview

### Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────┐
│                  Jira Cloud (Browser)                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │            ProjectLens Custom UI (React)          │  │
│  │  DashboardPage │ ProjectDetailPage │ SettingsPage │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │ Forge Bridge invoke()          │
│  ┌──────────────────────▼────────────────────────────┐  │
│  │            Forge Resolver Functions               │  │
│  │  getDashboardData  │  getProjectRiskDetail        │  │
│  │  getSettings       │  saveSettings                │  │
│  │  getUserPreferences│  saveUserPreferences         │  │
│  └─────┬──────────────┬───────────────┬─────────────┘  │
│        │              │               │                  │
│  ┌─────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐          │
│  │jiraService │ │riskScoring │ │settingsService│         │
│  │(Jira REST) │ │monteCarloS.│ │storageService │         │
│  └─────┬──────┘ └────────────┘ └─────┬──────┘          │
│        │                             │                   │
│  ┌─────▼──────┐               ┌──────▼─────┐            │
│  │ Jira REST  │               │Forge Storage│            │
│  │   APIs     │               │(settings,   │            │
│  └────────────┘               │ cache)      │            │
│                               └─────────────┘            │
└─────────────────────────────────────────────────────────┘
```

### Lý do chọn Forge
- **Forge vs Connect:** Forge không cần host server riêng, security sandbox tích hợp, không cần quản lý SSL/certificate, phù hợp MVP không có egress
- **Forge vs Native:** Custom UI cho phép React dashboard phức tạp hơn native Jira macros

### Mô hình triển khai
- **Single app — multi-site:** một Forge app duy nhất được install trên nhiều Jira Cloud site khác nhau
- Mỗi site có namespace storage riêng (`settings:site`, `preferences:user:{accountId}`, `analysis:project:{key}`)
- Không có shared state giữa các site

### Luồng tương tác chính
1. User mở ProjectLens từ Jira Apps → `DashboardPage` load
2. Frontend gọi `invoke('getDashboardData')` qua Forge bridge
3. Resolver đọc settings → `analysisService` chạy song song phân tích từng project
4. `jiraService` lấy data từ Jira REST (paginated), `riskScoringService` tính điểm
5. `monteCarloService` dự báo completion probability
6. Kết quả được cache vào Forge storage, trả về frontend với warnings/errors/partial flags
7. Frontend render dashboard — partial failures hiển thị fallback state, không block toàn bộ

### Risk Score Formula
```
riskScore = blocked×0.35 + velocity×0.25 + scopeCreep×0.25 + unassigned×0.15
```
- 0–39: LOW | 40–69: MEDIUM | 70–100: HIGH
- Mỗi sub-risk normalized 0–100 trước khi tổng hợp

---

## Thiết kế Kỹ Thuật Chi Tiết

### App Manifest & Module Structure
```yaml
# manifest.yml
modules:
  jira:globalPage:
    - key: projectlens-page
      resource: projectlens-ui
      resolver:
        function: resolver
      title: ProjectLens
  function:
    - key: resolver
      handler: index.handler
```
Một `jira:globalPage` duy nhất, routing nội bộ trong React app.

### Data Model & Forge Storage Strategy

| Storage Key | Nội dung | Scope |
|-------------|----------|-------|
| `settings:site` | AppSettings (projects, thresholds, field IDs, board mapping) | App/Site |
| `preferences:user:{accountId}` | UserPreferences (filter, sort, favorites) | App/User |
| `analysis:project:{projectKey}` | ProjectAnalysisResult (derived metrics, timestamps) | App/Site |
| `analysis:portfolio:last` | DashboardData snapshot | App/Site |

**Không lưu:** issue descriptions, comments, attachments, full issue payloads.

### Core Types

```typescript
interface RiskProjectSummary {
  projectKey: string; projectName: string;
  riskScore: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  completionProbability?: number; confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  blockedCount: number; velocityTrend: number;
  scopeCreepPct: number; unassignedCount: number;
  topRiskReason: string; lastUpdated: string; partial: boolean;
}

interface ResolverResult<T> {
  data?: T;
  warnings: AppWarning[];
  errors: AppError[];
  partial: boolean;
}
```

### Cross-product Integration
MVP chỉ tích hợp Jira (không Confluence). Toàn bộ data flow:
- Frontend → Forge bridge `invoke()` → Resolver → `jiraService` → Jira REST API
- `jiraService` xử lý pagination, field extraction, board/sprint lookup
- Không có direct API call từ frontend

### Permission & Security Model
- **Scopes:** read-only Jira scopes (`read:jira-work`, `read:jira-user`) + Forge storage
- **Authorization:** Resolver kiểm tra Jira Administrator trước khi write settings
- **Data isolation:** mỗi tenant (site) có namespace Forge storage riêng
- **UI:** admin controls ẩn với Regular User, nhưng resolver vẫn enforce ở backend

### Error Handling & Warning Codes

```typescript
// Structured warning — không dùng free-text only
{ code: "BOARD_NOT_ACCESSIBLE", severity: "warning", projectKey: "ABC" }
```

Common codes: `NO_ACTIVE_SPRINT`, `INSUFFICIENT_VELOCITY_HISTORY`, `STORY_POINTS_NOT_CONFIGURED`, `USING_ISSUE_COUNT_FALLBACK`, `BOARD_NOT_FOUND`, `MULTIPLE_BOARDS_FOUND`, `PARTIAL_DATA_DUE_TO_PERMISSIONS`, `PROJECT_ANALYSIS_FAILED`

### Configuration & Feature Flag per Site
- Site-wide Settings cho calculation thresholds (admin-only)
- User Preferences cho display preferences (không ảnh hưởng calculation)
- Mọi field ID, board mapping, status name đều configurable — không hard-code

---

## Chiến Lược Multi-site & Scalability

### Site Isolation Model
- Forge storage namespace tự động tách biệt theo site installation
- `settings:site` của site A không ảnh hưởng site B
- User preferences scoped theo `{accountId}` trong từng site

### Cơ chế cấu hình per-site
- Jira Admin của từng site tự cấu hình: project keys, board mapping, story point field ID, blocked status names, thresholds
- Settings lưu vào `settings:site` với defaults tự động nếu chưa cấu hình
- Empty state dẫn user vào Settings onboarding flow

### Chiến lược onboard site mới
1. Install app từ Marketplace
2. Lần đầu mở → empty state → redirect Settings
3. Admin chọn projects, cấu hình fields → save → auto-trigger phân tích lần đầu
4. Dashboard hiển thị kết quả hoặc fallback states rõ ràng
- Zero-downtime: không migration cần thiết, mỗi site install độc lập

### Horizontal Scaling
- Forge functions chạy stateless, Atlassian manage concurrency
- Phân tích nhiều project: chạy song song trong `analysisService.analyzePortfolio()`
- Cache derived results: tránh re-analyze khi không cần thiết
- Rate limit handling: paginate Jira API calls, không fetch toàn bộ issues một lần

---

## Deployment & CI/CD Pipeline

### Environment Strategy
```
Development (forge tunnel) → Staging (forge deploy --environment staging) → Production (forge deploy)
```

### Forge CLI Workflow
```bash
# Dev với hot reload
forge tunnel

# Deploy lên môi trường staging
forge deploy --environment staging
forge install --environment staging --site <staging-site>

# Promote lên production
forge deploy --environment production
```

### CI/CD Pipeline (GitHub Actions)
```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  test:
    - npm install && npm test          # backend unit tests
    - cd static/projectlens-ui && npm run build  # frontend build
    - forge lint                        # scope validation

  deploy-staging:
    if: branch == 'main'
    - forge deploy --environment staging

  deploy-production:
    if: tag matches v*
    - forge deploy --environment production
```

### Rollback Strategy
- Forge hỗ trợ rollback về version trước: `forge deploy` với version cũ từ git tag
- Forge storage schema backwards-compatible: dùng optional fields, không xóa keys
- Feature flag qua settings cho phép tắt tính năng mới mà không redeploy

### Secrets & Credentials
- Không có external secrets trong MVP (no external APIs)
- Forge environment variables cho staging/production config nếu cần
- Không lưu credentials trong frontend code

---

## Observability & Maintainability

### Logging Strategy
- Forge built-in logs: `forge logs` — logs từ resolver functions
- Log resolver duration cho `getDashboardData` (performance tracking)
- Log warning codes và partial flags để debug fallback behavior
- **Không log:** issue descriptions, user data, sensitive Jira content

### Monitoring
- Performance targets là SLO: <3s/10 project, <5s/20 project, <10s/50 project
- Track cache hit/miss ratio (log trong dev, không expose sensitive data)
- Theo dõi warning code frequency để phát hiện common configuration issues

### Version Management & Backward Compatibility
- Forge storage fields: thêm optional fields, không rename/xóa fields đang dùng
- Resolver contracts: không thay đổi response shape mà không version
- Settings schema: dùng `settingsService.validateAndMerge()` để handle missing fields

### Upgrade Path khi Atlassian thay đổi API
- `jiraService.ts` là single point of change cho Jira REST API
- Pure services (`riskScoringService`, `monteCarloService`) không depend vào Jira API format
- Forge platform upgrades: theo Atlassian changelogs, test với `forge tunnel` trước khi deploy

---

## Rủi Ro & Giải Pháp Giảm Thiểu

| Rủi ro | Khả năng | Giải pháp |
|--------|----------|-----------|
| Jira data variability làm Risk Score không nhất quán | Cao | Configurable fields, thresholds, board mapping; hiển thị Confidence level |
| Permission limitations tạo aggregate misleading | Trung bình | Partial-access states, không aggregate dữ liệu restricted |
| Jira API heavy usage gây slow hoặc rate limit | Trung bình | Paginate, cache derived results, manual refresh, analyze Selected Projects only |
| Risk Score trông authoritative hơn evidence thực tế | Trung bình | Hiển thị Risk Signal breakdown, Confidence, warnings, top risk reasons |
| Forge platform limits (timeout, memory, storage quota) | Thấp-Trung | Không lưu full issue payload, xử lý parallel nhưng có timeout guard |
| Vendor lock-in vào Atlassian Forge | Thấp | Pure services không phụ thuộc Forge, có thể extract sang backend nếu cần |
| MVP drifts thành heavyweight portfolio tool | Trung bình | Giữ non-goals: no AI, no Gantt, no write-back, no cross-instance |

---

## Roadmap Triển Khai

### Phase 1 – MVP (Tuần 1–6): Core Feature, 1 Site Pilot
- [ ] Scaffold Forge Custom UI app + `manifest.yml` với một `jira:globalPage`
- [ ] TypeScript domain models: `RiskProjectSummary`, `RiskBreakdown`, `AppSettings`
- [ ] Pure services với unit tests: `riskScoringService`, `monteCarloService`, `settingsService`
- [ ] Resolver stubs trả mock data: `getDashboardData`, `getProjectRiskDetail`, `getSettings`
- [ ] Frontend MVP: `DashboardPage`, `ProjectDetailPage`, `SettingsPage` với mock data
- [ ] `jiraService.ts`: Jira REST integration (paginated), board/sprint lookup
- [ ] Replace mock data bằng live Jira integration từng bước
- [ ] Fallback states cho tất cả missing-data conditions
- [ ] Test pilot trên 1 Jira site thực tế
- **Go/No-Go:** FR-1 → FR-23 pass, SM-1 → SM-3 đạt, performance targets met

### Phase 2 – Multi-site Rollout, Configuration Layer & Gadgets (Tuần 7–10)
- [ ] Verify site isolation hoàn chỉnh (test với 2–3 Jira sites khác nhau)
- [ ] Hardening permission edge cases và partial analysis scenarios
- [ ] Settings onboarding UX polish
- [ ] CI/CD pipeline (GitHub Actions) với staging environment
- [ ] Marketplace listing draft (app description, screenshots, privacy policy)
- [ ] **Dashboard Gadgets:** Add `jira:dashboardGadget` modules to `manifest.yml` for embeddable, read-only widgets:
  - **Portfolio Risk Summary gadget** — shows count of HIGH / MEDIUM / LOW risk projects across configured portfolio
  - **Top At-Risk Projects gadget** — shows top 3–5 projects by Risk Score with drill-down link to global page
  - Gadgets are read-only; all data flows through existing `getDashboardData` resolver (no new API paths)
  - Each gadget requires its own manifest entry and Custom UI resource — budget additional frontend build complexity
- **Go/No-Go:** SM-4 → SM-6 đạt, zero cross-site data leak, Forge lint clean

### Phase 3 – Optimization, Observability & Advanced Features (Tuần 11–14)
- [ ] Performance tuning: parallel project analysis, cache warming strategy
- [ ] Logging & monitoring: resolver duration tracking, warning code analytics
- [ ] Accessibility audit: WCAG compliance, color-blind safe Risk indicators
- [ ] Marketplace submission và review process
- [ ] Post-launch: priority-weighted unassigned risk (deferred từ MVP)
- **Future (Post-Marketplace):** AI recommendations, Slack notifications, export CSV, cross-instance analytics
