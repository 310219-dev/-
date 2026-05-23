# Spotify 歌單清單

## 功能

一個純前端的 Spotify 歌單清列應用，使用 OAuth 2.0 with PKCE 授權，讓使用者授權後列出所有歌單。

**格式**：每行顯示「歌單名稱 — 曲目數」

## 快速開始

### 1. Spotify Developer 設定

1. 登入 [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. 建立新應用
3. 複製 **Client ID**
4. 在 **Edit Settings** 中添加 Redirect URI：
   ```
   https://310219-dev.github.io/-/callback.html
   ```

### 2. 本地開發

```bash
# 使用 Python 靜態伺服器
cd frontend/public
python3 -m http.server 3000

# 或使用 Node.js serve
npm install -g serve
serve frontend/public -l 3000
```

訪問 `http://localhost:3000`

### 3. 部署到 GitHub Pages

1. Settings → Pages，選擇 `main` 分支
2. 訪問 `https://310219-dev.github.io/-/`

## 專案結構

```
.
├── frontend/public/
│   ├── index.html      # 主頁面
│   ├── callback.html   # OAuth 回調
│   └── app.js          # 核心邏輯
├── tests/frontend/
│   └── test_playlists.js   # 單元測試
└── specs/001-list-spotify-playlists/
    ├── spec.md         # 功能規格
    ├── plan.md         # 技術計劃
    └── tasks.md        # 任務清單
```

## 運行測試

```bash
npm install --save-dev jest
npm test tests/frontend/test_playlists.js
```

## 技術棧

- **前端**：HTML/CSS/JavaScript (ES2020+)
- **認證**：OAuth 2.0 with PKCE (RFC 7636)
- **API**：Spotify Web API
- **部署**：GitHub Pages

## 更多資訊

詳細的開發指南見 [DEVELOPMENT.md](DEVELOPMENT.md) 或 specs/ 目錄。
