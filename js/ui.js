// 📢 UI 交互与日志管理
import { gameState } from './state.js';

const logPanel = document.getElementById('log-panel'); // 已移除，保留引用以防报错
const queryContent = document.getElementById('query-content');
const systemStatus = document.getElementById('system-status-indicator');
const endingPanel = document.getElementById('ending-report-panel');
const sceneModal = document.getElementById('scene-modal');

export function log(message, type = 'normal') {
    // 日志面板已移除，仅输出到控制台
    console.log(`[${type}] ${message}`);
    
    // 如果将来需要恢复日志功能，可以取消下面的注释
    /*
    if (logPanel) {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `[${new Date().toLocaleTimeString()}] ${message}`;
        logPanel.appendChild(entry);
        logPanel.scrollTop = logPanel.scrollHeight;
    }
    */
}

export function updateQueryDisplay(card, template) {
    if (!card || !template) return;
    const status = card.isCaptured 
        ? "<span style='color:var(--color-vision)'>[Datanodes 固化就绪]</span>" 
        : "<span style='color:var(--color-taste);font-weight:bold'>[未存入 Datanodes - 请单击卡面执行捕获]</span>";
    
    queryContent.innerHTML = `
        <strong>标识符:</strong> ${card.templateId}<br>
        <strong>因果形态:</strong> ${template.type.toUpperCase()}<br>
        <strong>状态判定:</strong> ${status}<br>
        <strong>底层描述:</strong><br>${template.desc}
    `;
}

export function setSystemStatus(text, color) {
    systemStatus.innerHTML = text;
    systemStatus.style.color = color || 'var(--color-vision)';
}

export function toggleEndingPanel(minimize) {
    if (minimize) {
        endingPanel.classList.add('minimized');
        document.getElementById('ending-toggle-icon').innerText = "[+] 展开报告";
    } else {
        endingPanel.classList.remove('minimized');
        document.getElementById('ending-toggle-icon').innerText = "[-] 最小化";
    }
}

export function showEndingReport(title, story) {
    document.getElementById('ending-title-text').innerText = title;
    document.getElementById('ending-body-text').innerText = story;
    endingPanel.style.display = 'flex';
    toggleEndingPanel(false);
}

export function hideEndingReport() {
    endingPanel.style.display = 'none';
}

export function toggleSceneModal(show) {
    sceneModal.style.display = show ? 'flex' : 'none';
}

export function updateModalContent(title, body, btnText, disabled) {
    document.getElementById('modal-title-text').innerText = title;
    document.getElementById('modal-body-text').innerText = body;
    const btn = document.getElementById('modal-action-btn');
    if (btn) {
        btn.innerText = btnText || "同步当前坐标实体到桌面上";
        btn.disabled = disabled !== undefined ? disabled : false;
    }
}
