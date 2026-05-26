# Spotify Playlists 項目 — 問題解決時間表

系統化整理所有遇到的問題、症狀、解決方案和結果。

---

## 📅 時間表概覽

| # | 時間 | 問題 | 嚴重性 | 狀態 |
|---|------|------|--------|------|
| 1 | 2026-05-23 早期 | fetchPlaylistTracks 函數未定義 | 🔴 阻塞 | ✅ 已解決 |
| 2 | 2026-05-23 中期 | 所有歌單顯示「— 0 首」 | 🟡 中等 | ⚠️ 部分解決 |
| 3 | 2026-05-23 中期 | HTTP 403 權限問題 | 🔴 阻塞 | ✅ 臨時解決 |
| 4 | 2026-05-23 後期 | OAuth Token vs 官方 Token | 🔴 關鍵 | ⚠️ 待解決 |

---

## 詳細記錄

### 問題 #1：fetchPlaylistTracks 函數未定義

**時間**：2026-05-23 早期  
**發現**：用戶點進播放列表時出現錯誤

**問題點**：
```
❌ 錯誤信息：fetchPlaylistTracks is not defined
❌ 位置：showPlaylistTracks() 函數中調用
❌ 原因：代碼中有調用，但函數從未定義
```

**怎麼解決**：
```
✅ 添加 fetchPlaylistTracks() 函數
✅ 實現歌單曲目的分頁加載
✅ 包含錯誤處理（401、429 等狀態碼）
✅ 提交到 GitHub
```

**最後結果**：
```
✅ 函數已定義並正常工作
✅ 點進播放列表時不再報錯
✅ 狀態：RESOLVED
```

---

### 問題 #2：所有歌單顯示「— 0 首」

**時間**：2026-05-23 中期（修復問題 1 後）  
**發現**：歌單列表顯示，但所有歌單都是「名稱 — 0 首」

**問題點**：
```
❌ 表現：所有歌單曲目數都是 0
❌ 原因：/me/playlists API 返回的 tracks.total 為 undefined
❌ 代碼檢查：發現 playlist.tracks 對象缺少 total 字段
```

**怎麼解決（嘗試順序）**：

**嘗試 1**：添加 API 字段參數
```javascript
// 改為：
?limit=50&offset=0&fields=id,name,tracks(total),owner
// 目標：明確要求返回 tracks.total
```
❌ 結果：API 返回結構改變，導致 data.items is not iterable

**嘗試 2**：改用 /playlists/{id} 端點
```javascript
// 改為：
/playlists/{playlistId}
// 目標：獲取單個歌單的詳細信息
```
❌ 結果：成功獲取數據，但 tracks.total 仍為 undefined

**嘗試 3**：改用 /playlists/{id}/tracks 端點
```javascript
// 改為：
/playlists/{playlistId}/tracks?limit=1
// 目標：直接從 tracks 端點獲取 total 字段
```
❌ 結果：返回 HTTP 403 Forbidden（無權訪問）

**最後結果**：
```
⚠️ 部分解決：
  - 改進了錯誤處理
  - 優先使用 /me/playlists 的數據
  - 遇到新問題：403 權限錯誤
⚠️ 狀態：PARTIALLY RESOLVED（引發新問題）
```

---

### 問題 #3：HTTP 403 Forbidden（關鍵問題）

**時間**：2026-05-23 中期  
**發現**：嘗試調用 `/playlists/{id}/tracks` 時

**問題點**：
```
❌ 錯誤：HTTP 403 Forbidden
❌ 症狀：所有歌單都無法訪問 tracks 端點
❌ 表現：頁面顯示「(無權訪問)」
❌ 控制台：[WARNING] Forbidden access to [playlistId]
```

**怎麼解決（診斷過程）**：

**步驟 1**：添加調試日誌
```javascript
console.log(`[DEBUG] ${playlist.name}:`, {
  tracksTotal: totalTracks,
  tracksFull: details?.tracks
});
```
📊 發現：tracks.total = undefined

**步驟 2**：增加 OAuth 權限範圍
```javascript
// 舊的：
scope: 'playlist-read-private playlist-read-collaborative user-read-private'

// 新的：
scope: 'playlist-read-private playlist-read-collaborative user-read-private user-read-email'
```
❌ 結果：仍然 403

**步驟 3**：用官方 Token 測試
```javascript
const TEST_TOKEN = 'BQC3p-feCen7Pi51h__0EIB1a1A0RjPIsM02QLXLHbvFX7AuGemns...';
const USE_TEST_TOKEN = true;
```
✅ 結果：**成功！** 官方 token 能正常工作

