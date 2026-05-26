# 🎓 學習歷程檔案 - Spotify 播放列表應用開發

**日期**: 2026年5月  
**項目名稱**: Spotify Playlists Lister  
**技術棧**: HTML/CSS/JavaScript + Vercel Backend + GitHub Pages  
**學習時長**: 約 6 小時（完整開發迭代）

---

## 📚 第一部分：項目概述

### 專案背景
開發一個簡單的 Web 應用，讓用戶通過 Spotify OAuth 登入，並能查看自己的播放列表及曲目數量。

### 核心功能需求
- ✅ 用戶通過 Spotify 安全認證
- ✅ 顯示所有播放列表
- ✅ 顯示每個播放列表的曲目數
- ✅ 支援長期登入狀態保持

---

## 🎯 第二部分：關鍵技術學習

### 一、OAuth PKCE 流程（安全認證）

**學到的概念：**
- PKCE (Proof Key for Code Exchange) 是什麼以及為何比普通 OAuth 更安全
- Authorization Code Flow 的完整步驟
- State 參數的作用（防止 CSRF 攻擊）
- Code Verifier 和 Code Challenge 的生成與驗證

**代碼要點：**
```javascript
// PKCE code_verifier 生成 - 用於增強安全性
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characterLength));
    }
    return result;
}

// 生成 SHA256 challenge - Spotify 需要驗證這個
async function generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    // ... base64url 編碼
}
```

**心得：**
- 初時以為可以直接在前端存儲 Client Secret，後來發現這是**嚴重的安全漏洞**
- PKCE 流程的設計非常巧妙：用一個隨機字符串的 hash 來驗證，而不是直接傳遞 Secret

### 二、後端 Token 交換（安全架構）

**學到的概念：**
- 為什麼 Client Secret 不能暴露到前端
- Vercel 無服務器函數的基本使用
- 環境變數在部署中的重要性
- CORS 跨域請求的處理

**代碼要點：**
```javascript
// Vercel /api/token.js - 後端安全交換 token
// Client Secret 存在環境變數，前端無法訪問
const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,  // ← 只在後端存在
        code_verifier: codeVerifier
    })
});
```

**心得：**
- 後端的存在是為了保護敏感信息，不是為了複雜的邏輯
- Vercel 無服務器函數非常適合簡單的中介服務（token 交換、刷新等）
- 環境變數的配置看似簡單，但對安全性至關重要

### 三、Token 刷新與狀態持久化

**學到的概念：**
- Access Token vs Refresh Token 的區別和用途
- SessionStorage vs LocalStorage 的選擇
- 自動 401 重試機制的實現
- 登入狀態恢復的流程

**代碼要點：**
```javascript
// 保存 refresh_token（有效期通常數月）
sessionStorage.setItem(STORAGE_REFRESH_TOKEN, refreshToken);

// 當遇到 401 時自動刷新
async function makeApiCall(endpoint, accessToken, isRetry = false) {
    const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (response.status === 401 && !isRetry) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            return makeApiCall(endpoint, newToken, true);  // 重試
        }
    }
}

// 頁面加載時自動恢復
document.addEventListener('DOMContentLoaded', async () => {
    if (!accessToken && refreshToken) {
        const newToken = await refreshAccessToken();
        // ... 自動恢復登入狀態
    }
});
```

**心得：**
- Refresh Token 的設計讓用戶可以保持「長期登入」而無需多次輸入密碼
- 自動 401 重試的邏輯需要防止無限重試（isRetry 參數很關鍵）
- SessionStorage 會在瀏覽器關閉時清除，但 refresh_token 可以恢復登入

### 四、API 速率限制與優化

**學到的概念：**
- HTTP 429 (Too Many Requests) 的含義和成因
- 同步 vs 異步請求的性能差異
- 批量操作的最佳實踐
- 數據來源的優先順序

**代碼演變：**
```javascript
// ❌ 初期方案：並發請求播放列表的曲目數
for (const playlist of playlists) {
    // 立即並發發起多個 API 請求 → 觸發 HTTP 429
    const count = await getPlaylistTrackCount(accessToken, playlist);
}

// ✅ 改進方案：串行請求 + 延遲
for (const playlist of playlists) {
    const count = await getPlaylistTrackCount(accessToken, playlist);
    await sleep(150);  // 請求間延遲 150ms
}

// ✅ 最終方案：直接使用 API 已返回的數據
// Spotify /me/playlists 已包含 tracks.total
const total = playlist.tracks?.total;
// 完全避免額外的 /playlists/{id}/tracks 調用
```

