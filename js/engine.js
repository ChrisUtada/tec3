//  渲染引擎与拖拽逻辑
import { CARD_TEMPLATES, INITIAL_BOARD, INITIAL_SPAWN } from './config.js';
import { gameState, updateState } from './state.js';
import { log, toggleSceneModal, updateModalContent, hideEndingReport, showEndingReport, setSystemStatus } from './ui.js';
import { tryCapture, tryOpenComboLock, checkReaction, triggerEnding, getTaskProcessing, setTaskProcessing } from './logic.js';
import { showStackProgressBar, hideStackProgressBar, updateProgressBarPosition, hideSpeechBubble } from './renderer.js';
import { openDialogue, placeCardInSlot } from './dialogue.js';
import { openReasoningModal, placeCardInReasoningSlot } from './reasoning.js';
import { openExploration, initExplorationModule, placeCardInExplorationSlot } from './exploration.js';
import { openRestPanel, initRestModule, placeCardInRestSlot, startRest } from './rest.js';
import { restoreCardToBoard } from './shared.js';
import { CARD } from './consts.js';
import { sacrificeSystem } from './systems/sacrifice.js';
import { corruptionSystem } from './systems/corruption.js';
import { taskManager } from './core/task-manager.js';
import { stackSystem } from './core/stack-system.js';
import { dragSystem } from './core/drag-system.js';

const boardCanvas = document.getElementById('board-canvas');
let cardsData = [];
let cardsMap = new Map(); // 性能优化：O(1) 查找

//  暴露获取 cardsData 的函数，供 renderer.js 使用
window.getCardsData = () => cardsData;

// dropOnce 记录集：标记整局游戏中已掉落过一次的卡牌
const _dropOnceSet = new Set();
window.isDropOnceConsumed = (tid) => _dropOnceSet.has(tid);

// 卡牌类型固定层级（数值越大越上层）
const Z_INDEX = {
    scene: 100,
    char: 200,
    item: 300,
    clue: 400,
    logic: 500,
};

// 初始化 exploration 模块（使用直接生成，探索本身已有进度条）
initExplorationModule(directSpawnCard, () => cardsData, destroyCard);
initRestModule(destroyCard);

export function findCardData(id) { 
    return cardsMap.get(id); // O(1) 查找替代 O(n) find
}
export function destroyCard(id) {
    corruptionSystem.stopTimer(id);
    const idx = cardsData.findIndex(c => c.instanceId === id);
    if (idx !== -1) cardsData.splice(idx, 1);
    cardsMap.delete(id);
    const el = document.getElementById(id); 
    if (el) el.remove();
}

export function spawnUnboundCard(templateId, x, y, allowDuplicateOverride = null) {
    // 从卡牌模板读取 allowDuplicate 配置（type 上的统一属性）
    const template = CARD_TEMPLATES[templateId];
    const allowDuplicate = allowDuplicateOverride !== null
        ? allowDuplicateOverride
        : (template?.allowDuplicate === true);

    // dropOnce 检查：整局游戏只能掉落一次
    if (template?.dropOnce && _dropOnceSet.has(templateId)) {
        log(`❌ [掉落失败] 【${CARD_TEMPLATES[templateId].name}】已掉落过一次，无法重复生成！`, "normal");
        return null;
    }

    // 检查该 templateId 是否已经存在（防重复掉落）
    if (!allowDuplicate) {
        // 使用 Map 检查更快
        for (const card of cardsMap.values()) {
            if (card.templateId === templateId) {
                log(`❌ [掉落失败] 【${CARD_TEMPLATES[templateId].name}】已在桌面上，无法重复生成！`, "normal");
                return null;
            }
        }
    }

    const newId = 'spawn_' + templateId + '_' + Math.floor(Math.random()*10000);
    const newCard = { instanceId: newId, templateId: templateId, x: x, y: y, next: null, parent: null, isCaptured: true };
    cardsData.push(newCard);
    cardsMap.set(newId, newCard); // 同步添加到 Map

    // 记录 dropOnce
    if (template?.dropOnce) _dropOnceSet.add(templateId);

    log(`📡 发现线索：【${CARD_TEMPLATES[templateId].name}】已刷出。`, "capture");

    // 自动启动腐化倒计时
    if (template?.corruptionTime) {
        corruptionSystem.startTimer(newCard.instanceId, template.corruptionTime);
    }

    renderAllCards();

    return newCard;  // 返回新生成的卡牌数据
}

