// 🎨 渲染层模块 - 集中管理所有 DOM 操作
import { CARD_TEMPLATES } from './config/cards.js';
import { gameState } from './state.js';

// 存储当前显示的进度条
const activeProgressBars = {};

/**
 * 更新进度条位置（跟随卡牌移动）
 * @param {string} cardId - 卡牌实例ID
 */
export function updateProgressBarPosition(cardId) {
    const cardEl = document.getElementById(cardId);
    const progressContainer = activeProgressBars[cardId];
    
    if (!cardEl || !progressContainer) return;
    
    // 使用 DOM 元素的实际位置
    const cardLeft = parseInt(cardEl.style.left) || 0;
    const cardTop = parseInt(cardEl.style.top) || 0;
    const cardWidth = 115;
    const cardHeight = 150;
    
    // 更新进度条位置
    progressContainer.style.left = cardLeft + 'px';
    progressContainer.style.top = (cardTop + cardHeight + 10) + 'px';
    progressContainer.style.width = cardWidth + 'px';
}

/**
 * 创建并显示进度条（独立元素，显示在卡牌下方）
 * @param {string} cardId - 卡牌实例ID
 * @param {number} delay - 动画时长(ms)
 * @returns {boolean} - 是否成功显示
 */
export function showStackProgressBar(cardId, delay) {
    const cardEl = document.getElementById(cardId);
    if (!cardEl) {
        return false;
    }

    // 如果已经有该卡牌的进度条，先移除
    if (activeProgressBars[cardId]) {
        hideStackProgressBar(cardId);
    }

    const boardCanvas = document.getElementById('board-canvas');
    if (!boardCanvas) {
        console.error('[进度条] 未找到 board-canvas');
        return false;
    }

    //  使用 DOM 元素的 style.left/top（由 renderAllCards 设置）
    const cardLeft = parseInt(cardEl.style.left) || 0;
    const cardTop = parseInt(cardEl.style.top) || 0;

    // 卡牌尺寸
    const cardWidth = 115;
    const cardHeight = 150;
    
    // 创建进度条容器
    const progressContainer = document.createElement('div');
    progressContainer.className = 'card-progress-container';
    progressContainer.id = `progress-${cardId}`;
    progressContainer.innerHTML = `
        <div class="card-progress-bar">
            <div class="card-progress-fill"></div>
        </div>
        <div class="card-progress-text">因果具现中...</div>
    `;
    
    // 设置位置（使用 DOM 元素的实际位置）
    progressContainer.style.position = 'absolute';
    progressContainer.style.left = cardLeft + 'px';
    progressContainer.style.top = (cardTop + cardHeight + 10) + 'px';
    progressContainer.style.width = cardWidth + 'px';
    progressContainer.style.display = 'flex';
    progressContainer.style.zIndex = '9999';

    // 添加到 board-canvas
    boardCanvas.appendChild(progressContainer);

    // 获取进度条元素
    const progressFill = progressContainer.querySelector('.card-progress-fill');
    
    // 启动动画
    progressFill.style.width = '0%';
    progressFill.style.transition = `width ${delay}ms linear`;
    setTimeout(() => {
        progressFill.style.width = '100%';
    }, 50);
    
    // 保存引用
    activeProgressBars[cardId] = progressContainer;
    
    return true;
}

/**
 * 隐藏并移除进度条
 * @param {string} cardId - 卡牌实例ID
 */
export function hideStackProgressBar(cardId) {
    const progressContainer = activeProgressBars[cardId];
    if (progressContainer) {
        progressContainer.remove();
        delete activeProgressBars[cardId];
    }
}

/**
 * 创建卡牌 DOM 元素
 */
export function createCardElement(card, { startDrag, openDialogue, openReasoningModal, openExploration, tryOpenComboLock, tryCapture, destroyCard, spawnUnboundCard }) {
    const cardEl = document.createElement('div');
    cardEl.id = card.instanceId;
    const t = CARD_TEMPLATES[card.templateId];
    
    cardEl.className = `card ${t.class} ${card.isCaptured ? '' : 'unbound'}`;
    
    cardEl.innerHTML = `
        <div class="card-name">${t.name}</div>
        ${card.isCaptured ? '' : '<div class="card-status-tag">Datanodes 离线 [点选]</div>'}
        <div class="card-type-tag">${t.type}</div>
    `;
    
    cardEl.addEventListener('mousedown', (e) => {
        if (!card.isCaptured) { 
            if (tryCapture(card, cardEl)) { 
                e.stopPropagation(); 
                return; 
            } 
        }
        // 检查卡牌是否在槽位中，如果是则不触发全局拖拽系统
        if (cardEl.dataset.embedded === 'true') {
            return;
        }
        
        startDrag(e, card);
    });
    
    cardEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        
        // 检查卡牌是否在槽位中，如果是则不触发双击事件
        if (cardEl.dataset.embedded === 'true') {
            return;
        }
        
        const cardType = CARD_TEMPLATES[card.templateId].type;
        
        if (cardType === 'char') {
            openDialogue(card.templateId);
        } else if (cardType === 'logic') {
            openReasoningModal();
        } else if (cardType === 'scene') {
            openExploration(card.templateId);
        } else {
            tryOpenComboLock(card, destroyCard, spawnUnboundCard);
        }
    });
    
    return cardEl;
}

/**
 * 显示文案气泡（用于滋滋滋等特效）
 * @param {number} x - 气泡中心 X 坐标
 * @param {number} y - 气泡顶部 Y 坐标（卡牌上方）
 * @param {string} text - 气泡文字
 * @param {number} duration - 动画持续时间（ms），默认 2500
 */
export function showSpeechBubble(x, y, text, duration = 2500) {
    const bubble = document.getElementById('speech-bubble');
    const bubbleText = document.getElementById('speech-bubble-text');
    if (!bubble || !bubbleText) return;

    // 更新动画时长
    bubbleText.style.animation = 'none';
    void bubbleText.offsetWidth; // 强制重绘
    bubbleText.style.animation = `speechFade ${duration}ms ease-in-out forwards`;
    bubbleText.textContent = text;

    // 居中定位在目标卡牌上方
    bubble.style.left = (x - 60) + 'px';
    bubble.style.top = (y - 40) + 'px';
    bubble.style.display = 'flex';
}

/**
 * 隐藏文案气泡
 */
export function hideSpeechBubble() {
    const bubble = document.getElementById('speech-bubble');
    if (bubble) {
        bubble.style.display = 'none';
    }
}

/**
 * 更新卡牌 DOM 元素样式
 */
export function updateCardElementStyle(cardEl, card, finalX, finalY, zIndex) {
    // 结局触发时的卡牌高亮修饰
        if (gameState.isGameOver) {
            cardEl.style.opacity = "0.85";
        } else {
            cardEl.style.opacity = "1";
        }

    cardEl.style.left = finalX + 'px'; 
    cardEl.style.top = finalY + 'px';
    cardEl.style.zIndex = zIndex;
}
