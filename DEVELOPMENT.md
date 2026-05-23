# 開發指南 — Spotify 歌單清列

詳細的開發與測試指南。

## 前置準備

### 1. 取得 Spotify Client ID

1. 登入 [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. 建立新應用或選擇現有應用
3. 同意開發者條款
4. 複製 **Client ID**

### 2. 設定 Redirect URI

在應用設定中添加：
```
https://310219-dev.github.io/-/callback.html
```

## 本地開發

### 方式 1：Python 靜態伺服器

```bash
cd frontend/public
python3 -m http.server 3000
```

然後訪問 `http://localhost:3000`

### 方式 2：Node.js serve

```bash
npm install -g serve
serve frontend/public -l 3000
```

## OAuth 2.0 with PKCE 流程

### 架構圖

```
┌──────────────┐
│ 使用者       │
└──────┬───────┘
       │ 1. 點擊「登入」
       ▼
┌──────────────┐         ┌─────────────┐
│ index.html   │────────▶│   Spotify   │
│ (app.js)     │ 2. 重導 │  授權頁面   │
└──────┬───────┘         └──────┬──────┘
       │                        │
       │ 4. 重導 (code+state)   │
       │◀───────────────────────┘
       │ 3. 使用者授權
       ▼
┌──────────────┐
│ callback.html│
│ 驗證 state   │
│ 存 code      │
└──────┬───────┘
       │ 5. 重導回 index.html
       ▼
┌──────────────┐         ┌─────────────┐
│ index.html   │────────▶│   Spotify   │
│ 交換 token   │ 6. POST  │  Token      │
└──────┬───────┘ code+   │  Endpoint   │
       │         verif.  └──────┬──────┘
       │ 7. Access Token        │
       │◀───────────────────────┘
       ▼
┌──────────────┐         ┌─────────────┐
│ index.html   │────────▶│   Spotify   │
│ 呼叫 API     │ 8. GET   │  Web API    │
│ 顯示歌單     │ /me/     │             │
└──────────────┘ playlists└─────────────┘
```

## 程式碼流程

### app.js 初始化

```javascript
1. DOMContentLoaded 事件觸發
2. 檢查 URL 中是否有 error 參數
3. 檢查 sessionStorage 中是否有 access_token
   ├─ 有：直接載入歌單
   └─ 無：檢查是否有 oauth_code
       ├─ 有：交換 token
       └─ 無：顯示登入按鈕
```

### OAuth 授權流程

```javascript
startOAuthFlow()
├─ 生成 code_verifier（128 字符）
├─ 生成 code_challenge = SHA256(code_verifier)
├─ 生成 state（防止 CSRF）
├─ 儲存到 sessionStorage
└─ 重導到 Spotify 授權頁面
```

### Token 交換

```javascript
exchangeCodeForToken(code)
├─ 取得 sessionStorage 中的 code_verifier
├─ 發送 POST 到 /api/token
│  └─ 參數：client_id, code, redirect_uri, code_verifier
├─ 取得 access_token
└─ 儲存到 sessionStorage
```

### API 呼叫

```javascript
fetchAllPlaylists(token)
├─ offset = 0, limit = 50
├─ 迴圈：
│  ├─ 呼叫 GET /v1/me/playlists?limit=50&offset={offset}
│  ├─ 檢查 response.next
│  ├─ offset += 50
│  └─ 如無下一頁則退出
└─ 返回所有歌單陣列
```

## 錯誤處理

### 常見錯誤

| 錯誤 | 原因 | 解決方法 |
|------|------|--------|
| `state_mismatch` | CSRF 攻擊或 sessionStorage 清除 | 重新授權 |
| 401 Unauthorized | Token 過期 | 清除 token，重新授權 |
| 429 Too Many Requests | API 限流 | 等待後重試 |
| CORS 錯誤 | 跨域請求被阻止 | Spotify API 應支持 CORS |

### 錯誤訊息格式

在 `index.html` 中：
```html
<div id="errorContainer"></div>
```

在 `app.js` 中：
```javascript
showError('❌ 錯誤描述')
```

## 測試

### 單元測試

```bash
# 安裝 Jest
npm install --save-dev jest

# 運行測試
npm test tests/frontend/test_playlists.js

# 監看模式
npm test -- --watch

# 涵蓋率報告
npm test -- --coverage
```

### 手動測試清單

**授權流程**
- [ ] 點擊「登入 Spotify」
- [ ] 重導到 Spotify 授權頁面
- [ ] 授權應用
- [ ] 重導回應用並顯示歌單

**歌單顯示**
- [ ] 歌單按照「名稱 — 曲目數」格式顯示
- [ ] 多於 50 首歌單時能正確分頁
- [ ] 空歌單顯示為「0 首」

**登出功能**
- [ ] 點擊「登出」按鈕
- [ ] 清除 token
- [ ] 顯示登入按鈕
- [ ] 刷新頁面後仍顯示登入按鈕

**錯誤情況**
- [ ] Token 過期時能重新授權
- [ ] 授權失敗時顯示錯誤訊息
- [ ] 網路斷開時友善提示

## 部署到 GitHub Pages

### 步驟

1. **推送代碼**
   ```bash
   git add .
   git commit -m "feat: Phase 1 完成 - OAuth + 歌單列表"
   git push origin 001-list-spotify-playlists
   ```

2. **啟用 GitHub Pages**
   - 進入 Repository Settings
   - 找到 Pages 選項
   - Branch: `main`
   - Folder: `/ (root)`
   - Save

3. **驗證部署**
   - 訪問 `https://310219-dev.github.io/-/`
   - 檢查所有功能是否正常

### GitHub Pages 特別注意

- 部署通常需要 1-2 分鐘
- 確保 Redirect URI 在 Spotify 應用中正確設定
- 推送後可在 Repository → Deployments 查看部署歷史

## 效能優化

### 目前實現

- ✅ 分頁處理（最多 200 個歌單在 5 秒內載入）
- ✅ 使用 `sessionStorage` 保存 token（無持久化）
- ✅ 單一頁面應用（無額外頁面加載）

### 可選優化（未來）

- [ ] 加入加載進度指示
- [ ] 搜索和過濾歌單
- [ ] 排序選項（按名稱、曲目數）
- [ ] 複製清單到剪貼板
- [ ] 暗黑模式

## 安全性考慮

### 已實現

✅ **PKCE (RFC 7636)**
- 授權碼無法直接交換，需要 code_verifier
- 防止授權碼攔截

✅ **State 驗證**
- 防止 CSRF 攻擊
- 確認重導來自 Spotify

✅ **Token 保存**
- 僅保存在 `sessionStorage`（瀏覽器關閉後清除）
- 未保存到 `localStorage`（避免 XSS 持久化）
- 無服務器端 storage

### 注意事項

⚠️ **Client ID 公開**
- Client ID 本身不是敏感資訊
- 無 Client Secret（不需要）
- 限制 Redirect URI 到特定域名

⚠️ **Token 洩露**
- 如果 token 被盜用，可能被用來存取使用者的歌單
- Token 有效期限為 1 小時

### 長期改進（可選）

如需更高的安全性：
1. 建立後端伺服器処理 token 交換（可見 Task 4.2）
2. 實現 refresh token 刷新機制
3. 使用 httpOnly cookie 保存 token

## 除錯技巧

### 瀏覽器開發者工具

```javascript
// 檢查 sessionStorage
sessionStorage.getItem('spotify_access_token')
sessionStorage.getItem('oauth_code')
sessionStorage.getItem('oauth_state')

// 檢查已保存的配置
console.log('Client ID:', CLIENT_ID)
console.log('Redirect URI:', REDIRECT_URI)

// 清除所有 session
sessionStorage.clear()
```

### 常用 console 命令

```javascript
// 查看所有 sessionStorage 項目
Object.keys(sessionStorage).forEach(key => {
    console.log(key, sessionStorage.getItem(key))
})

// 模擬授權失敗
window.location.href = 'http://localhost:3000/index.html?error=access_denied'

// 檢查網路請求
// 開啟 DevTools → Network 標籤
// 監看 token 交換和 API 呼叫
```

## 常見問題

### Q：為什麼我看不到歌單？

**A：**
1. 確認已完成授權
2. 檢查瀏覽器 DevTools Console 中的錯誤
3. 確認 Spotify 帳戶確實有歌單
4. 檢查授權範圍是否包含 `playlist-read-private`

### Q：Token 交換失敗怎麼辦？

**A：**
1. 檢查 `code_verifier` 是否正確儲存
2. 檢查 Redirect URI 是否與設定相符
3. 檢查 URL 中是否有 `code` 參數
4. 查看網路請求的詳細錯誤訊息

### Q：如何重設授權？

**A：**
```javascript
// 在瀏覽器 DevTools Console 執行
sessionStorage.clear()
location.reload()
```

## 資源連結

- [Spotify Web API 文件](https://developer.spotify.com/documentation/web-api)
- [OAuth 2.0 PKCE 說明](https://tools.ietf.org/html/rfc7636)
- [Spotify API 示例](https://github.com/spotify/web-api-examples)
- [MDN Web Docs - Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [MDN Web Docs - sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
