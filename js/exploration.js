// 🌍 场景探索系统
import { SCENE_EXPLORATION, CARD_TEMPLATES } from './config.js';
import { log } from './ui.js';
import { showStackProgressBar, hideStackProgressBar } from './logic.js';
import { embedCardInSlot, restoreCardToBoard, initModalDrag } from './shared.js';

// 从 engine.js 获取 spawnUnboundCard 函数
let spawnCard = null;
let getCardsData = null;

// 初始化时获取 spawnCard 函数
export function initExplorationModule(spawnFn, cardsDataFn) {
    spawnCard = spawnFn;
    getCardsData = cardsDataFn;
}

let currentScene = null;  // 当前场景 templateId
let explorationSlots = [];  // 槽位中的卡牌数据
let isExploring = false;  // 是否正在探索中
let draggedCardData = null;  // 记录被拖入的卡牌数据
let highlightedCards = new Set();  // 高亮卡牌的 ID 集合

// 延迟获取 DOM 元素
let explorationModal, explorationTitle, explorationSlotsContainer, explorationProgress, explorationProgressFill, explorationProgressText, explorationInfo, startBtn, closeBtn;

function initExplorationElements() {
    if (!explorationModal) {
        explorationModal = document.getElementById('exploration-modal');
        explorationTitle = document.getElementById('exploration-title');
        explorationSlotsContainer = document.getElementById('exploration-slots');
        explorationProgress = document.getElementById('exploration-progress');
        explorationProgressFill = document.getElementById('exploration-progress-fill');
        explorationProgressText = document.getElementById('exploration-progress-text');
        explorationInfo = document.getElementById('exploration-info');
        startBtn = document.getElementById('exploration-start-btn');
        closeBtn = document.getElementById('exploration-close-btn');
    }
}

// 打开场景探索窗口
export function openExploration(sceneId) {
    initExplorationElements();
    
    if (!SCENE_EXPLORATION[sceneId]) {
        log(`❌ [探索系统] 未找到该场景的探索数据`, "normal");
        return;
    }

    currentScene = sceneId;
    const sceneData = SCENE_EXPLORATION[sceneId];
    
    // 初始化槽位数组为 null
    explorationSlots = new Array(sceneData.slots).fill(null);
    isExploring = false;
    draggedCardData = null;

    explorationTitle.innerText = `探索【${sceneData.name}】`;
    
    // 生成槽位
    explorationSlotsContainer.innerHTML = '';
    for (let i = 0; i < sceneData.slots; i++) {
        const slot = document.createElement('div');
        slot.className = 'exploration-slot';
        slot.dataset.slotIndex = i;
        slot.innerHTML = `<div class="exploration-slot-placeholder">槽位 ${i + 1}</div>`;
        explorationSlotsContainer.appendChild(slot);
        
        // 设置拖放事件
        setupSlotDrop(slot, i);
    }
    
    // 重置进度条和按钮
    explorationProgress.style.display = 'none';
    explorationProgressFill.style.width = '0%';
    explorationInfo.innerText = `将人物、物品或线索拖入上方 ${sceneData.slots} 个槽位，然后点击"探索"按钮。`;
    startBtn.style.display = 'inline-block';
    startBtn.disabled = false;
    closeBtn.style.display = 'none';

    // 显示弹窗
    explorationModal.style.display = 'flex';
    
    // 初始化弹窗拖动
    initExplorationDrag();
    
    log(`🌍 [探索系统] 开启了【${sceneData.name}】的探索`, "success");
}

// 关闭探索窗口
export function closeExplorationModal() {
    initExplorationElements();
    
    explorationModal.style.display = 'none';
    
    // 恢复桌面上的卡牌
    explorationSlots.forEach((cardData) => {
        if (cardData) {
            restoreCardToBoard(cardData);
        }
    });
    
    // 恢复被拖入的卡牌
    if (draggedCardData) {
        restoreCardToBoard(draggedCardData);
        draggedCardData = null;
    }
    
    currentScene = null;
    explorationSlots = [];
    isExploring = false;
    
    log(` [探索系统] 关闭了探索窗口`, "normal");
}

