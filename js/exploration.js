// 🌍 场景探索系统
import { SCENE_EXPLORATION, CARD_TEMPLATES } from './config.js';
import { log } from './ui.js';
import { showStackProgressBar, hideStackProgressBar } from './logic.js';
import { embedCardInSlot, restoreCardToBoard, setupCardDragOut, closeOtherPanels, clearSlotCards, closePanelForReopen } from './shared.js';
import { isOverfatigued } from './shared.js';
import { CARD } from './consts.js';
import { playSound } from './sound.js';

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
let explorationPanel, explorationTitle, explorationSlotsContainer, explorationProgress, explorationProgressFill, explorationProgressText, explorationInfo, startBtn, closeBtn;

function initExplorationElements() {
    if (!explorationPanel) {
        explorationPanel = document.getElementById('exploration-panel');
        explorationTitle = document.getElementById('exploration-title');
        explorationSlotsContainer = document.getElementById('exploration-slots');
        explorationProgress = document.getElementById('exploration-progress');
        explorationProgressFill = document.getElementById('exploration-progress-fill');
        explorationProgressText = document.getElementById('exploration-progress-text');
        explorationInfo = document.getElementById('exploration-info');
        startBtn = document.getElementById('exploration-start-btn');
        closeBtn = document.getElementById('exploration-close-btn');
    }
    // 监听从外部关闭
    if (!explorationPanel._cleanupAttached) {
        explorationPanel.addEventListener('panelclosed', () => {
            if (explorationTimeoutId) {
                clearTimeout(explorationTimeoutId);
                explorationTimeoutId = null;
                isExploring = false;
                explorationPanel.classList.remove('exploration-active');
                if (explorationProgress) explorationProgress.style.display = 'none';
                if (startBtn) startBtn.disabled = false;
            }
            clearSlotCards(explorationSlots, draggedCardData);
            draggedCardData = null;
            currentScene = null;
        });
        explorationPanel._cleanupAttached = true;
    }
}

// 打开场景探索窗口
export function openExploration(sceneId) {
    initExplorationElements();
    
    if (!SCENE_EXPLORATION[sceneId]) {
        log(`❌ [探索系统] 未找到该场景的探索数据`, "normal");
        return;
    }

    closePanelForReopen(explorationPanel, () => {
        currentScene = sceneId;
        const sceneData = SCENE_EXPLORATION[sceneId];

        closeOtherPanels('exploration-panel');

        explorationSlots = new Array(sceneData.slots).fill(null);
        isExploring = false;
        draggedCardData = null;

        explorationTitle.innerText = `探索【${sceneData.name}】`;

        explorationSlotsContainer.innerHTML = '';
        for (let i = 0; i < sceneData.slots; i++) {
            const slot = document.createElement('div');
            slot.className = 'exploration-slot';
            slot.dataset.slotIndex = i;
            slot.innerHTML = `<div class="exploration-slot-placeholder">槽位 ${i + 1}</div>`;
            explorationSlotsContainer.appendChild(slot);
            setupSlotDrop(slot, i);
        }

        explorationProgress.style.display = 'none';
        explorationProgressFill.style.width = '0%';

        explorationInfo.innerText = sceneData.message || '展开探索…';

        startBtn.style.display = 'inline-block';
        startBtn.disabled = false;

        explorationPanel.classList.add('show');
        playSound('panelOpen');
        log(`🌍 [探索系统] 开启了【${sceneData.name}】的探索`, "success");
    });
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
    
    // 淡出动画
    explorationPanel.classList.remove('show');
    
    clearSlotCards(explorationSlots, draggedCardData);
    draggedCardData = null;
    
    currentScene = null;
    explorationSlots.length = 0;
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

    // 每次放入（无论成功/失败）先清除所有槽位的错误状态，防止红框残留
    explorationSlotsContainer.querySelectorAll('.exploration-slot').forEach(slot => {
        slot.classList.remove('shake-error');
    });

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
    
    // 白名单校验：场景有 requiredCards 时，槽位只接受 required 卡 + 因果律
    // 传入 cardData.instanceId 以排除该卡（允许卡牌在槽位之间自由移动）
    if (!isCardAllowedInSlot(templateId, cardData.instanceId)) {
        log(`❌ [探索系统] ${template.name} 不能放入此槽位`, "normal");
        playSound('error');
        // 只对当前槽位震动
        const slotElement = explorationSlotsContainer.children[slotIndex];
        if (slotElement) {
            void slotElement.offsetWidth;
            slotElement.classList.add('shake-error');
        }
        // 将卡牌放回桌面
        restoreCardToBoard(cardData, 'board-canvas', true);
        return false;
    }
    
    explorationSlots[slotIndex] = cardData;
    draggedCardData = cardData;

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
            placeholderClass: 'exploration-slot-placeholder',
            shouldBlock: () => isExploring,  // 探索中阻止拖出
            onRemove: () => {
                draggedCardData = null;
            },
            logMessage: '探索系统：卡牌已从槽位取出'
        });
    }

    log(` [探索系统] 将【${template.name}】放入槽位 ${slotIndex + 1}`, "success");
    return true;  // 返回成功状态
}

