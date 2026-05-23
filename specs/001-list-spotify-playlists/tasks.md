# Tasks: List Spotify Playlists

**Branch**: `001-list-spotify-playlists` | **Plan**: `plan.md` | **Spec**: `spec.md`

**Last Updated**: 2026-05-23 | **Status**: Phase 1 進行中

---

## Phase 0 — Research & Setup ✅

- [x] **Task 0.1**: 確認 Spotify Developer App 設定與 Redirect URI
  - ✅ Client ID: `42b59981c4ac4e4d9fc0091d9cb1926b`
  - ✅ Redirect URI: `https://310219-dev.github.io/-/callback.html`
  - ✅ 授權範圍：`playlist-read-private playlist-read-collaborative`

- [x] **Task 0.2**: 建立 feature branch
  - ✅ 分支已存在：`001-list-spotify-playlists`

---

## Phase 1 — Minimal UI + OAuth PKCE ⏳

- [x] **Task 1.1**: 建立 `frontend/public/index.html`
  - ✅ 登入按鈕 + 歌單列表容器
  - ✅ 使用者信息顯示
  - ✅ 登出功能
  - ✅ 基本 CSS 樣式（Spotify 綠色主題）

- [x] **Task 1.2**: 建立 `frontend/public/callback.html`
  - ✅ 處理 Spotify 回傳的授權碼
  - ✅ 驗證 state（防止 CSRF 攻擊）
  - ✅ 將授權碼存入 sessionStorage
  - ✅ 重導回主頁

- [x] **Task 1.3**: 建立 `frontend/public/app.js`
  - ✅ PKCE 實現（生成 code_verifier 和 code_challenge）
  - ✅ OAuth 授權流程
  - ✅ Access token 交換
  - ✅ `/v1/me/playlists` API 呼叫（含分頁處理）
  - ✅ 歌單渲染（格式：名稱 — 曲目數）
  - ✅ 基本錯誤處理（401、429、網路錯誤）

- [ ] **Task 1.4**: 本地啟動靜態伺服器並驗證 ⏳ 待進行
  - [ ] 推送代碼到 GitHub
  - [ ] 啟用 GitHub Pages
  - [ ] 在 Spotify 應用設定中驗證 Redirect URI
  - [ ] 訪問 `https://310219-dev.github.io/-/`
  - [ ] 點擊「登入 Spotify」並完成授權流程
  - [ ] 驗證歌單清單正確顯示

---

## Phase 2 — Tests & TDD ⏳

- [ ] **Task 2.1**: 建立測試模板 `tests/frontend/test_playlists.js`
  - [ ] 安裝 Jest
  - [ ] 編寫 API 回應解析測試
  - [ ] 編寫 PKCE 生成邏輯測試
  - [ ] 編寫歌單列表格式化測試

- [ ] **Task 2.2**: 執行測試並確保通過
  - [ ] 運行 `npm test`
  - [ ] 所有測試必須通過

---

## Phase 3 — Polish & Deploy ⏳

- [ ] **Task 3.1**: 完成錯誤處理
  - [ ] 401 Unauthorized：清除 token、提示重新授權
  - [ ] 429 Too Many Requests：提示稍後重試
  - [ ] 網路錯誤：提供友善的錯誤訊息

- [x] **Task 3.2**: 更新 README.md
  - ✅ 功能說明
  - ✅ Spotify 設定步驟
  - ✅ 本地開發指令
  - ✅ GitHub Pages 部署說明

- [ ] **Task 3.3**: 部署至 GitHub Pages ⏳ 待進行
  - [ ] 推送所有更改到 GitHub
  - [ ] Settings → Pages，選擇 `main` 分支
  - [ ] 等待部署完成
  - [ ] 訪問 `https://310219-dev.github.io/-/` 並測試

---

## Phase 4 — Optional Features (Later)

- [ ] **Task 4.1**: 展開曲目功能（P2 優先級）
  - 點選歌單顯示詳細曲目清單
  - 呼叫 `/v1/playlists/{id}/tracks` API

- [ ] **Task 4.2**: 實現可選的 Serverless 交換（更安全）
  - Vercel/Netlify 函數處理 `client_secret`
  - 更好的 token 刷新管理

---

## 檢查清單 — Phase 1 驗證

在提交 PR 前，請確認以下項目：

- [ ] 代碼已推送到 `001-list-spotify-playlists` 分支
- [ ] GitHub Pages 已啟用
- [ ] `https://310219-dev.github.io/-/callback.html` 已在 Spotify App 中設定為 Redirect URI
- [ ] 無浏覽器控制台錯誤
- [ ] 可成功登入並看到歌單清單
- [ ] 登出後清除所有授權資訊
- [ ] 所有檔案已 commit 並推送

---

## 關鍵文件

| 檔案 | 狀態 | 說明 |
|------|------|------|
| `frontend/public/index.html` | ✅ | 主頁面 |
| `frontend/public/callback.html` | ✅ | OAuth 回調 |
| `frontend/public/app.js` | ✅ | 核心邏輯 |
| `tests/frontend/test_playlists.js` | ⏳ | 單元測試 |
| `README.md` | ✅ | 專案說明 |
| `DEVELOPMENT.md` | ⏳ | 開發指南 |
| `specs/001-list-spotify-playlists/spec.md` | ✅ | 功能規格 |
| `specs/001-list-spotify-playlists/plan.md` | ✅ | 技術計劃 |
