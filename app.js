/**
 * Spotify Playlists Lister - OAuth PKCE + API Integration
 * 
 * CONFIGURATION REQUIRED:
 * 1. CLIENT_ID: 從 https://developer.spotify.com/dashboard 取得
 * 2. REDIRECT_URI: 與 Spotify App 設定中的 Redirect URI 相同
 */

// ============ CONFIGURATION ============
// 👇 請在這裡填入您的 Spotify Client ID
const CLIENT_ID = '42b59981c4ac4e4d9fc0091d9cb1926b';

// 👇 請設定您的 Redirect URI（必須與 Spotify App 設定相同）
const REDIRECT_URI = 'https://310219-dev.github.io/-/callback.html';

// 測試 Token（用於快速測試，不經過 OAuth）
// 來自 Spotify 官方代碼示例
const TEST_TOKEN = 'BQDnKy0LXoHlJuYL2faIrra8xSlNxYAyYrNAB1unayLAtWFMaDUgbDogyUQP-MFiF1OPd83K8WZF2oeZnS45pMNqW73U1pZSF7lnMLhUQMthfefRobXWDOylEn03Drj0Bao43Hmx1e6wcl3PQjvI5A2v_vhDTTaR9VHXW-9zV3kUuGY8O4tL7yXk0YMTxfNEuN8ehYqcdHXFSWeLVPfeIT0s7jxn3KjkouGfwi3OtuBg-WtByvdhHsKyaCFswkoxYzc_MnDVSfCjB0ptPMUSaaxNC60oS1jY6UOA1_ty8T5-_QK0_HT9CQ7Jr3uWxQ-ucZ0kisrcow';
const USE_TEST_TOKEN = true; // 設為 true 來測試官方 token

// Spotify OAuth endpoints
const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_API_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// Storage keys
const STORAGE_ACCESS_TOKEN = 'spotify_access_token';
const STORAGE_STATE = 'oauth_state';
const STORAGE_CODE_VERIFIER = 'oauth_code_verifier';

// ============ PKCE HELPERS ============

/**
 * 生成隨機字符串用於 PKCE code_verifier
 */
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const characterLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characterLength));
    }
    return result;
}

/**
 * 從 string 生成 SHA256 hash 的 base64url 編碼
 */
async function generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * 生成狀態值（防止 CSRF）
 */
function generateState() {
    return generateRandomString(32);
}

// ============ OAUTH FLOW ============

/**
 * 啟動 Spotify OAuth 授權流程
 */
async function startOAuthFlow() {
    // 檢查設定
    if (CLIENT_ID === 'YOUR_CLIENT_ID_HERE') {
        showError('❌ 錯誤：請在 app.js 中設定 CLIENT_ID');
        return;
    }

    // 生成 PKCE 參數
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();

    // 保存 code_verifier 和 state
    sessionStorage.setItem(STORAGE_CODE_VERIFIER, codeVerifier);
    sessionStorage.setItem(STORAGE_STATE, state);

    // 構建授權 URL
    const authParams = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        scope: 'playlist-read-private playlist-read-collaborative user-read-private user-read-email',
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        state: state,
    });

    // 重導至 Spotify 授權頁面
    window.location.href = `${SPOTIFY_AUTH_ENDPOINT}?${authParams.toString()}`;
}

/**
 * 交換 authorization code 取得 access token
 */
async function exchangeCodeForToken(code) {
    const codeVerifier = sessionStorage.getItem(STORAGE_CODE_VERIFIER);

    if (!codeVerifier) {
        showError('❌ 找不到 code_verifier，請重新登入');
        return null;
    }

    try {
        const response = await fetch(SPOTIFY_API_TOKEN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                code_verifier: codeVerifier,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            showError(`❌ Token 交換失敗: ${error.error} - ${error.error_description}`);
            return null;
        }

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        showError(`❌ 網路錯誤: ${error.message}`);
        return null;
    }
}

// ============ SPOTIFY API CALLS ============

/**
 * 取得使用者信息
 */
async function fetchUserProfile(accessToken) {
    try {
        const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('取得使用者信息失敗:', error);
        throw error;
    }
}

/**
 * 取得使用者的所有歌單（分頁處理）
 */
async function fetchAllPlaylists(accessToken) {
    const playlists = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
        try {
            const response = await fetch(
                `${SPOTIFY_API_BASE}/me/playlists?limit=${limit}&offset=${offset}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );

            if (response.status === 401) {
                throw new Error('Unauthorized: Token 已過期或無效');
            }

            if (response.status === 429) {
                throw new Error('Too Many Requests: API 限流，請稍後重試');
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            playlists.push(...data.items);

            offset += limit;
            hasMore = data.next !== null;
        } catch (error) {
            console.error('取得歌單失敗:', error);
            throw error;
        }
    }

    return playlists;
}

/**
 * 取得歌單的所有曲目（分頁處理）
 */
async function fetchPlaylistTracks(accessToken, playlistId) {
    const tracks = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
        try {
            const response = await fetch(
                `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );

            if (response.status === 401) {
                throw new Error('Unauthorized: Token 已過期或無效');
            }

            if (response.status === 403) {
                throw new Error('Forbidden: 無權限訪問此歌單（可能是協作歌單或受限歌單）');
            }

            if (response.status === 429) {
                throw new Error('Too Many Requests: API 限流，請稍後重試');
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            tracks.push(...data.items);

            offset += limit;
            hasMore = data.next !== null;
        } catch (error) {
            console.error('取得曲目失敗:', error);
            throw error;
        }
    }

    return tracks;
}