// 设置卡牌拖出功能
function setupCardDragOut(cardEl, cardData, slotIndex) {
    let isDragging = false;
    let startX, startY;
    
    cardEl.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        if (isExploring) return;
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        cardEl.classList.remove('embedded');
        cardEl.style.cursor = 'grabbing';
        
        e.preventDefault();
        e.stopPropagation();
    });
    
    const moveHandler = (e) => {
        if (!isDragging) return;
        
        const diffX = e.clientX - startX;
        const diffY = e.clientY - startY;
        
        if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
            // 使用共享工具函数恢复卡牌
            restoreCardToBoard(cardData);
            
            // 清除槽位数据
            explorationSlots[slotIndex] = null;
            draggedCardData = null;
            
            // 重置槽位
            const slotElement = explorationSlotsContainer.children[slotIndex];
            slotElement.innerHTML = `<div class="exploration-slot-placeholder">槽位 ${slotIndex + 1}</div>`;
            slotElement.classList.remove('drag-over');
            
            log(`🔄 [探索系统] 卡牌已从槽位取出`, "normal");
            
            // 移除事件监听
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
        }
    };
    
    const upHandler = () => {
        if (isDragging) {
            isDragging = false;
            cardEl.classList.add('embedded');
            cardEl.style.cursor = 'grab';
        }
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
}

// 设置槽位鼠标事件
function setupSlotDrop(slotElement, slotIndex) {
    // 监听鼠标悬停
    slotElement.addEventListener('mouseenter', () => {
        if (!isExploring && !explorationSlots[slotIndex]) {
            slotElement.classList.add('drag-over');
        }
    });
    
    slotElement.addEventListener('mouseleave', () => {
        slotElement.classList.remove('drag-over');
    });
}

// 将卡牌放入槽位
export function placeCardInExplorationSlot(cardData, slotIndex) {
    initExplorationElements();
    
    console.log('[放置卡牌] 当前槽位状态:', explorationSlots);
    console.log('[放置卡牌] 请求的槽位索引:', slotIndex);
    
    if (!currentScene || isExploring) {
        console.log('[放置卡牌] 拒绝：场景未打开或正在探索中');
        return;
    }
    
    if (slotIndex === undefined || slotIndex === null) {
        // 自动找到第一个空槽位
        slotIndex = explorationSlots.findIndex(slot => slot === null || slot === undefined);
        console.log('[放置卡牌] 自动找到槽位索引:', slotIndex);
        if (slotIndex === -1) {
            log(` [探索系统] 所有槽位已满`, "normal");
            return;
        }
    }

    const templateId = cardData.templateId;
    const template = CARD_TEMPLATES[templateId];

    explorationSlots[slotIndex] = cardData;
    draggedCardData = cardData;  // 保存卡牌数据

    // 将卡牌移动到槽位中
    const cardEl = document.getElementById(cardData.instanceId);
    if (cardEl) {
        const slotElement = explorationSlotsContainer.children[slotIndex];
        
        // 使用共享工具函数嵌入卡牌
        embedCardInSlot(cardEl, cardData, slotElement);
        
        // 添加拖出功能
        setupCardDragOut(cardEl, cardData, slotIndex);
    }

    log(` [探索系统] 将【${template.name}】放入槽位 ${slotIndex + 1}`, "success");
}

// 供 HTML 调用的全局函数 - 接收从桌面拖入的卡牌
window.receiveCardForExploration = function(cardData) {
    placeCardInExplorationSlot(cardData);
};

// 开始探索
export function startExploration() {
    initExplorationElements();
    
    if (!currentScene || isExploring) {
        return;
    }

    const sceneData = SCENE_EXPLORATION[currentScene];
    
    // 检查是否有卡牌放入
    const hasCards = explorationSlots.some(slot => slot !== null && slot !== undefined);
    if (!hasCards) {
        log(` [探索系统] 请至少放入一张卡牌再开始探索`, "normal");
        return;
    }

    isExploring = true;
    startBtn.disabled = true;
    
    // 显示进度条
    explorationProgress.style.display = 'flex';
    explorationProgressText.innerText = sceneData.message;
    
    // 启动进度条动画
    explorationProgressFill.style.width = '0%';
    explorationProgressFill.style.transition = `width ${sceneData.exploreTime}ms linear`;
    
    setTimeout(() => {
        explorationProgressFill.style.width = '100%';
    }, 50);
    
    log(` [探索系统] 开始探索【${sceneData.name}】，预计 ${sceneData.exploreTime / 1000} 秒`, "success");
    
    // 探索完成后处理掉落
    setTimeout(() => {
        completeExploration(sceneData);
    }, sceneData.exploreTime);
}

