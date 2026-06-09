// 🌍 场景探索系统
import { SCENE_EXPLORATION, CARD_TEMPLATES } from './config.js';
import { log } from './ui.js';
import { showStackProgressBar, hideStackProgressBar } from './logic.js';
import { embedCardInSlot, restoreCardToBoard, setupCardDragOut, closeOtherPanels, clearSlotCards, closePanelForReopen } from './shared.js';
import { CARD } from './consts.js';
import { playSound } from './sound.js';

// 从 engine.js 获取 spawnUnboundCard 函数
let spawnCard = null;
let getCardsData = null;
let destroyCard = null;

// 初始化时获取 spawnCard 函数
export function initExplorationModule(spawnFn, cardsDataFn, destroyFn) {
    spawnCard = spawnFn;
    getCardsData = cardsDataFn;
    destroyCard = destroyFn;
}

let currentScene = null;  // 当前场景 templateId
let explorationSlots = [];  // 槽位中的卡牌数据
let isExploring = false;  // 是否正在探索中
let draggedCardData = null;  // 记录被拖入的卡牌数据
let highlightedCards = new Set();  // 高亮卡牌的 ID 集合
let _fatigueEffect = null;  // 疲劳>=5时的效果: 'peek' | 'swallow' | null

//  保存探索 timeoutId，以便在关闭探索窗口时取消
let explorationTimeoutId = null;

// 延迟获取 DOM 元素
let explorationPanel, explorationTitle, explorationSlotsContainer, explorationProgress, explorationProgressFill, explorationProgressText, explorationInfo, explorationDropsInfo, startBtn, closeBtn;

