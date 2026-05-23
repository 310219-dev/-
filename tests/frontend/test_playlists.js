/**
 * Test Suite: Spotify Playlists Parsing
 * 
 * Tests basic playlist parsing and rendering logic
 */

describe('Playlist Rendering', () => {
    // Mock 歌單數據
    const mockPlaylists = [
        {
            name: '我的最愛',
            tracks: { total: 42 }
        },
        {
            name: '運動時聽',
            tracks: { total: 28 }
        },
        {
            name: '工作專注',
            tracks: { total: 15 }
        }
    ];

    /**
     * 渲染歌單為文字（與 app.js 邏輯相同）
     */
    function renderPlaylists(playlists) {
        const lines = playlists.map(
            (pl) => `${pl.name} — ${pl.tracks.total} 曲`
        );
        return lines.join('\n');
    }

    test('應該正確渲染單個歌單', () => {
        const result = renderPlaylists([mockPlaylists[0]]);
        expect(result).toBe('我的最愛 — 42 曲');
    });

    test('應該正確渲染多個歌單', () => {
        const result = renderPlaylists(mockPlaylists);
        const expected = '我的最愛 — 42 曲\n運動時聽 — 28 曲\n工作專注 — 15 曲';
        expect(result).toBe(expected);
    });

    test('應該正確處理空歌單列表', () => {
        const result = renderPlaylists([]);
        expect(result).toBe('');
    });

    test('應該正確處理0曲歌單', () => {
        const result = renderPlaylists([
            { name: '空歌單', tracks: { total: 0 } }
        ]);
        expect(result).toBe('空歌單 — 0 曲');
    });

    test('應該正確處理特殊字符在歌單名稱中', () => {
        const result = renderPlaylists([
            { name: '日本アニメ & OST', tracks: { total: 100 } }
        ]);
        expect(result).toBe('日本アニメ & OST — 100 曲');
    });
});
