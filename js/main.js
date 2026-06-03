// 🚀 游戏入口文件
import { initBaseTable, syncModalAssets, resumeExploration } from './engine.js';
import { toggleEndingPanel } from './ui.js';
import { initModalDrag, toggleModal } from './shared.js';

// 挂载全局函数供 HTML 调用
window.syncModalAssets = syncModalAssets;
window.resumeExploration = resumeExploration;
window.toggleEndingPanel = toggleEndingPanel;
window.closeSceneModal = () => { document.getElementById('scene-modal').style.display = 'none'; };

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    console.log("T.E.C-OS // 纯卡牌因果规约终端已启动");
    initBaseTable();
});
