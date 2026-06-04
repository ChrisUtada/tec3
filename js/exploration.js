// 🌍 场景探索系统
import { SCENE_EXPLORATION, CARD_TEMPLATES } from './config.js';
import { log } from './ui.js';
import { showStackProgressBar, hideStackProgressBar } from './logic.js';
import { embedCardInSlot, restoreCardToBoard, initModalDrag, setupCardDragOut } from './shared.js';
import { CARD } from './consts.js';

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

//  保存探索 timeoutId，以便在关闭探索窗口时取消
let explorationTimeoutId = null;

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
    
    // 显示条件提示
    const conditionHint = getConditionHint();
    if (conditionHint) {
        explorationInfo.innerText = `探索条件：${conditionHint}`;
    } else {
        explorationInfo.innerText = `将人物、物品或线索拖入上方 ${sceneData.slots} 个槽位，然后点击"探索"按钮。`;
    }
    
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
    
    //  如果正在探索，取消探索任务
    if (explorationTimeoutId) {
        clearTimeout(explorationTimeoutId);
        explorationTimeoutId = null;
        isExploring = false;
        
        // 隐藏进度条
        explorationProgress.style.display = 'none';
        
        // 恢复按钮状态
        if (startBtn) startBtn.disabled = false;
        
        log(`⚠️ [探索中断] 探索已取消`, "normal");
    }
    
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
    
    if (!currentScene || isExploring) {
        return;
    }

    if (slotIndex === undefined || slotIndex === null) {
        // 自动找到第一个空槽位
        slotIndex = explorationSlots.findIndex(slot => slot === null || slot === undefined);
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
        
        // 使用共享工具函数添加拖出功能
        setupCardDragOut(cardEl, cardData, {
            slotIndex,
            slotsArray: explorationSlots,
            slotElement,
            placeholderText: `槽位 ${slotIndex + 1}`,
            shouldBlock: () => isExploring,  // 探索中阻止拖出
            onRemove: () => {
                draggedCardData = null;
            },
            logMessage: '探索系统：卡牌已从槽位取出'
        });
    }

    log(` [探索系统] 将【${template.name}】放入槽位 ${slotIndex + 1}`, "success");
}

// 检查所有条件是否满足
function checkAllConditionsMet() {
    const sceneData = SCENE_EXPLORATION[currentScene];
    if (!sceneData || !sceneData.requiredCards) {
        // 没有配置条件限制，只要有卡牌就可以探索
        const hasCards = explorationSlots.some(slot => slot !== null && slot !== undefined);
        return hasCards;
    }
    
    const requiredCards = sceneData.requiredCards;
    
    // 统计当前槽位中各类卡牌的数量
    const currentCounts = {};
    let totalCards = 0;
    explorationSlots.forEach(cardData => {
        if (cardData) {
            totalCards++;
            const cardTemplate = CARD_TEMPLATES[cardData.templateId];
            const key = `type_${cardTemplate.type}`;
            currentCounts[key] = (currentCounts[key] || 0) + 1;
            currentCounts[`id_${cardData.templateId}`] = (currentCounts[`id_${cardData.templateId}`] || 0) + 1;
        }
    });
    
    // 检查每个条件的 min 是否满足
    for (const condition of requiredCards) {
        let currentCount = 0;
        
        if (condition.templateId) {
            currentCount = currentCounts[`id_${condition.templateId}`] || 0;
        } else if (condition.type) {
            currentCount = currentCounts[`type_${condition.type}`] || 0;
        }
        
        if (currentCount < condition.min) {
            return false;
        }
    }
    
    // 检查总卡牌数不超过槽位数
    return totalCards > 0 && totalCards <= sceneData.slots;
}