// 获取某个 requiredCards 配置的当前匹配状态
function checkConditionSet(requiredCards) {
    const currentCounts = {};
    explorationSlots.forEach(cardData => {
        if (cardData) {
            currentCounts[`id_${cardData.templateId}`] = (currentCounts[`id_${cardData.templateId}`] || 0) + 1;
        }
    });
    for (const condition of requiredCards) {
        const min = condition.min ?? 1;
        const current = currentCounts[`id_${condition.templateId}`] || 0;
        if (current < min) return false;
    }
    return true;
}

// 获取当前匹配的 dropGroup（有 dropGroups 时）
function getActiveDropGroup(sceneData) {
    if (!sceneData.dropGroups) return null;
    return sceneData.dropGroups.find(group => checkConditionSet(group.requiredCards)) || null;
}

// 校验卡牌是否可以放入当前场景的探索槽位
// 规则：有 requiredCards 或 dropGroups 时，槽位只接受条件中声明的卡 + 因果律
// excludeInstanceId: 移动卡牌时排除的卡牌ID（用于允许卡牌在槽位之间自由移动）
function isCardAllowedInSlot(templateId, excludeInstanceId = null) {
    const sceneData = SCENE_EXPLORATION[currentScene];
    if (!sceneData) return true;
    
    // 因果律永远允许
    if (templateId === 'ITEM_coin') return true;
    
    // 收集允许的 conditions 列表
    let allowedConditions = null;  // null = 未限制
    
    if (sceneData.dropGroups) {
        const currentCounts = countSlotsByTemplate(excludeInstanceId);
        
        // 分支互斥：找出当前已完全激活的分支
        const activeBranches = sceneData.dropGroups.filter(group => {
            for (const cond of group.requiredCards) {
                const min = cond.min ?? 1;
                if ((currentCounts[`id_${cond.templateId}`] || 0) < min) return false;
            }
            return true;
        });
        
        if (activeBranches.length === 1) {
            // 有单一活跃分支 → 锁定，只接受该分支的卡
            allowedConditions = activeBranches[0].requiredCards;
        } else if (activeBranches.length > 1) {
            // 异常：多个分支同时激活 → 拒绝所有
            return false;
        } else {
            // 无活跃分支 → 所有分支的 conditions 都可
            allowedConditions = sceneData.dropGroups.flatMap(g => g.requiredCards);
        }
    } else if (sceneData.requiredCards) {
        allowedConditions = sceneData.requiredCards;
    }
    
    if (!allowedConditions || allowedConditions.length === 0) return true;  // 无条件：自由放入
    
    const currentCounts = countSlotsByTemplate(excludeInstanceId);
    for (const condition of allowedConditions) {
        if (condition.templateId === templateId) {
            const current = currentCounts[`id_${templateId}`] || 0;
            const max = condition.max ?? Infinity;
            if (current < max) return true;
        }
    }
    return false;
}

