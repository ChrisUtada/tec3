// 🚀 游戏入口文件
import { initBaseTable } from './engine.js';
import { initModalDrag } from './shared.js';
import { initUIEvents } from './events.js';

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    console.log("T.E.C-OS // 纯卡牌因果规约终端已启动");
    
    // 初始化卡牌桌面
    initBaseTable();
    
    // 初始化所有 UI 事件绑定（替代 onclick）
    initUIEvents();
});