// 获取条件不满足的提示信息
function getConditionHint() {
    const sceneData = SCENE_EXPLORATION[currentScene];
    if (!sceneData || !sceneData.requiredCards) {
        return '';
    }
    
    const requiredCards = sceneData.requiredCards;
    const hints = [];
    
    // 统计当前槽位中各类卡牌的数量
    const currentCounts = {};
    explorationSlots.forEach(cardData => {
        if (cardData) {
            const cardTemplate = CARD_TEMPLATES[cardData.templateId];
            const key = `type_${cardTemplate.type}`;
            currentCounts[key] = (currentCounts[key] || 0) + 1;
            currentCounts[`id_${cardData.templateId}`] = (currentCounts[`id_${cardData.templateId}`] || 0) + 1;
        }
    });
    
    for (const condition of requiredCards) {
        let currentCount = 0;
        let name = '';
        
        if (condition.templateId) {
            currentCount = currentCounts[`id_${condition.templateId}`] || 0;
            const template = CARD_TEMPLATES[condition.templateId];
            name = template ? template.name : condition.templateId;
        } else if (condition.type) {
            currentCount = currentCounts[`type_${condition.type}`] || 0;
            const typeNames = { char: '人物', item: '道具', clue: '线索', scene: '场景', logic: '逻辑' };
            name = typeNames[condition.type] || condition.type;
        }
        
        if (condition.min > 0 || condition.max > 0) {
            if (condition.min === condition.max) {
                hints.push(`${name}：需要 ${condition.min} 张（当前 ${currentCount}）`);
            } else if (condition.min === 0) {
                hints.push(`${name}：最多 ${condition.max} 张（当前 ${currentCount}）`);
            } else {
                hints.push(`${name}：需要 ${condition.min}-${condition.max} 张（当前 ${currentCount}）`);
            }
        }
    }
    
    return hints.join('，');
}

// 开始探索
export function startExploration() {
    initExplorationElements();
    
    if (!currentScene || isExploring) {
        return;
    }

    const sceneData = SCENE_EXPLORATION[currentScene];
    
    // 检查条件是否满足
    if (!checkAllConditionsMet()) {
        const hint = getConditionHint();
        if (hint) {
            // 在弹窗中显示条件提示
            explorationInfo.innerHTML = `<span style="color: #e74c3c;">❌ 探索条件未满足！</span><br>需要：${hint}`;
            log(`❌ [探索系统] 探索条件未满足！${hint}`, "normal");
        } else {
            explorationInfo.innerHTML = `<span style="color: #e74c3c;">❌ 请放入符合条件的卡牌再开始探索</span>`;
            log(`❌ [探索系统] 请放入符合条件的卡牌再开始探索`, "normal");
        }
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
    explorationTimeoutId = setTimeout(() => {
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
                    cardEl.style.width = CARD.WIDTH + 'px';
                    cardEl.style.height = CARD.HEIGHT + 'px';
                    cardEl.classList.remove('embedded');
                }
            }
        }
    });
    
    // 清空槽位数据
    explorationSlots = [];
    
    // 根据概率计算掉落
    const drops = calculateDrops(sceneData.drops);
    // 计算生成位置（在画布中央）
    const boardCanvas = document.getElementById('board-canvas');
    const boardRect = boardCanvas.getBoundingClientRect();
    
    //  使用 boardCanvas 的 offsetWidth/offsetHeight 获取实际内容区域大小
    const centerX = boardCanvas.offsetWidth / 2;
    const centerY = boardCanvas.offsetHeight / 2;
    
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
            // 探索掉落：是否可重复由卡牌模板上的 allowDuplicate 决定
            const cardData = spawnCard(drop.templateId, spawnX, spawnY);
                
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
    explorationInfo.innerText = `探索完成！共获得 ${actualDrops} 个物品。点击"完成"按钮关闭窗口。`;
        
    log(`✅ [探索系统] 探索完成，共获得 ${actualDrops} 个掉落物`, "success");
    
    // 显示关闭按钮，让用户手动关闭
    closeBtn.style.display = 'inline-block';
    
    // 重置状态，允许再次放入卡牌进行探索
    resetExplorationState();
}

// 重置探索状态（完成探索后调用）
function resetExplorationState() {
    initExplorationElements();
    
    const sceneData = SCENE_EXPLORATION[currentScene];
    if (!sceneData) return;
    
    // 清空槽位显示
    explorationSlotsContainer.innerHTML = '';
    
    // 重新初始化槽位数组
    explorationSlots = new Array(sceneData.slots).fill(null);
    draggedCardData = null;
    
    // 重新生成槽位
    for (let i = 0; i < sceneData.slots; i++) {
        const slot = document.createElement('div');
        slot.className = 'exploration-slot';
        slot.dataset.slotIndex = i;
        slot.innerHTML = `<div class="exploration-slot-placeholder">槽位 ${i + 1}</div>`;
        explorationSlotsContainer.appendChild(slot);
        
        // 设置拖放事件
        setupSlotDrop(slot, i);
    }
    
    // 重置按钮状态
    startBtn.style.display = 'inline-block';
    startBtn.disabled = false;
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
