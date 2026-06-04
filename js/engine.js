//  渲染引擎与拖拽逻辑
import { CARD_TEMPLATES } from './config.js';
import { gameState, updateState } from './state.js';
import { log, updateQueryDisplay, toggleSceneModal, updateModalContent, hideEndingReport, showEndingReport, setSystemStatus, openTrueNameModal } from './ui.js';
import { tryCapture, tryOpenComboLock, checkReaction, triggerEnding, getTaskProcessing, setTaskProcessing } from './logic.js';
import { showStackProgressBar, hideStackProgressBar, updateProgressBarPosition, hideSpeechBubble } from './renderer.js';
import { openDialogue, placeCardInSlot } from './dialogue.js';
import { openReasoningModal, placeCardInReasoningSlot } from './reasoning.js';
import { openExploration, initExplorationModule, placeCardInExplorationSlot } from './exploration.js';
import { restoreCardToBoard } from './shared.js';
import { CARD } from './consts.js';
import { sacrificeSystem } from './systems/sacrifice.js';
import { trueNameSystem } from './systems/truename.js';
import { taskManager } from './core/task-manager.js';
import { stackSystem } from './core/stack-system.js';
import { dragSystem } from './core/drag-system.js';

const boardCanvas = document.getElementById('board-canvas');
let cardsData = [];
let cardsMap = new Map(); // 性能优化：O(1) 查找

//  暴露获取 cardsData 的函数，供 renderer.js 使用
window.getCardsData = () => cardsData;

// 卡牌类型固定层级（数值越大越上层）
const Z_INDEX = {
    scene: 100,    // 场景卡最底层
    char: 200,     // 人物卡
    item: 300,     // 道具卡
    equipment: 350, // 装备卡
    clue: 400,     // 线索卡最上层
    logic: 500,   // 逻辑归因卡
};

// 初始化 exploration 模块（使用直接生成，探索本身已有进度条）
initExplorationModule(directSpawnCard, () => cardsData);

export function findCardData(id) { 
    return cardsMap.get(id); // O(1) 查找替代 O(n) find
}
export function destroyCard(id) {
    const idx = cardsData.findIndex(c => c.instanceId === id);
    if (idx !== -1) cardsData.splice(idx, 1);
    cardsMap.delete(id); // 同步删除 Map
    const el = document.getElementById(id); 
    if (el) el.remove();
}

export function spawnUnboundCard(templateId, x, y, allowDuplicate = false) {
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
    log(`📡 发现线索：【${CARD_TEMPLATES[templateId].name}】已刷出。`, "capture");
    renderAllCards();
    
    return newCard;  // 返回新生成的卡牌数据
}

export function directSpawnCard(templateId, x, y, allowDuplicate = false) {
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
    log(`✨ 因果固化：实体资产【${CARD_TEMPLATES[templateId].name}】已成功存盘。`, "success");
    renderAllCards();
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
        
        // 拖动中的卡牌赋予最高层级
        if (card.instanceId === dragSystem.activeDragId) {
            zIndex = 9999;
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
            
            cardEl.className = `card ${t.class} ${card.isCaptured ? '' : 'unbound'}`;
            
            // 真名卡特殊处理
            if (t.class.includes('true-name-card')) {
                const isRevealed = card.isRevealed || t.isRevealed || false;
                const collectedSenses = card.collectedSenses || t.collectedSenses || [];
                
                if (isRevealed) {
                    cardEl.classList.add('revealed');
                }
                
                const senseIcons = ['vision', 'hearing', 'taste', 'touch', 'smell'].map(sense => {
                    const icons = { vision: '👁️', hearing: '👂', taste: '👅', touch: '🤚', smell: '👃' };
                    const isCollected = collectedSenses.includes(sense);
                    return `<span class="sense-icon ${sense} ${isCollected ? 'collected' : ''}">${icons[sense]}</span>`;
                }).join('');
                
                cardEl.innerHTML = `
                    <div class="true-name-senses">${senseIcons}</div>
                    <div class="card-name">${isRevealed ? t.realName : t.name}</div>
                    ${card.isCaptured ? '' : '<div class="card-status-tag">Datanodes 离线 [点选]</div>'}
                    <div class="card-type-tag">${isRevealed ? 'revealed' : t.type}</div>
                `;
            } else {
                cardEl.innerHTML = `
                    <div class="card-name">${t.name}</div>
                    ${card.isCaptured ? '' : '<div class="card-status-tag">Datanodes 离线 [点选]</div>'}
                    <div class="card-type-tag">${t.type}</div>
                `;
            }
            
            cardEl.addEventListener('mousedown', (e) => {
                updateQueryDisplay(card, t);
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
                // 根据卡牌类型打开不同的弹窗
                const cardType = CARD_TEMPLATES[card.templateId].type;
                
                if (cardType === 'char') {
                    // 人物卡牌：打开对话窗口
                    openDialogue(card.templateId);
                } else if (cardType === 'logic' && card.templateId === 'LOGIC_reason') {
                    // 逻辑归因卡牌：打开归因推演窗口
                    openReasoningModal();
                } else if (cardType === 'scene') {
                    // 场景卡牌：打开探索窗口
                    openExploration(card.templateId);
                } else if (t.class.includes('true-name-card') && (card.isRevealed || t.isRevealed)) {
                    // 真名卡：打开真名信息窗口
                    openTrueNameModal(card, t);
                } else {
                    // 其他卡牌：密码盒等
                    tryOpenComboLock(card, destroyCard, spawnUnboundCard);
                }
            });
            boardCanvas.appendChild(cardEl);
        } else {
            // 更新真名卡的显示
            const t = CARD_TEMPLATES[card.templateId];
            if (t.class.includes('true-name-card')) {
                const isRevealed = card.isRevealed || t.isRevealed || false;
                const collectedSenses = card.collectedSenses || t.collectedSenses || [];
                
                if (isRevealed) {
                    cardEl.classList.add('revealed');
                } else {
                    cardEl.classList.remove('revealed');
                }
                
                const senseIcons = ['vision', 'hearing', 'taste', 'touch', 'smell'].map(sense => {
                    const icons = { vision: '👁️', hearing: '👂', taste: '👅', touch: '🤚', smell: '👃' };
                    const isCollected = collectedSenses.includes(sense);
                    return `<span class="sense-icon ${sense} ${isCollected ? 'collected' : ''}">${icons[sense]}</span>`;
                }).join('');
                
                cardEl.innerHTML = `
                    <div class="true-name-senses">${senseIcons}</div>
                    <div class="card-name">${isRevealed ? t.realName : t.name}</div>
                    ${card.isCaptured ? '' : '<div class="card-status-tag">Datanodes 离线 [点选]</div>'}
                    <div class="card-type-tag">${isRevealed ? 'revealed' : t.type}</div>
                `;
            }
        }

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
    });
}