**心得：**
- 不是所有 API 限制都是代碼問題，有時是設計不當導致的
- Spotify 的 `/me/playlists` 端點已經包含所需數據，無需再調用 `/playlists/{id}/tracks`
- 優化前要先理解 API 的完整數據結構

---

## 🚀 第三部分：問題解決過程

### 問題 1：OAuth Token 無法訪問 `/playlists/{id}/tracks`

**症狀：** HTTP 403 Forbidden

**根本原因：**
- Spotify 開發模式應用有權限限制
- 生產模式需要 250,000+ 月活躍用戶（對個人項目不現實）

**最終方案：**
- 不調用 `/playlists/{id}/tracks`
- 直接使用 `/me/playlists` 返回的 `tracks.total` 數據

**學到的教訓：**
- 有時候「沒有訪問權限」不是代碼 bug，而是 API 政策限制
- 要充分利用已有的 API 數據，避免冗餘請求

### 問題 2：HTTP 429 Too Many Requests

**症狀：** 加載播放列表時頻繁出現 429 錯誤

**根本原因：**
- 對每個播放列表都發起額外的 API 請求
- 多個請求同時進行，超過 API 速率限制

**最終方案：**
- 移除不必要的 API 調用
- 使用 API 已返回的數據

**學到的教訓：**
- 優化前要先檢查「是否真的需要這個請求」
- 有時候最好的優化是根本不發起請求

### 問題 3：語法錯誤（多次出現）

**症狀：** `Unexpected token '}'` 或 `Unexpected token 'catch'`

**根本原因：**
- 編輯時不小心缺少或多加括號
- 修改後沒有立即驗證

**解決方案：**
- 使用 Node.js 的 `new Function(code)` 驗證語法
- 使用 `grep` 檢查括號是否平衡

**學到的教訓：**
- 代碼編輯后應立即用工具驗證（不應該等用戶反饋）
- 自動化測試很重要

### 問題 4：瀏覽器快取問題

**症狀：** GitHub Pages 更新後瀏覽器仍顯示舊版本

**解決方案：**
- `Ctrl + Shift + R` 強制硬刷新
- 清除瀏覽器快取

**學到的教訓：**
- 靜態資源的快取策略很重要
- 用戶可能看到的不是最新代碼

---

## 💡 第四部分：技術架構與最佳實踐

### 部署架構圖

```
用戶瀏覽器
    ↓ (HTTPS)
GitHub Pages (靜態前端)
    ├─ index.html (UI)
    ├─ app.js (邏輯)
    └─ callback.html (OAuth 回調)
    
    ↓ (API 請求)
    
Vercel 無服務器函數 (後端)
    ├─ /api/token.js (交換 code → access_token)
    └─ /api/refresh.js (交換 refresh_token → 新 access_token)
    
    ↓ (OAuth 認證)
    
Spotify API
    ├─ /authorize (獲取授權碼)
    ├─ /api/token (交換 token)
    └─ /v1/... (API 調用)
```

### 文件結構與職責

| 文件 | 職責 | 關鍵函數 |
|------|------|--------|
| `app.js` | 前端邏輯、UI 交互 | `startOAuthFlow()`, `fetchAllPlaylists()`, `displayPlaylists()` |
| `api/token.js` | 安全交換授權碼 | 接收 code，返回 access_token + refresh_token |
| `api/refresh.js` | 刷新過期 token | 接收 refresh_token，返回新的 access_token |
| `callback.html` | OAuth 回調處理 | 解析 URL 參數，跳轉回主頁面 |
| `index.html` | UI 頁面 | 展示用戶信息和播放列表 |

### 安全性設計

- ✅ **Client Secret 隱藏：** 不在前端代碼中暴露
- ✅ **PKCE 流程：** 使用 code verifier 增強安全性
- ✅ **State 參數：** 防止 CSRF 攻擊
- ✅ **Refresh Token：** 避免長期存儲 access token

---

## 📊 第五部分：最終成果與統計

### 功能完成度