// ============ STATE MANAGEMENT ============

let currentAccessToken = null;
let currentPlaylists = [];
let currentView = 'playlists'; // 'playlists' or 'tracks'
let currentPlaylistId = null;
let currentPlaylistName = '';

// ============ UI HELPERS ============

/**
 * 顯示錯誤訊息
 */
function showError(message) {
    const container = document.getElementById('errorContainer');
    container.innerHTML = `<div class="error">${message}</div>`;
    console.error(message);
}

/**
 * 取得歌單的曲目總數（使用 /me/playlists 返回的信息）
 */
async function getPlaylistTrackCount(accessToken, playlist) {
    try {
        // 直接從 playlist 對象中取 tracks.total
        const total = playlist.tracks?.total;
        
        if (total !== undefined && total !== null) {
            console.log(`[TRACK COUNT] ${playlist.name}: ${total} tracks (from /me/playlists)`);
            return total;
        }
        
        // 如果沒有，才嘗試調用 /playlists/{id}/tracks
        console.log(`[FALLBACK] Fetching tracks for ${playlist.id}...`);
        const response = await fetch(
            `${SPOTIFY_API_BASE}/playlists/${playlist.id}/tracks?limit=1`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (response.status === 403) {
            console.warn(`[WARNING] Forbidden access to ${playlist.id} - this playlist may have restricted access`);
            return -1; // -1 表示無權訪問
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const trackTotal = data.total || 0;
        console.log(`[TRACK COUNT] ${playlist.id}: ${trackTotal} tracks (from /playlists/{id}/tracks)`);
        return trackTotal;
    } catch (error) {
        console.error(`取得曲目數失敗 (${playlist.id}):`, error);
        return 0;
    }
}

/**
 * 顯示歌單清單（可點擊）
 */
async function displayPlaylists(accessToken, playlists) {
    const playlistList = document.getElementById('playlistList');
    const playlistHeader = document.querySelector('.playlist-header h2');
    
    playlistHeader.textContent = '您的歌單';
    playlistList.innerHTML = '';
    
    if (playlists.length === 0) {
        playlistList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">尚無歌單</div>';
        return;
    }
    
    for (const playlist of playlists) {
        // 先顯示歌單名稱
        const item = document.createElement('div');
        item.className = 'playlist-item';
        item.style.cursor = 'pointer';
        item.textContent = `${playlist.name} — 載入中...`;
        playlistList.appendChild(item);
        
        // 非同步取得曲目總數
        const totalTracks = await getPlaylistTrackCount(accessToken, playlist);
        
        // 更新顯示
        if (totalTracks === -1) {
            // 無權訪問
            item.textContent = `${playlist.name} — (無權訪問)`;
            item.style.opacity = '0.6';
            item.style.cursor = 'not-allowed';
        } else {
            item.textContent = `${playlist.name} — ${totalTracks} 首`;
            item.addEventListener('click', async () => {
                await showPlaylistTracks(accessToken, playlist.id, playlist.name);
            });
        }
    }
    
    currentView = 'playlists';
}

/**
 * 顯示歌單的曲目清單
 */
async function showPlaylistTracks(accessToken, playlistId, playlistName) {
    const playlistList = document.getElementById('playlistList');
    const playlistHeader = document.querySelector('.playlist-header h2');
    
    // 顯示載入狀態
    playlistList.innerHTML = '<div style="padding: 20px; text-align: center;">載入曲目中...</div>';
    playlistHeader.textContent = `${playlistName}`;
    
    try {
        const tracks = await fetchPlaylistTracks(accessToken, playlistId);
        
        playlistList.innerHTML = '';
        
        if (tracks.length === 0) {
            playlistList.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">此歌單無曲目</div>';
        } else {
            tracks.forEach((item) => {
                const track = item.track;
                if (track) {
                    const artists = track.artists.map(a => a.name).join(', ');
                    const trackItem = document.createElement('div');
                    trackItem.className = 'playlist-item';
                    trackItem.textContent = `${track.name} — ${artists}`;
                    playlistList.appendChild(trackItem);
                }
            });
        }
        
        // 顯示「返回」按鈕
        const returnBtn = document.createElement('div');
        returnBtn.style.padding = '15px 20px';
        returnBtn.style.textAlign = 'center';
        returnBtn.style.borderTop = '1px solid #f0f0f0';
        returnBtn.innerHTML = '<button id="returnBtn" style="padding: 8px 20px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 20px; cursor: pointer;">← 返回歌單列表</button>';
        playlistList.appendChild(returnBtn);
        
        document.getElementById('returnBtn').addEventListener('click', async () => {
            await displayPlaylists(accessToken, currentPlaylists);
        });
        
        currentView = 'tracks';
        currentPlaylistId = playlistId;
        currentPlaylistName = playlistName;
        
    } catch (error) {
        playlistList.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #d32f2f;">
                <div style="margin-bottom: 15px;">❌ 載入曲目失敗</div>
                <div style="margin-bottom: 20px; font-size: 14px; color: #666;">${error.message}</div>
                <button id="returnBtn" style="padding: 8px 20px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 20px; cursor: pointer;">← 返回歌單列表</button>
            </div>
        `;
        document.getElementById('returnBtn').addEventListener('click', async () => {
            await displayPlaylists(accessToken, currentPlaylists);
        });
        showError(`❌ 載入曲目失敗: ${error.message}`);
    }
}

/**
 * 渲染歌單清單為文字（備用）
 */
function renderPlaylists(playlists) {
    const lines = playlists.map((pl) => {
        const totalTracks = (pl.tracks && pl.tracks.total) ? pl.tracks.total : (pl.total || 0);
        return `${pl.name} — ${totalTracks} 首`;
    });
    return lines.join('\n');
}

/**
 * 登出
 */
function logout() {
    sessionStorage.removeItem(STORAGE_ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_CODE_VERIFIER);
    sessionStorage.removeItem(STORAGE_STATE);
    window.location.href = 'index.html';
}

// ============ MAIN INITIALIZATION ============
// Version: 2.0 - Interactive Playlist Explorer

document.addEventListener('DOMContentLoaded', async () => {
    const loginBtn = document.getElementById('loginBtn');
    const playlistContainer = document.getElementById('playlistContainer');
    const playlistList = document.getElementById('playlistList');
    const userDisplay = document.getElementById('userDisplay');

    // 【測試模式】如果啟用測試 Token，直接跳過 OAuth
    if (USE_TEST_TOKEN) {
        console.log('[TEST MODE] 使用官方提供的 access token 進行測試');
        const accessToken = TEST_TOKEN;
        currentAccessToken = accessToken;
        playlistContainer.style.display = 'block';
        playlistList.textContent = '載入中...';

        try {
            // 取得使用者信息
            const user = await fetchUserProfile(accessToken);
            userDisplay.textContent = user.display_name || user.email;

            // 取得所有歌單
            playlistList.textContent = '載入歌單中...';
            const playlists = await fetchAllPlaylists(accessToken);
            currentPlaylists = playlists;

            // 顯示交互式歌單列表
            await displayPlaylists(accessToken, playlists);
            
            // 在測試模式顯示提示
            const testModeNotice = document.createElement('div');
            testModeNotice.style.padding = '10px 20px';
            testModeNotice.style.background = '#fff3cd';
            testModeNotice.style.color = '#856404';
            testModeNotice.style.borderRadius = '4px';
            testModeNotice.style.marginTop = '10px';
            testModeNotice.textContent = '⚠️ 測試模式：使用官方 token 進行診斷';
            playlistContainer.appendChild(testModeNotice);
        } catch (error) {
            showError(`❌ 載入失敗: ${error.message}`);
        }

        loginBtn.addEventListener('click', startOAuthFlow);
        return; // 跳過下面的 OAuth 流程
    }

    // 檢查 URL 參數中是否有 error
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
        showError(`❌ 授權失敗: ${errorParam}`);
        return;
    }

    // 檢查是否有已保存的 access token
    let accessToken = sessionStorage.getItem(STORAGE_ACCESS_TOKEN);

    // 如果沒有 token，檢查是否有 code 可交換
    if (!accessToken) {
        const code = sessionStorage.getItem('oauth_code');
        if (code) {
            sessionStorage.removeItem('oauth_code'); // 清除已用的 code
            playlistList.textContent = '正在交換授權...';
            playlistContainer.style.display = 'block';

            accessToken = await exchangeCodeForToken(code);
            if (!accessToken) {
                playlistContainer.style.display = 'none';
                return;
            }

            // 保存 token
            sessionStorage.setItem(STORAGE_ACCESS_TOKEN, accessToken);
        }
    }

    // 如果有 token，載入歌單
    if (accessToken) {
        currentAccessToken = accessToken;
        playlistContainer.style.display = 'block';
        playlistList.textContent = '載入中...';

        try {
            // 取得使用者信息
            const user = await fetchUserProfile(accessToken);
            userDisplay.textContent = user.display_name || user.email;

            // 取得所有歌單
            playlistList.textContent = '載入歌單中...';
            const playlists = await fetchAllPlaylists(accessToken);
            currentPlaylists = playlists;

            // 顯示交互式歌單列表
            await displayPlaylists(accessToken, playlists);
        } catch (error) {
            if (error.message.includes('Unauthorized')) {
                playlistContainer.style.display = 'none';
                loginBtn.style.display = 'block';
                showError('❌ 授權已過期，請重新登入');
            } else {
                showError(`❌ 載入失敗: ${error.message}`);
            }
        }
    } else {
        // 未登入，顯示登入按鈕
        playlistContainer.style.display = 'none';
    }

    // 登入按鈕事件
    loginBtn.addEventListener('click', startOAuthFlow);
});
