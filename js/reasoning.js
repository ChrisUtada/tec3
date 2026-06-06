//  逻辑归因推演系统
import { REASONING_ENDINGS, CARD_TEMPLATES } from './config.js';
import { log } from './ui.js';
import { showEndingReport } from './ui.js';
import { embedCardInSlot, restoreCardToBoard, isCardType, setupCardDragOut, closeOtherPanels } from './shared.js';

let reasoningPanel = null;
let reasoningSlots = [];
let slotContents = [null, null, null, null, null]; // 记录每个槽位的卡牌

//  保存推演 timeoutId，以便在关闭推演窗口时取消
let reasoningTimeoutId = null;

// 初始化 DOM 元素
function initReasoningElements() {
    if (!reasoningPanel) {
        reasoningPanel = document.getElementById('reasoning-panel');
        reasoningSlots = [
            document.getElementById('slot-0'),
            document.getElementById('slot-1'),
            document.getElementById('slot-2'),
            document.getElementById('slot-3'),
            document.getElementById('slot-4')
        ];
    }
    if (!reasoningPanel._cleanupAttached) {
        reasoningPanel.addEventListener('panelclosed', () => {
            if (reasoningTimeoutId) {
                clearTimeout(reasoningTimeoutId);
                reasoningTimeoutId = null;
                hideProgressBar();
                const executeBtn = document.getElementById('reasoning-execute-btn');
                const closeBtn = document.getElementById('reasoning-close-btn');
                if (executeBtn) executeBtn.disabled = false;
                if (closeBtn) closeBtn.disabled = false;
            }
            slotContents.forEach(cd => { if (cd) restoreCardToBoard(cd); });
            slotContents = [null, null, null, null, null];
            reasoningSlots.forEach((slot, i) => {
                slot.innerHTML = `<div class="slot-placeholder">线索槽位 ${i + 1}</div>`;
                slot.classList.remove('drag-over');
            });
        });
        reasoningPanel._cleanupAttached = true;
    }
}

// 打开归因推演窗口
export function openReasoningModal() {
    initReasoningElements();
    
    // 重置槽位
    slotContents = [null, null, null, null, null];
    reasoningSlots.forEach((slot, index) => {
        slot.innerHTML = `<div class="slot-placeholder">线索槽位 ${index + 1}</div>`;
        slot.classList.remove('drag-over');
    });
    
    // 禁用推演按钮
    const executeBtn = document.getElementById('reasoning-execute-btn');
    if (executeBtn) {
        executeBtn.disabled = true;
    }
    
    // 关闭其他面板后显示
    closeOtherPanels('reasoning-panel');
    reasoningPanel.classList.remove('panel-closing');
    reasoningPanel.style.display = 'flex';
    
    log(`🔮 [归因推演] 开启了归因推演仪`, "success");
}

// 关闭归因推演窗口
export function closeReasoningModal() {
    initReasoningElements();
    
    //  如果正在推演，取消推演任务
    if (reasoningTimeoutId) {
        clearTimeout(reasoningTimeoutId);
        reasoningTimeoutId = null;
        
        // 隐藏进度条
        hideProgressBar();
        
        // 恢复按钮状态
        const executeBtn = document.getElementById('reasoning-execute-btn');
        const closeBtn = document.getElementById('reasoning-close-btn');
        if (executeBtn) executeBtn.disabled = false;
        if (closeBtn) closeBtn.disabled = false;
        
        log(`⚠️ [归因推演中断] 推演已取消`, "normal");
    }
    
    // 恢复所有卡牌到桌面
    slotContents.forEach((cardData) => {
        if (cardData) {
            restoreCardToBoard(cardData);
        }
    });
    
    // 重置槽位
    slotContents = [null, null, null, null, null];
    reasoningSlots.forEach((slot, index) => {
        slot.innerHTML = `<div class="slot-placeholder">线索槽位 ${index + 1}</div>`;
        slot.classList.remove('drag-over');
    });
    
    reasoningPanel.classList.add('panel-closing');
    setTimeout(() => {
        reasoningPanel.style.display = 'none';
        reasoningPanel.classList.remove('panel-closing');
    }, 300);
    log(`🔮 [归因推演] 关闭了归因推演仪`, "normal");
}