export function directSpawnCard(templateId, x, y, allowDuplicateOverride = null) {
    // 从卡牌模板读取 allowDuplicate 配置（type 上的统一属性）
    const template = CARD_TEMPLATES[templateId];
    const allowDuplicate = allowDuplicateOverride !== null
        ? allowDuplicateOverride
        : (template?.allowDuplicate === true);

    // dropOnce 检查：整局游戏只能掉落一次
    if (template?.dropOnce && _dropOnceSet.has(templateId)) {
        log(`❌ [掉落失败] 【${CARD_TEMPLATES[templateId].name}】已掉落过一次，无法重复生成！`, "normal");
        return;
    }

    // 检查该 templateId 是否已经存在（防重复掉落）
    if (!allowDuplicate) {
        for (const card of cardsMap.values()) {
            if (card.templateId === templateId) {
                log(`❌ [掉落失败] 【${CARD_TEMPLATES[templateId].name}】已在桌面上，无法重复生成！`, "normal");
                return;
            }
        }
    }

    const newId = 'spawn_' + templateId + '_' + Math.floor(Math.random()*10000);
    const newCard = { instanceId: newId, templateId: templateId, x: x, y: y, next: null, parent: null, isCaptured: true };
    cardsData.push(newCard);
    cardsMap.set(newId, newCard); // 同步添加到 Map

    // 记录 dropOnce
    if (template?.dropOnce) _dropOnceSet.add(templateId);

    log(`✨ 因果固化：实体资产【${CARD_TEMPLATES[templateId].name}】已成功存盘。`, "success");

    if (template?.corruptionTime) {
        corruptionSystem.startTimer(newCard.instanceId, template.corruptionTime);
    }

    renderAllCards();
    return newCard;
}

export function resetVerbCard(verb, originalX, originalY) {
    if (verb.parent) { const p = findCardData(verb.parent); if (p) p.next = null; verb.parent = null; }
    verb.x = originalX; verb.y = originalY;
    renderAllCards();
}

