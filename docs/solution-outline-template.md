# Executive Summary
- Mục tiêu kinh doanh & bài toán cần giải quyết
- Tóm tắt giải pháp đề xuất (2–3 dòng)
- Lợi ích kỳ vọng: triển khai nhanh, dễ mở rộng, chi phí vận hành thấp
- Scope & phạm vi áp dụng (multi-site, cross-product)

# Bối cảnh & yêu cầu
- Context: môi trường Atlassian Cloud, số lượng site, sản phẩm liên quan (Jira + Confluence)
- Functional requirements: các tính năng cần có
- Non-functional requirements: performance, security, data residency, scalability
- Constraints: giới hạn của Forge platform (runtime limits, storage, egress...)

# Solution Overview
- Kiến trúc tổng quan (High-level architecture diagram)
- Lý do chọn Forge (so với Connect / native)
- Mô hình triển khai: single app — multi-site installation
- Luồng tương tác chính giữa Jira, Confluence & Forge app
- Các thành phần chính của hệ thống (components map)

# Thiết kế kỹ thuật chi tiết
- App manifest & module structure
    jira:issuePanel, confluence:contentBylineItem, trigger, function definitions...
- Data model & Forge Storage strategy
    Entity isolation per site, Storage scope (app / site / user), indexing pattern
- Cross-product integration design
    Cách Jira module và Confluence module chia sẻ dữ liệu, gọi lẫn nhau
- Permission & Security model
    OAuth scopes, Forge sandbox, user context isolation per site
- External service integration (nếu có)
    Remote backend, Egress allowlist, Forge Tunnel vs production
- Configuration & Feature flag per site
- Error handling & logging strategy

# Chiến lược Multi-site & Scalability
- Site isolation model
    Mỗi site có namespace riêng, không ảnh hưởng lẫn nhau
- Cơ chế cấu hình per-site (admin settings, custom fields)
- Chiến lược onboard site mới (zero-downtime, auto-provision)
- Horizontal scaling considerations (Forge function concurrency)
- Rate limit & throttling handling

# Deployment & CI/CD Pipeline
- Environment strategy: development → staging → production
- Forge CLI deployment workflow (forge deploy,forge install)
- CI/CD pipeline design (GitHub Actions / Bitbucket Pipelines)
- Rollback strategy
- Secrets & credentials management

# Observability & Maintainability
- Logging & monitoring strategy (Forge built-in logs + external sink)
- Alerting & incident response
- Version management & backward compatibility
- Upgrade path khi Atlassian thay đổi API

# Rủi ro & Giải pháp giảm thiểu
- Giới hạn platform (Forge runtime, storage quotas, egress)
- Vendor lock-in & dependency on Atlassian roadmap
- Security risks & mitigation
- Migration risk nếu cần chuyển sang Connect hoặc tách backend

# Roadmap triển khai
- Phase 1 – MVP: core feature, 1 site pilot
- Phase 2 – Multi-site rollout & configuration layer
- Phase 3 – Optimization, observability & advanced features
- Milestones, dependencies & go/no-go criteria