// 将卡牌放入槽位
export function placeCardInReasoningSlot(cardData, slotIndex) {
    initReasoningElements();
    
    if (slotIndex < 0 || slotIndex > 4) {
        log(`❌ [归因推演] 无效的槽位索引`, "normal");
        return;
    }
    
    // 检查是否是线索卡牌
    if (!isCardType(cardData.templateId, 'clue')) {
        log(`❌ [归因推演] 只能放入线索卡牌！`, "normal");
        return;
    }
    
    // 如果槽位已有卡牌，先恢复旧卡牌
    if (slotContents[slotIndex]) {
        restoreCardToBoard(slotContents[slotIndex]);
    }
    
    // 保存新卡牌数据
    slotContents[slotIndex] = cardData;
    
    // 将卡牌移动到槽位中
    const cardEl = document.getElementById(cardData.instanceId);
    if (cardEl) {
        // 使用共享工具函数嵌入卡牌
        embedCardInSlot(cardEl, cardData, reasoningSlots[slotIndex]);
        
        // 使用共享工具函数添加拖出功能
        setupCardDragOut(cardEl, cardData, {
            slotIndex,
            slotsArray: slotContents,
            slotElement: reasoningSlots[slotIndex],
            placeholderText: `线索槽位 ${slotIndex + 1}`,
            onRemove: updateExecuteButton,
            logMessage: `归因推演：线索已从槽位 ${slotIndex + 1} 取出`
        });
    }
    
    // 更新推演按钮状态
    updateExecuteButton();
    
    const template = CARD_TEMPLATES[cardData.templateId];
    log(` [归因推演] 线索【${template.name}】已放入槽位 ${slotIndex + 1}`, "success");
}

// 更新推演按钮状态
function updateExecuteButton() {
    const executeBtn = document.getElementById('reasoning-execute-btn');
    if (executeBtn) {
        const hasClue = slotContents.some(slot => slot !== null);
        executeBtn.disabled = !hasClue;
    }
}

// 执行归因推演
export function executeReasoning() {
    initReasoningElements();
    
    // 收集所有线索
    const clues = slotContents.filter(slot => slot !== null);
    
    if (clues.length === 0) {
        log(`❌ [归因推演] 至少需要放入 1 条线索！`, "normal");
        return;
    }
    
    // 生成线索组合键（按字母顺序排序以确保一致性）
    const clueIds = clues.map(c => c.templateId).sort();
    const combinationKey = clueIds.join('+');
    
    log(`🔮 [归因推演] 正在推演线索组合：${combinationKey}`, "success");
    
    // 显示进度条
    showProgressBar();
    
    // 禁用按钮
    const executeBtn = document.getElementById('reasoning-execute-btn');
    const closeBtn = document.getElementById('reasoning-close-btn');
    if (executeBtn) executeBtn.disabled = true;
    if (closeBtn) closeBtn.disabled = true;
    
    // 5秒后显示结局
    reasoningTimeoutId = setTimeout(() => {
        // 查找匹配的结局
        let ending = REASONING_ENDINGS[combinationKey];
        if (!ending) {
            // 尝试查找单线索结局
            if (clues.length === 1) {
                ending = REASONING_ENDINGS[clueIds[0]];
            }
            // 使用默认结局
            if (!ending) {
                ending = REASONING_ENDINGS['default'];
            }
        }
        
        // 隐藏进度条
        hideProgressBar();
        
        // 显示结局报告
        showEndingReport(ending.title, ending.story);
        
        log(`✅ [归因推演] 推演完成！`, "success");
        
        // 恢复按钮状态
        if (executeBtn) executeBtn.disabled = false;
        if (closeBtn) closeBtn.disabled = false;
        
        // 关闭推演窗口
        closeReasoningModal();
    }, 5000);
}

// 显示进度条
function showProgressBar() {
    const container = document.getElementById('reasoning-progress-container');
    const hint = document.getElementById('reasoning-hint');
    const fill = document.getElementById('reasoning-progress-fill');
    const text = document.getElementById('reasoning-progress-text');
    
    if (container && hint) {
        container.style.display = 'flex';
        hint.style.display = 'none';
    }
    
    // 重置进度
    if (fill) fill.style.width = '0%';
    if (text) text.textContent = '0%';
    
    // 动画更新进度
    let progress = 0;
    const interval = setInterval(() => {
        progress += 2; // 每50ms增加2%，5秒完成
        if (progress > 100) progress = 100;
        
        if (fill) fill.style.width = progress + '%';
        if (text) text.textContent = progress + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
        }
    }, 50);
}

// 隐藏进度条
function hideProgressBar() {
    const container = document.getElementById('reasoning-progress-container');
    const hint = document.getElementById('reasoning-hint');
    
    if (container && hint) {
        container.style.display = 'none';
        hint.style.display = 'block';
    }
}

// 右侧面板固定定位，无需拖动
