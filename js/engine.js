//  渲染引擎与拖拽逻辑
import { CARD_TEMPLATES } from './config.js';
import { gameState, updateState } from './state.js';
import { log, updateQueryDisplay, toggleSceneModal, updateModalContent, hideEndingReport, showEndingReport, setSystemStatus } from './ui.js';
import { tryCapture, tryOpenComboLock, checkReaction, evaluateInstruction, triggerEnding, showStackProgressBar, hideStackProgressBar } from './logic.js';
import { openDialogue, placeCardInSlot } from './dialogue.js';
import { openReasoningModal, placeCardInReasoningSlot } from './reasoning.js';
import { openExploration, initExplorationModule } from './exploration.js';
import { restoreCardToBoard } from './shared.js';

const boardCanvas = document.getElementById('board-canvas');
let cardsData = [];
let activeDragId = null;
let dragOffsetX = 0; 
let dragOffsetY = 0;
let zIndexCounter = 100;

// 初始化 exploration 模块（使用直接生成，探索本身已有进度条）
initExplorationModule(directSpawnCard, () => cardsData);

export function findCardData(id) { return cardsData.find(c => c.instanceId === id); }
export function isChildOf(parentId, childId) {
    let c = findCardData(parentId); while(c) { if (c.instanceId === childId) return true; c = c.next ? findCardData(c.next) : null; } return false;
}

export function destroyCard(id) {
    cardsData = cardsData.filter(c => c.instanceId !== id);
    const el = document.getElementById(id); if (el) el.remove();
}

export function spawnUnboundCard(templateId, x, y, allowDuplicate = false) {
    // 检查该 templateId 是否已经存在（防重复掉落）
    if (!allowDuplicate) {
        const existing = cardsData.find(c => c.templateId === templateId);
        if (existing) {
            log(`❌ [掉落失败] 【${CARD_TEMPLATES[templateId].name}】已在桌面上，无法重复生成！`, "normal");
            return null;
        }
    }
    
    const newId = 'spawn_' + templateId + '_' + Math.floor(Math.random()*10000);
    const newCard = { instanceId: newId, templateId: templateId, x: x, y: y, next: null, parent: null, isCaptured: true };
    cardsData.push(newCard);
    log(`📡 发现线索：【${CARD_TEMPLATES[templateId].name}】已刷出。`, "capture");
    renderAllCards();
    
    return newCard;  // 返回新生成的卡牌数据
}

export function directSpawnCard(templateId, x, y, allowDuplicate = false) {
    // 检查该 templateId 是否已经存在（防重复掉落）
    if (!allowDuplicate) {
        const existing = cardsData.find(c => c.templateId === templateId);
        if (existing) {
            log(`❌ [掉落失败] 【${CARD_TEMPLATES[templateId].name}】已在桌面上，无法重复生成！`, "normal");
            return;
        }
    }
    
    const newId = 'spawn_' + templateId + '_' + Math.floor(Math.random()*10000);
    cardsData.push({ instanceId: newId, templateId: templateId, x: x, y: y, next: null, parent: null, isCaptured: true });
    log(`✨ 因果固化：实体资产【${CARD_TEMPLATES[templateId].name}】已成功存盘。`, "success");
    renderAllCards();
}

// 🗑️ 回收卡牌功能
export function recycleCard(cardToRecycle, recycleCard, spawnFn, destroyFn) {
    const recycledTemplate = CARD_TEMPLATES[cardToRecycle.templateId];
    const recycleTemplate = CARD_TEMPLATES[recycleCard.templateId];
    
    // 金币卡不可回收（防止无限循环）
    if (cardToRecycle.templateId === 'ITEM_coin') {
        log(`❌ [回收系统] 【${recycledTemplate.name}】是货币，无法回收！`, "normal");
        return;
    }
    
    // 获取回收价值
    const coinValue = recycleTemplate.recycleValue || 10;
    
    // 🌟 1. 建立正常堆叠关系（与堆叠组合相同的逻辑）
    recycleCard.next = cardToRecycle.instanceId;
    cardToRecycle.parent = recycleCard.instanceId;
    renderAllCards();
    
    // 2. 在回收卡位置显示进度条（使用堆叠进度条，与手电筒放人物效果一致）
    const positionX = recycleCard.x + 60; // 卡牌中心位置（卡牌宽度120）
    const positionY = recycleCard.y + 160; // 卡牌正下方
    
    // 显示堆叠进度条
    showStackProgressBar(positionX, positionY, 3000);
    log(`✨ [回收系统] 正在解析【${recycledTemplate.name}】因果结构...`, "success");
    
    // 3秒后执行回收（与堆叠组合相同的延迟执行逻辑）
    setTimeout(() => {
        // 隐藏进度条
        hideStackProgressBar();
        
        // 立即销毁卡牌并生成金币
        destroyFn(cardToRecycle.instanceId);
        
        // 立即在回收卡附近生成金币卡（无额外延迟）
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = (Math.random() - 0.5) * 60;
        const goldCard = spawnFn('ITEM_coin', recycleCard.x + offsetX, recycleCard.y + offsetY + 50, true);
        
        log(`🗑️ [回收系统] 【${recycledTemplate.name}】已被回收，兑换 ${coinValue} 金币！`, "success");
    }, 3000);
}