// 统计当前槽位中各 templateId 的数量
// excludeInstanceId: 移动卡牌时排除的卡牌ID（用于允许卡牌在槽位之间自由移动）
function countSlotsByTemplate(excludeInstanceId = null) {
    const counts = {};
    explorationSlots.forEach(cardData => {
        if (cardData) {
            // 排除正在移动的卡牌
            if (excludeInstanceId && cardData.instanceId === excludeInstanceId) {
                return;
            }
            const key = `id_${cardData.templateId}`;
            counts[key] = (counts[key] || 0) + 1;
        }
    });
    return counts;
}

// 计算当前槽位中的因果律数量
function countCoinsInSlots() {
    let count = 0;
    explorationSlots.forEach(cardData => {
        if (cardData && cardData.templateId === 'ITEM_coin') {
            count++;
        }
    });
    return count;
}

// 检查所有条件是否满足
function checkAllConditionsMet() {
    const sceneData = SCENE_EXPLORATION[currentScene];
    if (!sceneData) return false;
    
    const hasCards = explorationSlots.some(slot => slot !== null && slot !== undefined);
    if (!hasCards) return false;
    
    if (sceneData.dropGroups) {
        // 任一 dropGroup 的条件满足即可
        return sceneData.dropGroups.some(group => checkConditionSet(group.requiredCards));
    }
    
    if (!sceneData.requiredCards) {
        return true;  // 无条件：有卡即可
    }
    
    // 旧版：所有 requiredCards 必须满足
    return checkConditionSet(sceneData.requiredCards);
}

// 开始探索
export function startExploration() {
    initExplorationElements();
    
    if (!currentScene || isExploring) {
        return;
    }

    if (isOverfatigued()) {
        log(`⚠️ 过度疲劳，无法继续探索`, "normal");
        return;
    }

    const sceneData = SCENE_EXPLORATION[currentScene];
    
    // 检查条件是否满足
    if (!checkAllConditionsMet()) {
        log(`❌ [探索系统] 探索条件未满足`, "normal");
        return;
    }

    isExploring = true;
    startBtn.disabled = true;
    explorationPanel.classList.add('exploration-active');
    
    // 获取匹配的 dropGroup 动态消息
    const activeGroup = getActiveDropGroup(sceneData);
    const progressMessage = activeGroup && activeGroup.message ? activeGroup.message : sceneData.message;
    
    // 显示进度条
    explorationProgress.style.display = 'flex';
    explorationProgressText.innerText = progressMessage;
    
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
    explorationPanel.classList.remove('exploration-active');
    
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
                // 清空已消耗卡牌的数据
                explorationSlots[index] = null;
            } else if (template) {
                log(`✅ [探索系统] 【${template.name}】保留在槽位中`, "success");
                // 不可消耗的卡牌保持在槽位中，由玩家手动拖出
            }
        }
    });
    
    // 根据概率计算掉落（支持条件分支产出）
    const drops = calculateDrops(sceneData);
    
    // 计算生成位置（在画布中央）
    const boardCanvas = document.getElementById('board-canvas');
    
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
                
            // 标记卡牌的来源场景（用于整理归位）
            if (cardData) {
                cardData.sourceScene = currentScene;
                highlightDroppedCard(cardData.instanceId);
            }
                
            log(`✨ [探索掉落] ${drop.message}`, "success");
            actualDrops++;
        } else if (!spawnCard) {
            log(`❌ [探索系统] spawnCard 函数未初始化`, "normal");
        }
    });
    
    //   疲劳卡掉落：根据场景概率 + 人物触发属性
    if (spawnCard) {
        const fatigueDropRate = sceneData.fatigueDropRate || 0;
        const hasFatigueTrigger = explorationSlots.some(card => {
            if (!card) return false;
            const tmpl = CARD_TEMPLATES[card.templateId];
            return tmpl && tmpl.fatigueTrigger === true;
        });
        if (hasFatigueTrigger && Math.random() < fatigueDropRate) {
            const fatigueX = centerX + 60;
            const fatigueY = centerY + 120;
            const fatigueData = spawnCard('DEBUFF_fatigue', fatigueX, fatigueY);
            if (fatigueData) {
                fatigueData.sourceScene = currentScene;
                highlightDroppedCard(fatigueData.instanceId);
                log(`💫 [探索掉落] 疲劳积累 —— 桌面疲劳卡 +1`, "normal");
            }
        }
    }
        
    // 显示提示信息
    explorationInfo.innerText = `探索完成！共获得 ${actualDrops} 个物品。不可消耗的卡牌保留在槽位中，可手动拖出。`;
        
    playSound('complete');
    log(`✅ [探索系统] 探索完成，共获得 ${actualDrops} 个掉落物`, "success");
    
    // 重置状态，允许再次放入卡牌进行探索
    resetExplorationState();
}