export function syncModalAssets() {
    if (gameState.sceneSynced) return;
    directSpawnCard('SCENES_hzyl', 250, 420);
    if (gameState.hasSanityPollution) {
        directSpawnCard('ITEM_tz', 390, 420); 
        log("✨ 异界物质激化：【五行贴纸】无限制落地！", "success");
    } else {
        spawnUnboundCard('CLUES_xhpb', 390, 420); 
        log("✨ 常态信息投影：落地【线索：信号屏蔽】（需手动捕获）。", "success");
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
        cardsData,
        sacrificeSystem,
        trueNameSystem,
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
    trueNameSystem.init(api);
}

export function initBaseTable() {
    cardsData = [
        // 移除指令卡，所有功能通过堆叠组合实现
        { instanceId: 'i_sdt', templateId: 'ITEM_sdt', x: 40, y: 240, next: null, parent: null, isCaptured: true },
        { instanceId: 's_wz', templateId: 'SCENE_wz', x: 175, y: 240, next: null, parent: null, isCaptured: true },
        { instanceId: 'c_zs', templateId: 'CHAR_zs', x: 310, y: 240, next: null, parent: null, isCaptured: true },
        { instanceId: 'c_investigator', templateId: 'CHAR_investigator', x: 40, y: 50, next: null, parent: null, isCaptured: true },
        { instanceId: 'l_reason', templateId: 'LOGIC_reason', x: 445, y: 50, next: null, parent: null, isCaptured: true },
        // 测试线索卡牌
        { instanceId: 'cl_shadow', templateId: 'CLUE_shadow', x: 445, y: 240, next: null, parent: null, isCaptured: true },
        { instanceId: 'cl_whisper', templateId: 'CLUE_whisper', x: 40, y: 430, next: null, parent: null, isCaptured: true },
        { instanceId: 'cl_cold', templateId: 'CLUE_cold', x: 175, y: 430, next: null, parent: null, isCaptured: true },
        // 回收卡牌
        { instanceId: 'i_recycle', templateId: 'ITEM_recycle', x: 580, y: 240, next: null, parent: null, isCaptured: true },
        // 捕获功能卡
        { instanceId: 'l_capture', templateId: 'LOGIC_capture', x: 310, y: 50, next: null, parent: null, isCaptured: true },
        // 真名卡
        { instanceId: 'i_true_name', templateId: 'ITEM_true_name', x: 310, y: 430, next: null, parent: null, isCaptured: true, isRevealed: false, collectedSenses: [] },
        // 五感线索卡（用于测试真名揭示）
        { instanceId: 'cl_vision', templateId: 'CLUE_vision_eye', x: 445, y: 430, next: null, parent: null, isCaptured: true },
        { instanceId: 'cl_hearing', templateId: 'CLUE_hearing_echo', x: 580, y: 430, next: null, parent: null, isCaptured: true },
        { instanceId: 'cl_taste', templateId: 'CLUE_taste_metal', x: 715, y: 240, next: null, parent: null, isCaptured: true },
        { instanceId: 'cl_touch', templateId: 'CLUE_touch_ice', x: 715, y: 430, next: null, parent: null, isCaptured: true },
        { instanceId: 'cl_smell', templateId: 'CLUE_smell_rot', x: 715, y: 50, next: null, parent: null, isCaptured: true }
    ];
    
    // 同步初始化 cardsMap
    cardsMap.clear();
    cardsData.forEach(card => {
        cardsMap.set(card.instanceId, card);
    });
    
    // 初始化特殊系统（必须在 cardsData 赋值之后，确保引用正确）
    _initSystems();
    
    renderAllCards();
}
