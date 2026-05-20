# Implementation Plan: List Spotify Playlists

**Branch**: `001-list-spotify-playlists` | **Date**: 2026-05-20 | **Spec**: specs/001-list-spotify-playlists/spec.md

**Input**: Feature specification from `specs/001-list-spotify-playlists/spec.md`

## Summary

建立一個純前端的最小可行產品（MVP），使用 Spotify OAuth Authorization Code with PKCE，讓使用者授權後列出其所有歌單為純文字清單（每行「歌單名稱 — 曲目數」）。目標可部署至 GitHub Pages，避免在 repo 中保存 `client_secret`。

## Technical Context

**Language/Version**: 前端：HTML/CSS/JavaScript（ES2020+）

**Primary Dependencies**: 無後端框架。開發工具可使用 Node.js env 下的靜態伺服器（例如 `serve`）進行本地測試。

**Storage**: 無伺服器端 storage，access token 只保存在瀏覽器記憶體/short-lived session storage（建議僅記憶體）。

**Testing**: 前端單元測試可選 Jest，整合測試可用 Cypress 或手動驗證。初版以手動驗證與小量單元測試為主。

**Target Platform**: 現代瀏覽器（Chrome/Firefox/Edge/Safari 現代版本）。

**Project Type**: 靜態前端網站（可部署至 GitHub Pages）。

**Performance Goals**: 在常見的寬頻網路下，最多 200 個歌單可在 5 秒內載入並顯示（網路延遲除外）。

**Constraints**: 不保留 `client_secret`；遵守 Spotify API rate limits；避免顯示過多即時曲目資料以免 UI 過重。

## Constitution Check

遵循專案憲章要求：簡潔優先、TDD 優先（有測試模板）、每步驟 commit。此計畫將採小步驟提交以符合憲章。

## Project Structure

Documentation (this feature)

```text
specs/001-list-spotify-playlists/
├── spec.md
├── plan.md
└── tasks.md    # created later by /speckit-tasks or manually
```

Source Code (repository root)

```text
frontend/
└── public/
    ├── index.html
    ├── callback.html
    └── app.js
tests/
└── frontend/
    └── test_app.spec.js
```

**Structure Decision**: 使用單一靜態前端目錄 `frontend/public` 放置靜態資源，便於直接部署到 GitHub Pages 或其他靜態托管。

## Implementation Phases & Tasks

Phase 0 — Research & Setup (0.5–1h)
- Task 0.1: 確認 Spotify Developer app 設定與 Redirect URI（你提供 `client_id` 與欲使用的 Redirect URI）
- Task 0.2: 建立 feature branch（已完成）

Phase 1 — Minimal UI + OAuth PKCE (1–2h)
- Task 1.1: 建立 `frontend/public/index.html`（登入按鈕與列表容器）
- Task 1.2: 建立 `frontend/public/callback.html`（處理 Spotify 回傳的 `code`）
- Task 1.3: 建立 `frontend/public/app.js`（產生 PKCE、啟動授權流程、交換 token、呼叫 `/v1/me/playlists`、處理分頁、顯示清單）
- Task 1.4: 本地啟動靜態伺服器並手動驗證 OAuth 與歌單列出

Phase 2 — Tests & TDD (0.5–1h)
- Task 2.1: 新增簡單測試模板 `tests/frontend/test_playlists.js`（測試程式在本地模擬 API 回應後解析列表）
- Task 2.2: 在實作前先寫最小測試（TDD）然後實作以通過測試

Phase 3 — Polish & Deploy (0.5–1h)
- Task 3.1: 添加基本錯誤處理（401、429）與使用者提示
- Task 3.2: 更新 `README.md` 包含 `client_id` 設定與部署說明
- Task 3.3: 部署到 GitHub Pages（或提供部署指令）

Phase 4 — Optional Serverless (later)
- Task 4.1: 如需更安全的 token 交換或持久化，建立 serverless 函數在 Vercel/Netlify 處理 token 交換與 refresh token（需 `client_secret` 存在 env）

## Milestones & Acceptance

- M1: MVP UI 能授權並列出歌單（FR-001 ~ FR-003 完成）
- M2: 測試模板通過並提交（TDD 原則達成）
- M3: README 與部署說明完成，並可在 GitHub Pages 上線

## Risks & Mitigations

- 風險：Spotify OAuth 回調或 CORS 問題；
  - 緩解：使用指定 Redirect URI、檢查 Spotify App 設定，若 CORS 問題改用 serverless 代理
- 風險：API rate limit；
  - 緩解：在 UI 上顯示限流提示並重試機制

## Next Steps

1. 我會依此計畫建立最小原型檔案（`index.html`, `callback.html`, `app.js`, 測試模板），或如果你希望先自己做，我可以只產生 `tasks.md` 供 speckit 使用。