// 重置探索状态（完成探索后调用）
function resetExplorationState() {
    initExplorationElements();
    
    const sceneData = SCENE_EXPLORATION[currentScene];
    if (!sceneData) return;
    
    // 保存当前槽位中的卡牌数据和DOM元素（未被消耗的）
    const remainingCards = [];
    const slotElements = explorationSlotsContainer.children;
    
    for (let i = 0; i < explorationSlots.length; i++) {
        const cardData = explorationSlots[i];
        if (cardData !== null) {
            const cardEl = document.getElementById(cardData.instanceId);
            if (cardEl) {
                remainingCards.push({
                    index: i,
                    cardData,
                    cardEl  // 保存实际的DOM元素引用
                });
            }
        }
    }
    
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
        
        // 查找是否有保留的卡牌需要放入这个槽位
        const remainingCard = remainingCards.find(c => c.index === i);
        if (remainingCard) {
            // 将卡牌数据恢复到新数组中
            explorationSlots[i] = remainingCard.cardData;
            // 直接移动DOM元素到新槽位（不移除事件监听器）
            slot.appendChild(remainingCard.cardEl);
            // 设置拖出功能
            setupCardDragOut(remainingCard.cardEl, remainingCard.cardData, {
                slotIndex: i,
                slotsArray: explorationSlots,
                slotElement: slot,
                placeholderText: `槽位 ${i + 1}`,
                placeholderClass: 'exploration-slot-placeholder',
                shouldBlock: () => isExploring,
                onRemove: () => {
                    draggedCardData = null;
                },
                logMessage: '探索系统：卡牌已从槽位取出'
            });
        } else {
            slot.innerHTML = `<div class="exploration-slot-placeholder">槽位 ${i + 1}</div>`;
        }
        
        explorationSlotsContainer.appendChild(slot);
        
        // 设置拖放事件
        setupSlotDrop(slot, i);
    }
    
    // 重置按钮状态
    startBtn.style.display = 'inline-block';
    startBtn.disabled = false;
    
    // 恢复场景描述
    explorationInfo.innerText = sceneData.message || '展开探索…';
}

// 计算掉落
function calculateDrops(sceneData) {
    const results = [];
    
    // 确定使用哪个掉落配置
    let dropsConfig;
    if (sceneData.dropGroups) {
        const activeGroup = getActiveDropGroup(sceneData);
        dropsConfig = activeGroup ? activeGroup.drops : [];
    } else {
        dropsConfig = sceneData.drops || [];
    }
    
    if (dropsConfig.length === 0) return results;
    
    // 因果律加成：每张 +10%，封顶 100%
    const coinCount = countCoinsInSlots();
    const boost = Math.min(coinCount * 0.1, 1.0);
    
    dropsConfig.forEach(drop => {
        // 应用加成后概率，封顶 1.0
        const finalChance = Math.min(drop.chance + boost, 1.0);
        if (Math.random() < finalChance) {
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

// 🌟 高亮掉落卡牌（固定 1 秒后自动取消）
export function highlightDroppedCard(cardInstanceId) {
    const cardEl = document.getElementById(cardInstanceId);
    if (!cardEl) return;
    
    // 添加高亮类名
    cardEl.classList.add('dropped-highlight');
    highlightedCards.add(cardInstanceId);
    
    // 1 秒后自动移除高亮
    setTimeout(() => {
        const el = document.getElementById(cardInstanceId);
        if (el) {
            el.classList.remove('dropped-highlight');
        }
        highlightedCards.delete(cardInstanceId);
    }, 1000);
}