function initExplorationElements() {
    if (!explorationPanel) {
        explorationPanel = document.getElementById('exploration-panel');
        explorationTitle = document.getElementById('exploration-title');
        explorationSlotsContainer = document.getElementById('exploration-slots');
        explorationProgress = document.getElementById('exploration-progress');
        explorationProgressFill = document.getElementById('exploration-progress-fill');
        explorationProgressText = document.getElementById('exploration-progress-text');
        explorationInfo = document.getElementById('exploration-info');
        explorationDropsInfo = document.getElementById('exploration-drops-info');
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
            _fatigueEffect = null;
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

        // 更新剩余掉落提示
        updateDropsInfo();

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
    _fatigueEffect = null;
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

// 统计桌面上疲劳卡的数量
function countFatigueOnBoard() {
    const cards = getCardsData ? getCardsData() : [];
    return cards.filter(c => c.templateId === 'DEBUFF_fatigue').length;
}

// 统计场景掉落进度（不含 allowDuplicate 的无限掉落、不含窥视卡）
function getSceneDropsProgress(sceneData) {
    const allDrops = [];
    if (sceneData.dropGroups) {
        sceneData.dropGroups.forEach(g => allDrops.push(...(g.drops || [])));
    } else {
        allDrops.push(...(sceneData.drops || []));
    }
    const unique = new Set(allDrops.map(d => d.templateId));
    const allCards = getCardsData ? getCardsData() : [];
    let count = 0;
    for (const tid of unique) {
        const tmpl = CARD_TEMPLATES[tid];
        if (tmpl && tmpl.allowDuplicate) continue;
        if (tmpl && tmpl.dropOnce && window.isDropOnceConsumed?.(tid)) continue;
        if (allCards.some(c => c.templateId === tid)) continue;
        count++;
    }
    return { remaining: count, total: unique.size };
}

// 更新面板中的剩余掉落提示
function updateDropsInfo() {
    if (!explorationDropsInfo) return;
    const sceneData = SCENE_EXPLORATION[currentScene];
    if (!sceneData) return;
    const { remaining, total } = getSceneDropsProgress(sceneData);
    explorationDropsInfo.textContent = remaining > 0
        ? `─── 剩余掉落 ───\n还有 ${remaining}/${total} 种卡牌未获得`
        : `─── 剩余掉落 ───\n所有卡牌已全部获得`;
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
        log(`❌ [探索系统] 探索条件未满足`, "normal");
        return;
    }

    // 疲劳>=5触发疯狂窥视/被场景吞没（效果在探索结束时执行）
    _fatigueEffect = null;
    const fatigueCount = countFatigueOnBoard();
    if (fatigueCount >= 5) {
        _fatigueEffect = Math.random() < 0.5 ? 'peek' : 'swallow';
        if (_fatigueEffect === 'peek') {
            log(`👁️ [疯狂窥视] 疲劳达到极限，你感到周围的空间开始扭曲...`, "success");
        } else {
            log(`🌑 [场景吞没] 场景在你脚下张开巨口...`, "normal");
        }
    } else if (fatigueCount >= 1) {
        const rates = [0, 20, 30, 40, 50];
        log(`⚠️ [疲劳干扰] ${fatigueCount} 张疲劳使探索失败率提升至 ${rates[fatigueCount]}%`, "normal");
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

    // 计算生成位置（在画布中央）
    const boardCanvas = document.getElementById('board-canvas');
    const centerX = boardCanvas.offsetWidth / 2;
    const centerY = boardCanvas.offsetHeight / 2;

    const fatigueCount = countFatigueOnBoard();
    let actualDrops = 0;

    // ===== 疲劳>=5：吞没/窥视 =====
    if (fatigueCount >= 5) {
        if (_fatigueEffect === 'swallow') {
            explorationSlots.forEach((cd) => {
                if (!cd) return;
                const tmpl = CARD_TEMPLATES[cd.templateId];
                log(`🌑 [场景吞没] 【${tmpl ? tmpl.name : cd.templateId}】被场景吞噬！`, "normal");
                if (destroyCard) destroyCard(cd.instanceId);
            });
            explorationSlots.fill(null);
            explorationInfo.innerText = `场景将一切吞入黑暗...槽位空空如也。`;
            playSound('complete');
            log(`🌑 [场景吞没] 场景将一切吞入黑暗，无任何掉落`, "success");
            _fatigueEffect = null;
            updateDropsInfo();
            resetExplorationState();
            return;
        }

        // peek：掉落疯狂窥视卡，不消耗槽位卡
        _fatigueEffect = null;

        if (spawnCard) {
            spawnCard('ITEM_peek_truth', centerX - 60, centerY + 80);
        }

        explorationInfo.innerText = `探索完成！疲劳极限中你窥见了不可名状之物。`;
        playSound('complete');
        log(`👁️ [疯狂窥视] 疲劳达到极限，你在恍惚中获得了洞察异常的力量`, "success");
        updateDropsInfo();
        resetExplorationState();
        return;
    }

    // ===== 疲劳 0-4：按失败率判定 =====
    const failureRates = [0, 0.2, 0.3, 0.4, 0.5];
    const failureRate = failureRates[Math.min(fatigueCount, 4)];
    const isFailure = failureRate > 0 && Math.random() < failureRate;

    if (isFailure) {
        // 失败：无消耗、无掉落，卡牌保留
        explorationInfo.innerText = `探索失败...槽位中的卡牌完好无损，但一无所获。`;
        playSound('complete');
        log(`❌ [探索失败] ${fatigueCount} 张疲劳干扰了探索，未获得任何掉落`, "normal");
        updateDropsInfo();
        resetExplorationState();
        return;
    }

    // ===== 成功：正常消耗 + 掉落 =====
    explorationSlots.forEach((cd, i) => {
        if (!cd) return;
        const tmpl = CARD_TEMPLATES[cd.templateId];
        if (tmpl && tmpl.consumable) {
            log(`🗑️ [探索系统] 【${tmpl.name}】在探索中被消耗`, "normal");
            const el = document.getElementById(cd.instanceId);
            if (el) el.remove();
            explorationSlots[i] = null;
        } else if (tmpl) {
            log(`✅ [探索系统] 【${tmpl.name}】保留在槽位中`, "success");
        }
    });
    
    // 根据概率计算掉落（支持条件分支产出）
    const drops = calculateDrops(sceneData);
        
    drops.forEach((drop, index) => {
        const offsetX = (index - (drops.length - 1) / 2) * 140;
        const spawnX = centerX + offsetX;
        const spawnY = centerY;
        const tmpl = CARD_TEMPLATES[drop.templateId];
        if (tmpl && spawnCard) {
            const cardData = spawnCard(drop.templateId, spawnX, spawnY);
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
    
    // 疲劳卡掉落：根据场景概率 + 人物触发属性（仅在非窥视/吞没模式下）
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
        
    explorationInfo.innerText = `探索完成！共获得 ${actualDrops} 个物品。`;
    playSound('complete');
    log(`✅ [探索系统] 探索完成，共获得 ${actualDrops} 个掉落物`, "success");
    updateDropsInfo();
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