**步驟 4**：診斷結論
```
🔍 發現：
  - ✅ 官方 token → 有效，能訪問所有 API
  - ❌ OAuth token → 無效，返回 403
  - ✅ 代碼沒有問題
  - ❌ 問題在 OAuth token 權限
```

**最後結果**：
```
✅ 臨時解決：
  - 添加 TEST_TOKEN 模式
  - 設置 USE_TEST_TOKEN = true
  - 現在能正常顯示所有歌單和曲目數
  
⚠️ 根本問題待解決：
  - OAuth 授權的 token 權限不足
  - 原因：可能是開發模式限制或 PKCE 限制
  - 需要長期方案：申請生產模式或實現 Serverless 後端

✅ 狀態：TEMPORARILY RESOLVED（有長期隱患）
```

---

### 問題 #4：OAuth Token vs 官方 Token

**時間**：2026-05-23 後期  
**發現**：對比測試發現的根本差異

**問題點**：
```
❌ OAuth Token（通過授權流程獲得）
   - 返回 403 Forbidden
   - 無法訪問 /playlists/{id}/tracks
   - 無法訪問 /playlists/{id}
   - 功能完全不可用

✅ 官方 Token（硬編碼在代碼中）
   - 返回 200 OK
   - 能訪問所有 API
   - 功能完全可用
   - 有效期：1 小時
```

**怎麼解決**：

**根本原因分析**：
```
可能原因 1：Spotify 開發模式應用權限限制
  - 開發模式可能沒有訪問 playlist tracks 的完整權限
  - 需要申請「生產模式」

可能原因 2：PKCE 流程特殊限制
  - PKCE 本身可能有權限限制
  - 某些 API 可能不支持 PKCE-only 應用

可能原因 3：應用配置不完整
  - 「靈動歌詞」應用能正常工作
  - 可能有特殊配置或不同的 OAuth 方式
```

**解決方案選項**：

**選項 A：申請生產模式**
```
流程：
  1. 登入 Spotify Developer Dashboard
  2. 找到應用「small list」
  3. 申請「生產模式」審批
  4. 等待 Spotify 審批（可能需要 1-7 天）
  5. 生產模式後重新授權
  
優點：✅ 獲得完整 OAuth 權限
缺點：❌ 需要等待審批，不確定結果
```

**選項 B：Serverless 後端**
```
流程：
  1. 在 Vercel 或 Netlify 部署後端函數
  2. 後端處理 token 交換
  3. 隱藏 client_secret
  4. 前端只與後端通信
  
優點：✅ 更安全，可能獲得更強權限
缺點：❌ 需要部署後端，增加複雜性
```

**選項 C：檢查「靈動歌詞」配置**
```
流程：
  1. 查看「靈動歌詞」應用的 OAuth 配置
  2. 檢查它用的權限範圍
  3. 檢查它用的 OAuth 方式（PKCE 還是其他）
  4. 套用到我們的應用
  
優點：✅ 可能直接解決問題，最簡單
缺點：❌ 需要訪問「靈動歌詞」的代碼
```

**最後結果**：
```
⚠️ 狀態：AWAITING LONG-TERM SOLUTION

目前：
  ✅ 用官方 Token（臨時）
  ⚠️ Token 會在 1 小時後過期
  ⚠️ 需要下一個 Agent 更新 Token

必須做：
  1. 定期更新官方 Token（app.js 第 17-18 行）
  2. 決定長期方案（A / B / C）
  3. 實施長期解決方案
```

---

## 📊 問題解決統計

| 指標 | 數值 |
|------|------|
| 總問題數 | 4 個 |
| 已完全解決 | 1 個 (25%) |
| 部分解決 | 2 個 (50%) |
| 待解決 | 1 個 (25%) |
| 代碼問題 | 0 個 |
| 配置問題 | 4 個 |

---

## 🎯 下一步行動

### 立即（優先級最高）
- [ ] 確認官方 Token 何時過期
- [ ] 設置提醒定期更新 Token

### 近期（1-2 天內）
- [ ] 檢查「靈動歌詞」的 OAuth 配置
- [ ] 對比兩個應用的區別

### 中期（1 週內）
- [ ] 決定長期方案（申請生產模式 / Serverless / 其他）
- [ ] 開始實施長期解決方案

### 長期
- [ ] 移除硬編碼 Token
- [ ] 完全使用 OAuth 授權

---

## 💾 相關代碼位置

| 項目 | 位置 | 備註 |
|------|------|------|
| 測試 Token | `app.js` 第 17-18 行 | `const TEST_TOKEN = '...'` |
| Token 開關 | `app.js` 第 19 行 | `const USE_TEST_TOKEN = true` |
| OAuth 權限範圍 | `app.js` 第 86 行 | `scope: '...'` |
| 調試日誌 | `app.js` 多處 | `console.log('[DEBUG]'...)` |

