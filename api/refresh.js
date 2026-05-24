/**
 * Vercel Serverless Function - Spotify Token Refresh
 * 用 refresh_token 獲取新的 access_token
 */

export default async function handler(req, res) {
  // 【重要】設置 CORS 頭允許跨域請求
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { refreshToken } = req.body;

    // 驗證必要參數
    if (!refreshToken) {
      return res.status(400).json({ error: 'Missing refreshToken' });
    }

    // 從環境變數獲取敏感信息
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing Spotify credentials in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // 準備 token 刷新請求
    const tokenEndpoint = 'https://accounts.spotify.com/api/token';
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    // 向 Spotify 刷新 token
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    // 檢查回應狀態
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Spotify token refresh error:', errorData);
      return res.status(tokenResponse.status).json({
        error: 'Failed to refresh token',
        details: errorData,
      });
    }

    // 解析並返回新的 token 數據
    const tokenData = await tokenResponse.json();
    
    return res.status(200).json({
      ...tokenData,
      // access_token: 新的 token
      // expires_in: 秒數（通常 3600）
      // refresh_token: 新的或舊的 refresh_token
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
    });
  }
}