export function renderAllCards() {
    // 第一步：识别所有堆叠组合，并为每个组合分配基础z-index
    const cardDepths = new Map();
    const stackBaseZIndex = new Map();  // 记录每个堆叠组合的基础z-index
    let nextBaseZIndex = 100;  // 下一个可用的基础z-index
    
    // 先计算所有卡牌的depth
    cardsData.forEach(card => {
        if (card.parent) {
            let depth = 0;
            let p = cardsMap.get(card.parent);
            while(p) {
                depth++;
                p = p.parent ? cardsMap.get(p.parent) : null;
            }
            cardDepths.set(card.instanceId, depth);
        } else {
            cardDepths.set(card.instanceId, 0);
        }
    });
    
    // 第二步：为每个堆叠组合分配连续的z-index范围
    // 遍历所有卡牌，为每个堆叠组合分配z-index范围
    cardsData.forEach(card => {
        const depth = cardDepths.get(card.instanceId);
        
        // 只处理根卡牌（depth=0且没有parent）
        if (depth === 0 && !card.parent) {
            // 计算这个堆叠组合的最大depth（有多少张卡牌）
            let maxDepth = 0;
            let current = card;
            while(current.next) {
                const nextCard = cardsMap.get(current.next);
                //  安全检查：如果next卡牌不存在（已被销毁），跳出循环
                if (!nextCard) {
                    console.warn(`[堆叠组合] 链断裂：${current.instanceId}.next=${current.next} 不存在`);
                    current.next = null;  // 清理断裂的链接
                    break;
                }
                current = nextCard;
                const d = cardDepths.get(current.instanceId);
                if (d > maxDepth) maxDepth = d;
            }
            
            // 为这个组合分配连续的z-index范围
            stackBaseZIndex.set(card.instanceId, nextBaseZIndex);
            nextBaseZIndex += maxDepth + 1;  // 跳过这个组合占用的范围
        }
    });
    
    // 第三步：收集所有卡牌，计算最终位置和z-index
    const renderQueue = [];
    
    cardsData.forEach(card => {
        let finalX = card.x;
        let finalY = card.y;
        const depth = cardDepths.get(card.instanceId) || 0;
        let zIndex;
        
        // 计算堆叠位置
        if (depth > 0) {
            // 找到根父级（最底层的卡牌）
            let rootCard = card;
            while(rootCard.parent) {
                rootCard = cardsMap.get(rootCard.parent);
            }
            finalX = rootCard.x;
            finalY = rootCard.y + (depth * 24);  // 向下偏移，露出上半部分
            
            // 堆叠卡牌的z-index：根卡牌的基础z-index + depth
            const rootBaseZ = stackBaseZIndex.get(rootCard.instanceId);
            zIndex = rootBaseZ + depth;
            
        } else {
            // 独立卡牌：直接使用基础z-index
            zIndex = stackBaseZIndex.get(card.instanceId);
        }
        
        // 拖动中的卡牌赋予最高层级（高于所有面板）
        if (card.instanceId === dragSystem.activeDragId) {
            zIndex = 200000;  // 高于面板的 100000
        }
        
        renderQueue.push({ card, finalX, finalY, zIndex });
    });
    
    // 第二步：按 zIndex 排序，确保渲染顺序正确
    renderQueue.sort((a, b) => a.zIndex - b.zIndex);
    
    // 第三步：应用渲染
    renderQueue.forEach(({ card, finalX, finalY, zIndex }) => {
        let cardEl = document.getElementById(card.instanceId);
        if (!cardEl) {
            cardEl = document.createElement('div');
            cardEl.id = card.instanceId;
            const t = CARD_TEMPLATES[card.templateId];
            
            cardEl.className = `card ${t.class} ${card.isCaptured ? '' : 'unbound'}${t.art ? ' has-art' : ''}`;
            
            if (t.art) {
                cardEl.style.backgroundImage = `url(img/cards/${t.art})`;
                cardEl.style.backgroundSize = 'cover';
                cardEl.style.backgroundPosition = 'center';
                cardEl.innerHTML = `
                    <div class="card-name" style="background:rgba(0,0,0,0.5);color:#fff;padding:2px 6px;border-radius:3px;position:absolute;bottom:28px;left:4px;right:4px;font-size:11px;text-align:center;">${t.name}</div>
                    <div class="card-type-tag" style="position:absolute;bottom:4px;right:6px;font-size:9px;color:rgba(255,255,255,0.7);background:rgba(0,0,0,0.4);padding:1px 6px;border-radius:2px;">${t.type}</div>
                `;
            } else {
                cardEl.innerHTML = `
                    <div class="card-name">${t.name}</div>
                    ${card.isCaptured ? '' : '<div class="card-status-tag">Datanodes 离线 [点选]</div>'}
                    <div class="card-type-tag">${t.type}</div>
                `;
            }
            
            cardEl.addEventListener('mousedown', (e) => {
                // 检查卡牌是否在槽位中，如果是则不触发全局拖拽系统
                if (cardEl.dataset.embedded === 'true') {
                    return;
                }
                
                if (!card.isCaptured) { 
                    if (tryCapture(card, cardEl)) { 
                        e.stopPropagation(); 
                        return; 
                    } 
                }
                dragSystem.startDrag(e, card);
            });
            cardEl.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                
                // 检查卡牌是否在槽位中，如果是则不触发双击事件
                if (cardEl.dataset.embedded === 'true') {
                    return;
                }
                
                // 根据卡牌类型打开不同的弹窗
                const cardType = CARD_TEMPLATES[card.templateId].type;

                // 休息卡：始终打开休息面板
                if (card.templateId === 'SCENE_rest') {
    openRestPanel();
    return;
}

                if (cardType === 'char') {
                    // 人物卡牌：打开对话窗口
                    openDialogue(card.templateId);
                } else if (cardType === 'logic' && card.templateId === 'LOGIC_reason') {
                    // 逻辑归因卡牌：打开归因推演窗口
                    openReasoningModal();
                } else if (cardType === 'scene') {
                    // 场景卡牌：打开探索窗口
                    openExploration(card.templateId);
                } else {
                    // 其他卡牌：密码盒等
                    tryOpenComboLock(card, destroyCard, spawnUnboundCard);
                }
            });
            boardCanvas.appendChild(cardEl);
        }

        // 结局触发时的卡牌高亮修饰
        if (gameState.isGameOver) {
            cardEl.style.opacity = "0.85";
        } else {
            cardEl.style.opacity = "1";
        }

        cardEl.style.left = finalX + 'px'; 
        cardEl.style.top = finalY + 'px';
        cardEl.style.zIndex = zIndex;
    });

    corruptionSystem.updateAllBars();
}

export function syncModalAssets() {
    for (const entry of INITIAL_SPAWN) {
        if (!CARD_TEMPLATES[entry.templateId]) {
            log(`⚠ [初始生成] 卡牌模板 ${entry.templateId} 不存在，已跳过`, "normal");
            continue;
        }
        const fn = entry.unbound ? spawnUnboundCard : directSpawnCard;
        fn(entry.templateId, entry.x, entry.y);
        log(`✨ 初始生成: ${entry.templateId}`, "success");
    }
    updateState('sceneSynced', true);
    updateModalContent("", "", "实体已完整导入桌面", true);
    setTimeout(() => { toggleSceneModal(false); }, 600);
}

