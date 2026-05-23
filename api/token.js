/**
 * Vercel Serverless Function - Spotify Token Exchange
 * 安全地交換授權碼為 Access Token
 * 
 * 使用環境變數存儲敏感信息（Client Secret）
 */

export default async function handler(req, res) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, redirectUri, codeVerifier } = req.body;

    // 驗證必要參數
    if (!code || !redirectUri || !codeVerifier) {
      return res.status(400).json({ error: 'Missing code, redirectUri, or codeVerifier' });
    }

    // 從環境變數獲取敏感信息
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing Spotify credentials in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // 準備 token 交換請求
    const tokenEndpoint = 'https://accounts.spotify.com/api/token';
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
      code_verifier: codeVerifier,  // 【重要】PKCE 流程所需
    });

    // 向 Spotify 交換 token
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
      console.error('Spotify token exchange error:', errorData);
      return res.status(tokenResponse.status).json({
        error: 'Failed to exchange token',
        details: errorData,
      });
    }

    // 解析並返回 token 數據
    const tokenData = await tokenResponse.json();
    
    // 新增安全標誌：該 token 來自後端，可以被前端安全使用
    return res.status(200).json({
      ...tokenData,
      // access_token: token 本身
      // token_type: 通常是 'Bearer'
      // expires_in: 秒數（通常 3600 = 1 小時）
      // refresh_token: 用於刷新 token
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
    });
  }
}
