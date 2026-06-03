// 🎨 渲染层模块 - 集中管理所有 DOM 操作
import { CARD_TEMPLATES } from './config/cards.js';
import { gameState } from './state.js';

// 进度条相关 DOM 元素缓存
let progressContainer = null;
let progressFill = null;
let progressText = null;

/**
 * 显示堆叠进度条
 */
export function showStackProgressBar(x, y, delay) {
    // 惰性初始化 DOM 引用
    if (!progressContainer) {
        progressContainer = document.getElementById('stack-progress-container');
        progressFill = document.getElementById('stack-progress-fill');
        progressText = document.getElementById('stack-progress-text');
    }
    
    if (!progressContainer || !progressFill || !progressText) return;
    
    // 设置位置
    progressContainer.style.left = (x - 60) + 'px';
    progressContainer.style.top = y + 'px';
    progressContainer.style.display = 'flex';
    
    // 设置文字
    progressText.textContent = '因果具现中...';
    
    // 重置进度并启动动画
    progressFill.style.width = '0%';
    progressFill.style.transition = `width ${delay}ms linear`;
    setTimeout(() => {
        progressFill.style.width = '100%';
    }, 50);
}

/**
 * 隐藏堆叠进度条
 */
export function hideStackProgressBar() {
    if (!progressContainer) {
        progressContainer = document.getElementById('stack-progress-container');
    }
    if (progressContainer) {
        progressContainer.style.display = 'none';
    }
}

/**
 * 创建卡牌 DOM 元素
 */
export function createCardElement(card, { startDrag, updateQueryDisplay, openDialogue, openReasoningModal, openExploration, tryOpenComboLock, tryCapture, destroyCard, spawnUnboundCard }) {
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
        updateQueryDisplay(card, t);
        if (!card.isCaptured) { 
            if (tryCapture(card, cardEl)) { 
                e.stopPropagation(); 
                return; 
            } 
        }
        startDrag(e, card);
    });
    
    cardEl.addEventListener('dblclick', (e) => {
        e.stopPropagation();
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
        if (card.templateId === 'SCENES_hzyl') {
            cardEl.style.boxShadow = "0 0 15px rgba(255,255,255,0.6)";
        }
    } else {
        cardEl.style.opacity = "1";
        if (card.templateId === 'SCENES_hzyl') {
            cardEl.style.boxShadow = "0 4px 10px rgba(0,0,0,0.5)";
        }
    }

    cardEl.style.left = finalX + 'px'; 
    cardEl.style.top = finalY + 'px';
    cardEl.style.zIndex = zIndex;
}