| 功能 | 狀態 | 備註 |
|------|------|------|
| OAuth 登入 | ✅ 完成 | PKCE 流程，完全安全 |
| 播放列表顯示 | ✅ 完成 | 支持多分頁加載 |
| 曲目計數 | ✅ 完成 | 使用 tracks.total |
| Token 刷新 | ✅ 完成 | 自動 401 重試 |
| 登入狀態保持 | ✅ 完成 | 瀏覽器關閉後恢復 |
| 查看曲目詳情 | ⚠️ 受限 | 403 權限限制 |

### 代碼統計

- **總行數：** 669 行
- **函數數：** 16 個主要函數
- **括號匹配：** 134 對（完美平衡）
- **後端端點：** 2 個（token, refresh）

### 學習時間分配

| 階段 | 時間 | 內容 |
|------|------|------|
| 需求分析 | 30 分鐘 | 理解 OAuth、API 限制 |
| 初期開發 | 2 小時 | 實現 OAuth 流程 |
| 問題診斷 | 1 小時 | 發現 403 和 429 問題 |
| 架構優化 | 1.5 小時 | 後端部署、優化 API 調用 |
| 測試和修復 | 1 小時 | 修複語法錯誤、驗證功能 |

---

## 🎓 第六部分：個人心得與感悟

### 技術心得

1. **安全性優先**
   - 不要在前端存儲敏感信息（Client Secret）
   - PKCE 流程雖然複雜，但值得學習

2. **API 設計理解**
   - 充分了解 API 的數據結構，避免冗餘請求
   - Spotify 的 `/me/playlists` 已包含 `tracks.total`，無需額外調用

3. **問題排查方法**
   - 區分「代碼問題」和「API 限制」
   - 使用自動化工具（Node.js 驗證、grep 檢查）而不是依賴用戶反饋

4. **架構設計**
   - 前後端分離不只是代碼分離，更是責任分離
   - 無服務器函數非常適合小規模的中介服務

### 開發過程心得

1. **迭代很重要**
   - 初期方案（硬編碼 token）→ 中期方案（後端交換） → 最終方案（自動刷新）
   - 每個迭代都是有意義的進步

2. **自測非常重要**
   - 不應該等用戶發現 bug
   - 應該主動用工具驗證（Node.js、curl、grep）

3. **理解限制而非逃避**
   - HTTP 429 不是代碼 bug，而是設計問題
   - HTTP 403 不是代碼問題，而是 API 政策
   - 解決方案是避免不必要的請求，而不是繞過限制

4. **文檔很關鍵**
   - 記錄每個決定的理由（例如為什麼不申請生產模式）
   - 為下一個開發者留下清晰的注釋

### 如果重新開始

1. 一開始就會實現 Token 刷新機制（不會用硬編碼 token）
2. 會更早地分析 Spotify API 文檔，了解 `/me/playlists` 的完整數據結構
3. 會在本地環境先完整測試，再部署到生產環境

---

## 📖 第七部分：參考資源與延伸學習

### 使用的技術

- **前端：** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **後端：** Node.js, Vercel Functions
- **API：** Spotify Web API v1
- **認證：** OAuth 2.0 with PKCE
- **部署：** GitHub Pages + Vercel

### 推薦進一步學習

1. **OAuth 2.0 規範**
   - https://tools.ietf.org/html/rfc6749 (整個規範)
   - https://tools.ietf.org/html/rfc7636 (PKCE 詳細說明)

2. **Spotify API 文檔**
   - 完整端點列表和數據結構
   - Rate Limiting 政策
   - 生產模式申請流程

3. **Web 安全最佳實踐**
   - CSRF 防護
   - XSS 防護
   - Secure Storage

4. **無服務器架構**
   - Vercel Functions 進階用法
   - 環境變數管理
   - 部署優化

---

## ✨ 結論

這個項目雖然看似簡單，但涉及了現代 Web 開發的許多核心概念：
- 🔐 **安全認證**（OAuth + PKCE）
- 🏗️ **分層架構**（前端 + 後端 + API）
- 🔄 **狀態管理**（Token 刷新 + 持久化）
- ⚡ **性能優化**（減少 API 調用）
- 🧪 **質量保證**（自動化驗證）

最重要的收穫是：**優秀的軟件不是寫出來的，而是根據限制和約束一步步優化出來的**。

