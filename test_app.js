// 快速測試 app.js 是否能正常載入
const fs = require('fs');
const code = fs.readFileSync('app.js', 'utf8');

// 檢查基本結構
console.log('✓ 文件大小:', (code.length / 1024).toFixed(1), 'KB');
console.log('✓ 函数数量:', (code.match(/function|async/g) || []).length);
console.log('✓ 花括號:', code.match(/{/g).length, '個');
console.log('✓ 閉合括號:', code.match(/}/g).length, '個');

// 嘗試評估代碼
try {
  new Function(code);
  console.log('✓ 語法正確 - 沒有錯誤');
} catch (e) {
  console.log('✗ 語法錯誤:', e.message);
}