export function resumeExploration() {
    updateState('isGameOver', false);
    hideEndingReport();
    setSystemStatus(`● 运行状态：多结局链重置就绪 // 探索继续`, 'var(--color-vision)');

    if (gameState.lastTriggeredClueId) {
        const clueCard = findCardData(gameState.lastTriggeredClueId);
        if (clueCard) {
            if (clueCard.parent) {
                const parentCard = findCardData(clueCard.parent);
                if (parentCard) parentCard.next = null;
                clueCard.parent = null;
            }
            clueCard.x += 140;
            if (clueCard.x > boardCanvas.clientWidth - 120) clueCard.x = 40; 
            log(`🔄 [因果弹回] 已自动解开最终场景的堆叠。线索【${CARD_TEMPLATES[clueCard.templateId].name}】已恢复独立！`, "success");
        }
        updateState('lastTriggeredClueId', null);
    }
    renderAllCards();
}

/**
 * 初始化所有特殊系统模块（依赖注入）
 */
function _initSystems() {
    // 1. 初始化任务管理器
    taskManager.init({
        findCardData,
        hideStackProgressBar,
        log,
        getTaskProcessing,
        setTaskProcessing
    });

    // 2. 初始化堆叠系统
    stackSystem.init({
        findCardData,
        renderAllCards
    });

    // 3. 初始化拖拽系统
    dragSystem.init({
        gameState,
        hideSpeechBubble,
        cardsMap,
        taskManager,
        boardCanvas,
        findCardData,
        renderAllCards,
        updateProgressBarPosition,
        placeCardInSlot,
        placeCardInReasoningSlot,
        placeCardInExplorationSlot,
        placeCardInRestSlot,
        cardsData,
        sacrificeSystem,
        stackSystem,
        checkReaction,
        destroyCard,
        spawnUnboundCard,
        directSpawnCard,
        log,
        hideStackProgressBar
    });

    // 4. 构建子系统 API
    const api = {
        findCardData,
        cardsMap,
        cardsData,
        destroyCard,
        directSpawnCard,
        renderAllCards,
        enqueueTask: taskManager.enqueueTask.bind(taskManager),
        removeCardFromStack: stackSystem.removeCardFromStack.bind(stackSystem),
        getTaskQueue: taskManager.getTaskQueue.bind(taskManager),
        log,
        showStackProgressBar,
        hideStackProgressBar,
        setSystemStatus
    };

    sacrificeSystem.init(api);
    corruptionSystem.init(api);
}

// 从旧堆叠链中分离卡牌
function detachFromChain(card) {
    if (!card.parent) return;
    const oldParent = cardsMap.get(card.parent);
    if (oldParent && oldParent.next === card.instanceId) {
        oldParent.next = card.next;
    }
    card.parent = null;
    card.next = null;
}

// 按来源场景整理卡牌（仅物品卡堆叠到对应的场景卡上）
export function tidyCardsByScene() {
    if (getTaskProcessing()) {
        log(`⚠️ [整理] 有卡牌正在执行堆叠任务，请等待完成后再整理`, "normal");
        return;
    }
    const groups = {};
    cardsData.forEach(card => {
        if (card.sourceScene) {
            const template = CARD_TEMPLATES[card.templateId];
            if (template && template.type === 'item' && card.templateId !== 'DEBUFF_fatigue' && card.templateId !== 'ITEM_true_name') {
                if (!groups[card.sourceScene]) groups[card.sourceScene] = [];
                groups[card.sourceScene].push(card);
            }
        }
    });

    Object.entries(groups).forEach(([sceneId, children]) => {
        const sceneCard = cardsData.find(c => c.templateId === sceneId && !c.parent);
        if (!sceneCard || children.length === 0) return;

        children.forEach(detachFromChain);

        let prev = sceneCard;
        children.forEach((child, i) => {
            child.parent = prev.instanceId;
            prev.next = child.instanceId;
            child.x = sceneCard.x;
            child.y = sceneCard.y + (i + 1) * 24;
            prev = child;
        });
        prev.next = null;
    });

    renderAllCards();
    log(`📦 [整理] 已按来源场景归位卡牌`, "success");
}

export function initBaseTable() {
    cardsData = [];
    let idx = 0;
    for (const entry of INITIAL_BOARD) {
        if (!CARD_TEMPLATES[entry.templateId]) {
            log(`⚠ [初始棋盘] 卡牌模板 ${entry.templateId} 不存在，已跳过`, "normal");
            continue;
        }
        const instanceId = entry.instanceId || `init_${entry.templateId}_${idx}`;
        cardsData.push({
            instanceId,
            templateId: entry.templateId,
            x: entry.x,
            y: entry.y,
            next: null,
            parent: null,
            isCaptured: entry.isCaptured !== false
        });
        idx++;
    }
    
    // 同步初始化 cardsMap
    cardsMap.clear();
    cardsData.forEach(card => {
        cardsMap.set(card.instanceId, card);
    });
    
    // 初始化特殊系统（必须在 cardsData 赋值之后，确保引用正确）
    _initSystems();
    
    renderAllCards();
}
