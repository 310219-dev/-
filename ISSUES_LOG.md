# 問題記錄日誌 — Spotify Playlists 項目

按時間順序記錄遇到的問題、解決方案和結果。

---

## 問題 1：fetchPlaylistTracks 函數未定義
**時間**：2026-05-23 （早期）
**症狀**：點進播放列表時出現錯誤 `fetchPlaylistTracks is not defined`
**原因**：代碼中調用了 `fetchPlaylistTracks()` 但未定義此函數
**解決方案**：添加 `fetchPlaylistTracks()` 函數實現歌單曲目分頁加載
**結果**：✅ 解決 — 函數已添加並提交

---

## 問題 2：所有歌單顯示「— 0 首」
**時間**：2026-05-23（修復 1 後）
**症狀**：歌單列表顯示，但所有歌單都顯示為「名稱 — 0 首」
**原因**：`/me/playlists` API 返回的 `tracks.total` 為 null/undefined
**嘗試的解決方案**：
  1. 添加 `fields=id,name,tracks(total),owner` 參數 → ❌ 導致 API 返回結構改變
  2. 改用 `/playlists/{id}/tracks?limit=1` 端點 → ❌ 返回 HTTP 403
  3. 優先使用 `/me/playlists` 的 tracks.total → ❌ 仍為 undefined
**結果**：⚠️ 部分解決 — 改進了錯誤處理，但根本問題未解

---

## 問題 3：HTTP 403 Forbidden（關鍵問題）
**時間**：2026-05-23（中期）
**症狀**：所有 `/playlists/{id}/tracks` 請求都返回 HTTP 403
**原因**：**OAuth 授權獲取的 token 權限不足**
**診斷過程**：
  1. 添加控制台調試日誌
  2. 發現 `tracks.total: undefined`
  3. 嘗試調用 tracks 端點，得到 403
  4. 用官方提供的 token 測試 → ✅ 成功！
  5. 確認：**問題不在代碼，而在 OAuth token 權限**
**解決方案**：
  - 方案 A：添加測試 token 模式（臨時方案）✅ 有效
  - 方案 B：增加權限範圍 `user-read-email` → ❌ 無效
  - 方案 C：未嘗試 — Serverless 後端或申請生產模式
**結果**：✅ 臨時解決（用官方 token）⚠️ 根本解決需要後續處理

---

## 問題 4：OAuth Token vs 官方 Token
**時間**：2026-05-23（後期）
**發現**：
- 官方 token（BQC3p-...）✅ 完全有效
- OAuth token（通過授權流程獲取）❌ 返回 403
**原因推測**：
  - Spotify 對開發模式應用的權限限制
  - 或 PKCE 流程有特殊限制
  - 可能需要「生產模式」審批
**當前狀態**：使用官方 token 模式（臨時）

---

## 總結

| 問題 | 嚴重程度 | 狀態 | 備註 |
|------|--------|------|------|
| fetchPlaylistTracks 未定義 | 🔴 阻塞 | ✅ 已解決 | |
| tracks.total 為 0 | 🟡 中等 | ⚠️ 部分解決 | API 數據結構問題 |
| HTTP 403 權限 | 🔴 阻塞 | ✅ 臨時解決 | 用官方 token，需長期方案 |
| OAuth Token 權限不足 | 🔴 關鍵 | ⚠️ 待解決 | **下一個 agent 必須處理** |