// 完成探索
function completeExploration(sceneData) {
    isExploring = false;
    
    // 隐藏进度条
    explorationProgress.style.display = 'none';
    
    // 消耗槽位中的卡牌（根据 consumable 属性）
    explorationSlots.forEach((cardData, index) => {
        if (cardData) {
            const template = CARD_TEMPLATES[cardData.templateId];
            if (template && template.consumable) {
                log(`🗑️ [探索系统] 【${template.name}】在探索中被消耗`, "normal");
                const cardEl = document.getElementById(cardData.instanceId);
                if (cardEl) {
                    cardEl.remove();
                }
            } else if (template) {
                log(`✅ [探索系统] 【${template.name}】保留`, "success");
                // 将不可消耗的卡牌移回桌面
                const cardEl = document.getElementById(cardData.instanceId);
                if (cardEl) {
                    const boardCanvas = document.getElementById('board-canvas');
                    boardCanvas.appendChild(cardEl);
                    cardEl.style.position = 'absolute';
                    cardEl.style.width = '115px';
                    cardEl.style.height = '150px';
                    cardEl.classList.remove('embedded');
                }
            }
        }
    });
    
    // 清空槽位数据
    explorationSlots = [];
    
    // 根据概率计算掉落
    const drops = calculateDrops(sceneData.drops);
    console.log('[探索掉落] 计算的掉落:', drops);
    
    // 计算生成位置（在画布中央）
    const boardCanvas = document.getElementById('board-canvas');
    const boardRect = boardCanvas.getBoundingClientRect();
    const centerX = boardRect.width / 2;
    const centerY = boardRect.height / 2;
    
    // 直接生成掉落物（探索窗口内部已有进度条，不需要额外的堆叠进度条）
    let actualDrops = 0;  // 实际生成的数量
        
    drops.forEach((drop, index) => {
        // 扇形分布生成位置
        const offsetX = (index - (drops.length - 1) / 2) * 140;
        const spawnX = centerX + offsetX;
        const spawnY = centerY;
                
        // 生成新卡牌
        const template = CARD_TEMPLATES[drop.templateId];
        if (template && spawnCard) {
            // 探索掉落允许重复生成，传入 allowDuplicate = true
            const cardData = spawnCard(drop.templateId, spawnX, spawnY, true);
                
            // 添加高亮效果
            if (cardData) {
                highlightDroppedCard(cardData.instanceId);
            }
                
            log(`✨ [探索掉落] ${drop.message}`, "success");
            actualDrops++;
        } else if (!spawnCard) {
            log(`❌ [探索系统] spawnCard 函数未初始化`, "normal");
        }
    });
        
    // 显示提示信息
    explorationInfo.innerText = `探索完成！共获得 ${actualDrops} 个物品。`;
        
    log(`✅ [探索系统] 探索完成，共获得 ${actualDrops} 个掉落物`, "success");
    
    // 延迟1秒后自动关闭探索窗口（让用户看到掉落结果）
    setTimeout(() => {
        closeExplorationModal();
    }, 1000);
}

// 计算掉落
function calculateDrops(dropsConfig) {
    const results = [];
    
    dropsConfig.forEach(drop => {
        // 随机判定是否掉落
        if (Math.random() < drop.chance) {
            results.push(drop);
        }
    });
    
    // 至少掉落1个（如果所有概率都没中）
    if (results.length === 0 && dropsConfig.length > 0) {
        const randomDrop = dropsConfig[Math.floor(Math.random() * dropsConfig.length)];
        results.push(randomDrop);
        log(`🎲 [探索系统] 保底掉落：${randomDrop.message}`, "normal");
    }
    
    return results;
}

// 初始化弹窗拖动功能
function initExplorationDrag() {
    // 探索中不允许拖动
    initModalDrag(explorationModal, () => isExploring);
}

// 供 HTML onclick 调用的全局函数
window.closeExplorationModal = closeExplorationModal;
window.startExploration = startExploration;

// 🌟 高亮掉落卡牌
export function highlightDroppedCard(cardInstanceId) {
    const cardEl = document.getElementById(cardInstanceId);
    if (!cardEl) return;
    
    // 添加高亮类名
    cardEl.classList.add('dropped-highlight');
    highlightedCards.add(cardInstanceId);
    
    // 监听鼠标移动，移除高亮
    const removeHighlightOnMove = () => {
        const el = document.getElementById(cardInstanceId);
        if (el) {
            el.classList.remove('dropped-highlight');
            highlightedCards.delete(cardInstanceId);
        }
        // 只触发一次
        document.removeEventListener('mousemove', removeHighlightOnMove);
    };
    
    // 延迟一小段时间后开始监听（避免立即触发）
    setTimeout(() => {
        document.addEventListener('mousemove', removeHighlightOnMove, { once: true });
    }, 500);
}
