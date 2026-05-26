# 項目理解與看法 — Spotify Playlists

本文檔記錄對項目的全面理解、遇到的問題和建議。供下一個 AI Agent 參考。

---

## 項目概述

**名稱**：Spotify Playlists Lister（Spotify 歌單列表器）

**目標**：用戶通過 Spotify OAuth 授權登入，顯示其所有播放列表（格式：「名稱 — X 首」），可點擊展開查看曲目。

**技術棧**：
- 前端：純 HTML/CSS/JavaScript（無框架）
- OAuth：PKCE 流程
- API：Spotify Web API
- 部署：GitHub Pages
- 測試環境：開發模式

---

## 架構理解

### 核心流程

```
用戶點擊「登入 Spotify」
  ↓
生成 PKCE 參數（code_verifier, code_challenge）
  ↓
重導到 Spotify 授權頁面
  ↓
Spotify 授權 → 重導回 callback.html
  ↓
callback.html 提取授權碼 → 存入 sessionStorage
  ↓
app.js 交換授權碼獲取 access token
  ↓
調用 /me/playlists API 獲取歌單列表
  ↓
為每個歌單調用 /playlists/{id}/tracks 獲取曲目數
  ↓
渲染歌單列表（可點擊）
  ↓
點擊歌單 → 顯示曲目詳情
```

### 主要文件

- `app.js`：核心邏輯（OAuth、API 調用、UI 渲染）
- `index.html`：主頁面
- `callback.html`：OAuth 回調處理
- `_config.yml`：GitHub Pages 配置

---

## 當前問題 🔴 **必須解決**

### 核心問題：OAuth Token 權限不足

**症狀**：
- OAuth 授權流程獲取的 token 無法訪問 `/playlists/{id}/tracks`
- 返回 HTTP 403 Forbidden
- 所有歌單顯示「(無權訪問)」

**驗證**：
- 官方 token（BQC3p-...）✅ 能正常工作
- OAuth token（通過授權流程）❌ 返回 403

**根本原因**：
1. Spotify 可能對開發模式應用有權限限制
2. 或 PKCE 流程有特殊限制
3. 或需要申請「生產模式」審批

**臨時方案**（已實施）：
- 在代碼中硬編碼官方 token
- 設置 `USE_TEST_TOKEN = true` 來啟用測試模式
- **缺點**：Token 會過期，需要手動更新

---

## 下一個 Agent 必須做的 ⚠️ **優先級最高**

### 1. 更新過期的 Token（最急迫）

**目前使用的官方 Token**：
```
BQC3p-feCen7Pi51h__0EIB1a1A0RjPIsM02QLXLHbvFX7AuGemnsZGVDwoM-me3Y2xqhY7Xe6N2ehSglK_9-MxiNZHHuZVwS2KS1F5GTwbbf3BvkIBXSK1utNh1HVnBgd72dOTMTSG8f1tnglAI7qv3YZBJ68RnWpEuUzqPVoWm9CYn-z5q3vW5-_5X9tANfyWhbPC98gSi-CdS11ZKHJJoHcIBnZ8wHehwBMPNF2cSsA7RlQbgpAT60zCmXzO5u7i87DVY6ma2QwGVBLi9_KF6giUG5HSpDkIVWIvNZykFdWk3OfnJk55jl-P6SHObimTFLYzT_w
```

**有效期**：1 小時左右（從 2026-05-23 計算）

**如何更新**：
1. 登入 Spotify Developer Dashboard
2. 進入應用設定
3. 點擊「Get Token」獲取新 token
4. 在 `app.js` 中找到 `const TEST_TOKEN = '...'`
5. 替換為新 token
6. 提交並推送到 GitHub

**代碼位置**：
- 文件：`app.js`
- 行：約第 17-18 行
- 搜索：`const TEST_TOKEN = 'BQC3p-...`

### 2. 長期解決方案（需規劃）

**選項 A：申請生產模式**
- 向 Spotify 申請讓應用進入「生產模式」
- 優點：獲得完整 OAuth 權限
- 缺點：審批可能需要時間

**選項 B：Serverless 後端**
- 在 Vercel/Netlify 上部署後端函數
- 隱藏 `client_secret`
- 處理 token 交換和刷新
- 優點：更安全，權限更強
- 缺點：需要部署後端

**選項 C：檢查現有應用配置**
- 查看「靈動歌詞」應用怎麼配置的
- 該應用能正常工作
- 可能有特殊配置我們遺漏了

---

## 代碼要點

### 測試模式開關

文件：`app.js` 第 18 行
```javascript
const USE_TEST_TOKEN = true; // true = 用官方 token，false = 用 OAuth
```

### 權限範圍

文件：`app.js` 第 86 行
```javascript
scope: 'playlist-read-private playlist-read-collaborative user-read-private user-read-email',
```

### 調試日誌

控制台會顯示：
- `[TRACK COUNT]` — 歌單曲目數
- `[WARNING]` — 無權訪問的歌單
- 錯誤信息

---

## 已知限制

1. ⚠️ **官方 Token 會過期** — 需定期更新
2. ⚠️ **OAuth 權限不足** — 需要根本解決
3. ✅ 代碼本身沒有問題 — 只是權限配置問題

---

## 建議

1. **立即**：確認官方 Token 何時過期，提前更新
2. **近期**：嘗試檢查「靈動歌詞」的配置
3. **中期**：決定是申請生產模式還是部署後端
4. **長期**：完全移除測試 token，用正式 OAuth

---

## 聯繫信息

用戶項目：`310219-dev/-`
Spotify App：名稱「small list」，Client ID `42b59981c4ac4e4d9fc0091d9cb1926b`
當前分支：`main`

