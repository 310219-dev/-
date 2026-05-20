# Feature Specification: List Spotify Playlists

**Feature Branch**: `001-list-spotify-playlists`

**Created**: 2026-05-20

**Status**: Draft

**Input**: User description: "建立網站從 Spotify 抓取我的歌單並以文字方式列成清單"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - List Playlists (Priority: P1)

使用者開啟網站並點選「登入 Spotify」。完成 OAuth 授權後，系統顯示使用者所有歌單，以每行「歌單名稱 — 曲目數」的純文字清單呈現。

**Why this priority**: 這是核心價值：快速看到歌單清單並能複製為文字。

**Independent Test**: 完成授權後呼叫 Spotify API `/v1/me/playlists`，畫面顯示至少一筆歌單，格式為「名稱 — 曲目數」。

**Acceptance Scenarios**:

1. **Given** 使用者未登入， **When** 點選「登入 Spotify」並授權， **Then** 導回頁面並顯示歌單清單。
2. **Given** API 有回傳多頁， **When** 系統取得所有頁面， **Then** 畫面包含所有歌單項目。

---

### User Story 2 - (Optional) Expand Playlist Tracks (Priority: P2)

使用者可點選任一歌單以展開觀看該歌單的曲目清單（每行：「曲目名稱 — 藝人」）。

**Why this priority**: 提供更完整的檢視，但非列出歌單的最低可行產品（MVP）。

**Independent Test**: 點選某歌單，系統呼叫 `/v1/playlists/{playlist_id}/tracks` 並顯示曲目列表。

**Acceptance Scenarios**:

1. **Given** 使用者點選歌單， **When** API 回傳成功， **Then** 顯示該歌單曲目明細。

---

### User Story 3 - Error & Rate-limit Handling (Priority: P3)

若授權失敗、token 過期或遭遇 API 限流，系統顯示友善錯誤訊息並提供重新授權或稍後重試的選項。

**Independent Test**: 模擬 401 或 429 回應，確認介面顯示對應訊息並提供重試。

---

### Edge Cases

- 使用者無任何歌單 → 顯示空狀態提示與說明。
- 使用者歌單數量非常大（>500）→ 分批載入並顯示部分進度提示。
- API 回 429（限流）→ 暫停並重試或顯示重試提示。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統 MUST 使用 Spotify OAuth（PKCE）完成使用者授權並取得 access token。
- **FR-002**: 系統 MUST 呼叫 `GET /v1/me/playlists` 並取得每個歌單的 `id`, `name`, `tracks.total`, `public` 等欄位。
- **FR-003**: 系統 MUST 以純文字格式列出每個歌單，格式為「<歌單名稱> — <曲目數>」。
- **FR-004 (optional)**: 系統 SHOULD 支援點選展開以列出該歌單內的曲目（每行顯示「曲目名稱 — 藝人」）。
- **FR-005**: 系統 MUST 處理分頁（使用回傳的 `next` 連結直到無更多資料）。
- **FR-006**: 系統 MUST 提供「重新整理歌單」與「登出/取消授權」功能。
- **FR-007**: 前端不得儲存 `client_secret`（採 PKCE 流程）；若使用 serverless，`client_secret` 僅存於平台環境變數。

### Key Entities

- **User**: Spotify user id（識別使用者）。
- **Playlist**: `id`, `name`, `tracks_total`, `public`, `owner`。
- **Track** (若展開): `id`, `name`, `artists[]`。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 使用者在完成授權後，對於最多 200 個歌單，頁面能在 5 秒內顯示全部歌單（網路延遲除外）。
- **SC-002**: 在非限流情況下，95% 的請求能成功列出歌單而無錯誤顯示。
- **SC-003**: 使用者能以文字複製整個清單且格式正確（名稱與曲目數）。

## Assumptions

- 使用 Spotify 官方 Web API 並採用 PKCE 流程（使用者會在 Spotify Developer 取得 `client_id`）。
- 預設為純靜態前端部署（可上 GitHub Pages）；serverless 為可選項目。
- 目標為個人/小量使用者，不須支援高併發商業用量。

## Clarifications

### Session 2026-05-20

- Q1: 是否要在預設功能中包含「展開歌單列出曲目清單」？ → A: 僅列出歌單名稱與曲目數（Option A，優先最小範圍與快速完成 MVP）。

