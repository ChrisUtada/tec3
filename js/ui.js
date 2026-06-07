// 📢 UI 交互与日志管理
import { gameState } from './state.js';

const logPanel = document.getElementById('log-panel'); // 已移除，保留引用以防报错
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
    sceneModal.classList.toggle('show', show);
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

// 真名卡信息窗口
const trueNameModal = document.getElementById('true-name-modal');

export function openTrueNameModal(card, template) {
    if (!trueNameModal) return;
    
    const titleEl = document.getElementById('true-name-title');
    const descEl = document.getElementById('true-name-desc');
    
    if (titleEl) {
        titleEl.innerText = template.realName || card.name;
    }
    if (descEl) {
        descEl.innerText = template.realDesc || template.desc;
    }
    
    trueNameModal.classList.add('show');
}

export function closeTrueNameModal() {
    if (trueNameModal) {
        trueNameModal.classList.remove('show');
    }
}

// 观测叙事弹窗
const observationModal = document.getElementById('observation-modal');

export function showObservationModal(cardName, text, dropInfo) {
    if (!observationModal) return;
    document.getElementById('observation-card-name').innerText = `「${cardName}」`;
    document.getElementById('observation-text').innerText = text;
    const dropDiv = document.getElementById('observation-drop-info');
    const dropSep = document.getElementById('observation-drop-divider');
    if (dropInfo) {
        dropDiv.innerText = dropInfo;
        dropDiv.style.display = '';
        dropSep.style.display = '';
    } else {
        dropDiv.innerText = '';
        dropDiv.style.display = 'none';
        dropSep.style.display = 'none';
    }
    observationModal.classList.add('show');
}

export function hideObservationModal() {
    if (observationModal) {
        observationModal.classList.remove('show');
    }
}

// 点击半透明背景关闭
if (observationModal) {
    observationModal.addEventListener('click', (e) => {
        if (e.target === observationModal) {
            hideObservationModal();
        }
    });
}

// 底部关闭按钮
const observationCloseBtn = document.getElementById('observation-close-btn');
if (observationCloseBtn) {
    observationCloseBtn.addEventListener('click', hideObservationModal);
}