export function resetVerbCard(verb, originalX, originalY) {
    if (verb.parent) { const p = findCardData(verb.parent); if (p) p.next = null; verb.parent = null; }
    verb.x = originalX; verb.y = originalY; zIndexCounter += 5; verb.zIndex = zIndexCounter;
    renderAllCards();
}

export function breakStackChain(cards) {
    cards.forEach(c => { if(c.parent) { const p = findCardData(c.parent); if(p) p.next = null; c.parent = null; } c.next = null; });
    renderAllCards();
}

export function renderAllCards() {
    // 第一步：收集所有需要渲染的卡牌，并计算它们的最终层级
    const renderQueue = [];
    
    cardsData.forEach(card => {
        let finalX = card.x; 
        let finalY = card.y;
        let baseZIndex = card.zIndex || 100;
        
        // 如果有父级，计算堆叠偏移
        if (card.parent) {
            let p = findCardData(card.parent); 
            let depth = 0;
            while(p) { 
                depth++; 
                finalX = p.x; 
                finalY = p.y + (depth * 24); 
                p = p.parent ? findCardData(p.parent) : null; 
            }
            // 堆叠卡牌的层级基于父级
            baseZIndex = (findCardData(card.parent)?.zIndex || 100) + depth;
        }
        
        // 如果是正在拖动的卡牌，赋予绝对最高层级
        if (card.instanceId === activeDragId) {
            zIndexCounter += 100;
            baseZIndex = zIndexCounter;
        }
        
        renderQueue.push({ card, finalX, finalY, zIndex: baseZIndex });
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
                // 根据卡牌类型打开不同的弹窗
                const cardType = CARD_TEMPLATES[card.templateId].type;
                
                if (cardType === 'char') {
                    // 人物卡牌：打开对话窗口
                    openDialogue(card.templateId);
                } else if (cardType === 'logic') {
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

function startDrag(e, card) {
    if (gameState.isGameOver) return;
    
    activeDragId = card.instanceId;
    
    // 拖拽开始时，将该卡牌及其所有子卡牌的 zIndex 设为全局最高，确保从上方经过
    let current = card;
    const dragStack = [];
    while(current) { 
        dragStack.push(current);
        current = current.next ? findCardData(current.next) : null; 
    }
    
    // 赋予绝对最高层级
    dragStack.forEach(c => {
        zIndexCounter += 10;
        c.zIndex = zIndexCounter;
    });

    if (card.parent) { const p = findCardData(card.parent); if (p) p.next = null; card.parent = null; }
    const rect = document.getElementById(card.instanceId).getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left; dragOffsetY = e.clientY - rect.top;
    document.addEventListener('mousemove', processDrag);
    document.addEventListener('mouseup', endDrag);
    e.stopPropagation();
}

function processDrag(e) {
    if (!activeDragId) return;
    const mainCard = findCardData(activeDragId);
    const canvasRect = boardCanvas.getBoundingClientRect();
    let newX = e.clientX - canvasRect.left - dragOffsetX; let newY = e.clientY - canvasRect.top - dragOffsetY;
    let diffX = newX - mainCard.x; let diffY = newY - mainCard.y;
    let current = mainCard;
    while(current) { current.x += diffX; current.y += diffY; current = current.next ? findCardData(current.next) : null; }
    renderAllCards();
}

function endDrag(e) {
    document.removeEventListener('mousemove', processDrag); document.removeEventListener('mouseup', endDrag);
    if (!activeDragId) return;
    const mainCard = findCardData(activeDragId);
    
    // 检查是否拖拽到对话槽或归因槽中
    const dialogueSlot = document.getElementById('dialogue-slot');
    const dialogueModal = document.getElementById('dialogue-modal');
    
    // 检查对话槽
    if (dialogueSlot && dialogueModal.style.display === 'flex') {
        const slotRect = dialogueSlot.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        if (mouseX >= slotRect.left && mouseX <= slotRect.right &&
            mouseY >= slotRect.top && mouseY <= slotRect.bottom) {
            placeCardInSlot(mainCard);
            activeDragId = null;
            renderAllCards();
            return;
        }
    }
    
    // 检查归因推演槽
    const reasoningModal = document.getElementById('reasoning-modal');
    if (reasoningModal && reasoningModal.style.display === 'flex') {
        for (let i = 0; i < 5; i++) {
            const slot = document.getElementById(`slot-${i}`);
            if (!slot) continue;
            
            const slotRect = slot.getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            
            if (mouseX >= slotRect.left && mouseX <= slotRect.right &&
                mouseY >= slotRect.top && mouseY <= slotRect.bottom) {
                placeCardInReasoningSlot(mainCard, i);
                activeDragId = null;
                renderAllCards();
                return;
            }
        }
    }
    
    // 检查探索窗口槽位
    const explorationModal = document.getElementById('exploration-modal');
    console.log('[拖拽检测] 探索窗口状态:', explorationModal?.style.display);
    
    if (explorationModal && (explorationModal.style.display === 'flex' || explorationModal.style.display === 'block')) {
        console.log('[拖拽检测] 探索窗口已打开，开始检测槽位');
        const explorationSlotsContainer = document.getElementById('exploration-slots');
        if (explorationSlotsContainer) {
            const slots = explorationSlotsContainer.querySelectorAll('.exploration-slot');
            console.log('[拖拽检测] 找到槽位数量:', slots.length);
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            console.log('[拖拽检测] 鼠标位置:', mouseX, mouseY);
            
            for (let i = 0; i < slots.length; i++) {
                const slotRect = slots[i].getBoundingClientRect();
                console.log(`[拖拽检测] 槽位 ${i} 位置:`, slotRect);
                
                if (mouseX >= slotRect.left && mouseX <= slotRect.right &&
                    mouseY >= slotRect.top && mouseY <= slotRect.bottom) {
                    console.log(`[拖拽检测] 鼠标在槽位 ${i} 上！`);
                    // 调用 exploration.js 中的全局函数
                    window.receiveCardForExploration(mainCard);
                    activeDragId = null;
                    renderAllCards();
                    return;
                }
            }
        }
    }
    
    // 检查是否拖放到回收卡牌上
    for (let i = 0; i < cardsData.length; i++) {
        let target = cardsData[i];
        if (target.instanceId === mainCard.instanceId) continue;
        
        // 检查目标是否是回收卡牌
        if (target.templateId === 'ITEM_recycle') {
            if (Math.abs(mainCard.x - target.x) < 80 && Math.abs(mainCard.y - target.y) < 100) {
                // 回收卡牌逻辑（使用直接生成，进度条在 recycleCard 内部显示）
                recycleCard(mainCard, target, directSpawnCard, destroyCard);
                activeDragId = null;
                renderAllCards();
                return;
            }
        }
    }
    
    // 原有的堆叠逻辑
    
    for (let i = 0; i < cardsData.length; i++) {
        let target = cardsData[i];
        if (target.instanceId === mainCard.instanceId || isChildOf(mainCard.instanceId, target.instanceId) || target.next) continue;
        
        if (Math.abs(mainCard.x - target.x) < 80 && Math.abs(mainCard.y - target.y) < 100) {
            // 先建立普通层叠附着（让卡牌先吸附上去）
            target.next = mainCard.instanceId; 
            mainCard.parent = target.instanceId;
            
            // 然后检查是否是结局判定逻辑（无论堆叠顺序如何）
            if (checkReaction(mainCard, target, destroyCard, spawnUnboundCard, directSpawnCard)) {
                activeDragId = null; 
                renderAllCards();
                return;
            }

            if (gameState.isGameOver) break;

            // 普通指令卡逻辑
            if (CARD_TEMPLATES[mainCard.templateId].type === 'action') {
                let stackCards = []; let current = findCardData(mainCard.parent);
                while(current) { if(CARD_TEMPLATES[current.templateId].type !== 'action') stackCards.push(current); current = current.parent ? findCardData(current.parent) : null; }
                setTimeout(() => { evaluateInstruction(mainCard, stackCards, spawnUnboundCard, resetVerbCard, breakStackChain); }, 100);
            }
            break;
        }
    }
    activeDragId = null; renderAllCards();
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

export function initBaseTable() {
    cardsData = [
        // 移除指令卡，所有功能通过堆叠组合实现
        { instanceId: 'i_sdt', templateId: 'ITEM_sdt', x: 40, y: 240, next: null, parent: null, isCaptured: true },
        { instanceId: 's_wz', templateId: 'SCENE_wz', x: 175, y: 240, next: null, parent: null, isCaptured: true },
        { instanceId: 'c_zs', templateId: 'CHAR_zs', x: 310, y: 240, next: null, parent: null, isCaptured: true },
        { instanceId: 'l_reason', templateId: 'LOGIC_reason', x: 445, y: 50, next: null, parent: null, isCaptured: true },
        // 测试线索卡牌
        { instanceId: 'cl_shadow', templateId: 'CLUE_shadow', x: 445, y: 240, next: null, parent: null, isCaptured: true },
        { instanceId: 'cl_whisper', templateId: 'CLUE_whisper', x: 40, y: 430, next: null, parent: null, isCaptured: true },
        { instanceId: 'cl_cold', templateId: 'CLUE_cold', x: 175, y: 430, next: null, parent: null, isCaptured: true },
        // 回收卡牌
        { instanceId: 'i_recycle', templateId: 'ITEM_recycle', x: 580, y: 240, next: null, parent: null, isCaptured: true }
    ];
    renderAllCards();
}
