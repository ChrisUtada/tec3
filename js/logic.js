// 🎮 核心游戏逻辑：合成、捕获与结局判定
import { CARD_TEMPLATES, CARD_COMBINATIONS, OBSERVATION_TEXTS, SCENE_EXPLORATION } from './config.js';
import { gameState, updateState } from './state.js';
import { log, showEndingReport, setSystemStatus, updateModalContent, toggleSceneModal, showObservationModal } from './ui.js';
import { showStackProgressBar, hideStackProgressBar, showSpeechBubble, hideSpeechBubble } from './renderer.js';
import { CARD } from './consts.js';

// 导入全局任务标志
let isAnyTaskProcessing = false;
export function setTaskProcessing(value) {
    isAnyTaskProcessing = value;
}
export function getTaskProcessing() {
    return isAnyTaskProcessing;
}

// 重新导出 renderer 中的 DOM 操作，保持向后兼容
export { showStackProgressBar, hideStackProgressBar };

export function tryCapture(card, cardEl) {
    if (card.isCaptured) return false;
    card.isCaptured = true;
    cardEl.classList.remove('unbound');
    const tag = cardEl.querySelector('.card-status-tag'); if (tag) tag.remove();
    
    log(`📥 [Datanodes] 线索【${CARD_TEMPLATES[card.templateId].name}】已被你手动收集进入数据节点！`, "capture");
    
    if (card.templateId === 'CLUE_tx') {
        updateState('hasSanityPollution', true);
        log(`️ [世界线偏转] 系统检测到异化数据入库，“铁锈的味道”污染了后续时空！`, "capture");
    }

    return true;
}

export function executePendingEnding(card) {
    if (!card || !card.isCaptured) return;
    
    updateState('lastTriggeredClueId', card.instanceId);
    updateState('pendingEndingClueId', null);

    if (card.templateId === 'CLUE_tx' && gameState.hasSanityPollution) {
        triggerEnding("👅【因果品尝 (Taste) 结局 // 吞噬废墟】", 
            `你将【铁锈的味道】彻底倾倒并覆盖在【荒宅院落】之上。\n\n猩红色的数据波浪从桌面上爆发...`);
    } else if (card.templateId === 'CLUE_hz_inside' && gameState.hasSanityPollution) {
        triggerEnding("👁️【真名展现 (Reveal) 结局 // 历史剥离】", 
            `你将手动捕获的【宗族谱本】郑重铺在【荒宅院落】的尘土堆里...\n\n维度回归，世界线平息。`);
    } else if (card.templateId === 'CLUES_xhpb') {
        triggerEnding("🌿【常态结局 // 平稳回归】", 
            `你用【信号屏蔽】将【荒宅院落】的波动切断。\n\n你作为一个凡人，平静地回归了主现实。`);
    } else {
        // 如果是不符合结局条件的卡牌，给予提示
        log(`❌ [因果驳回] 线索【${CARD_TEMPLATES[card.templateId].name}】无法与荒宅产生终局共鸣。`, "normal");
    }
}

export function tryOpenComboLock(card, destroyCard, spawnUnboundCard) {
    if (gameState.isGameOver) return;
    if (card.templateId === 'ITEM_mmh') {
        let pwd = prompt("【T.E.C-OS 机械闭锁矩阵】\n请输入3位数字代码：");
        if (pwd === "305") {
            log("🔓 [破译校验通过] 铁盒瞬间碎裂解离！", "success");
            destroyCard(card.instanceId);
            spawnUnboundCard('CLUE_hz_inside', card.x, card.y);
        } else if (pwd !== null) {
            log("❌ [校验不通过] 机械结构未响应。", "normal");
        }
    }
}

export function triggerEnding(title, story) {
    updateState('isGameOver', true);
    
    const color = title.includes('品尝') ? 'var(--color-taste)' : 'var(--color-vision)';
    setSystemStatus(`● 终局规约触发现场 // 允许因果回溯`, color);
    
    showEndingReport(title, story);
    log(`🏁 【因果宣告成功】达成：${title}。你可以点击按钮收起报告，继续玩并解谜其他结局。`, "success");
}

// 构建观测掉落情报
function buildDropInfo(templateId) {
    const typeNames = { 'scene': '场景', 'char': '人物', 'item': '物品', 'clue': '线索' };
    const types = new Set();

    // 如果观测的是场景，收集其掉落的卡牌类型
    const sceneData = SCENE_EXPLORATION[templateId];
    if (sceneData) {
        for (const d of (sceneData.drops || [])) {
            const t = CARD_TEMPLATES[d.templateId];
            if (t && typeNames[t.type]) types.add(typeNames[t.type]);
        }
        for (const g of (sceneData.dropGroups || [])) {
            for (const d of (g.drops || [])) {
                const t = CARD_TEMPLATES[d.templateId];
                if (t && typeNames[t.type]) types.add(typeNames[t.type]);
            }
        }
    }

    return types.size ? `─── 潜在关联 ───\n可掉落：${[...types].join('、')}` : '';
}

export function checkReaction(moved, target, destroyCard, spawnUnboundCard, directSpawnCard) {
    if (gameState.isGameOver) return false;

    // 观测卡：拖放到任意卡牌上触发叙事文本（双向检测，有观测进度）
    if (moved.templateId === 'LOGIC_observe' || target.templateId === 'LOGIC_observe') {
        const observed = moved.templateId === 'LOGIC_observe' ? target : moved;
        const observedTemplate = CARD_TEMPLATES[observed.templateId];
        const cardName = observedTemplate ? observedTemplate.name : observed.templateId;
        let text = OBSERVATION_TEXTS[observed.templateId];
        if (!text) {
            const fallbacks = {
                char: '这个人身上有一种难以言明的气息。他经历的比你多，但愿意说的比你少。',
                item: '这个物品在光线下的质感不太对劲。它的影子比实物大了一圈。',
                scene: '这个场景在你眨眼后会微妙地变化。门的位置、窗户的数量——总有什么不对劲。',
                clue: '这条线索指向一个你不确定是否想去的方向。有些真相知道了就无法回头。',
                logic: '一张写满规则的功能卡。但规则在这里是被用来打破的。'
            };
            text = fallbacks[observedTemplate?.type] || '你仔细观察着它，感受到一种难以名状的不安。';
        }
        
        const observeDelay = 2500;
        showStackProgressBar(observed.instanceId, observeDelay);
        isAnyTaskProcessing = true;

        // 构建掉落情报
        const dropInfo = buildDropInfo(observed.templateId);
        
        const timeoutId = setTimeout(() => {
            delete observed.pendingTimeoutId;
            hideStackProgressBar(observed.instanceId);
            showObservationModal(cardName, text, dropInfo);
            isAnyTaskProcessing = false;
        }, observeDelay);
        
        observed.pendingTimeoutId = timeoutId;
        return true;
    }

    // 生成无序组合键（确保 A+B 和 B+A 相同）
    const combinationKey = [moved.templateId, target.templateId].sort().join('+');
    const rule = CARD_COMBINATIONS[combinationKey];
    
    if (!rule) {
        // 没有匹配的组合，使用默认堆叠逻辑
        return false;
    }

    // 找到匹配的组合，显示进度条
    //  不提前计算掉落位置，延迟到进度条完成时再计算（使用卡牌的最新位置）

    // 特效类组合（speech）：显示气泡，不产出卡牌
    if (rule.type === 'speech') {
        // speech 类型立即计算位置（因为不需要延迟）
        const targetEl = document.getElementById(target.instanceId);
        let positionX, positionY;
        if (targetEl) {
            const targetLeft = parseInt(targetEl.style.left) || target.x;
            const targetTop = parseInt(targetEl.style.top) || target.y;
            positionX = targetLeft + CARD.WIDTH / 2;
            positionY = targetTop + CARD.DROP_OFFSET_Y;
        } else {
            positionX = target.x + CARD.WIDTH / 2;
            positionY = target.y + CARD.DROP_OFFSET_Y;
        }
        
        showSpeechBubble(positionX, target.y, rule.speechText, rule.speechDuration || 2500);
        log(`✨ [${rule.type}] ${rule.message}`, "success");
        
        //  保存 speech timeoutId，以便需要时取消
        const speechTimeoutId = setTimeout(() => {
            hideSpeechBubble();
        }, rule.speechDuration || 2500);
        
        // 将 timeoutId 附加到 target 卡牌（可选，用于高级控制）
        target.speechTimeoutId = speechTimeoutId;
        
        return true;
    }

    // 显示进度条（进度条在目标卡牌上）
    showStackProgressBar(target.instanceId, rule.delay);

    //  设置全局任务标志，阻止其他堆叠操作
    isAnyTaskProcessing = true;

    log(`✨ [${rule.type}] ${rule.message}`, "success");

    //  延迟执行结果
    const timeoutId = setTimeout(() => {

        // 清除 pendingTimeoutId
        delete target.pendingTimeoutId;
        
        // 隐藏进度条
        hideStackProgressBar(target.instanceId);
        
        //  重新计算掉落位置（使用卡牌的最新位置，可能是拖拽后的新位置）
        const targetEl = document.getElementById(target.instanceId);
        let positionX, positionY;
        
        if (targetEl) {
            // 使用目标卡牌的 DOM 最新位置
            const targetLeft = parseInt(targetEl.style.left) || target.x;
            const targetTop = parseInt(targetEl.style.top) || target.y;
            
            // 掉落位置：在目标卡牌下方，水平居中
            positionX = targetLeft + CARD.WIDTH / 2;
            positionY = targetTop + CARD.DROP_OFFSET_Y;
        } else {
            // 回退到使用数据坐标
            positionX = target.x + CARD.WIDTH / 2;
            positionY = target.y + CARD.DROP_OFFSET_Y;
        }

        // 概率检查：如果规则有 chance 属性，需要先判断概率
        const hasChance = rule.chance !== undefined && rule.chance < 1;
        const rollSuccess = !hasChance || Math.random() <= rule.chance;

        if (hasChance && !rollSuccess) {
            // 概率失败
            if (rule.failMessage) {
                log(`❌ [概率失败] ${rule.failMessage}`, "normal");
            }
            // 清除全局任务标志
            isAnyTaskProcessing = false;
            return; // 不生成卡牌，直接返回
        }

        //  检查堆叠关系是否仍然存在（玩家可能已经拖拽分开了卡牌）
        if (!moved.parent || moved.parent !== target.instanceId) {
            log(`️ [组合中断] 卡牌已分离，任务取消`, "normal");
            // 清除全局任务标志
            isAnyTaskProcessing = false;
            return; // 不生成卡牌，直接返回
        }
        
        // 生成结果卡牌
        rule.result.forEach((resultTemplateId, index) => {
            // 扇形分布生成位置
            const offsetX = (index - (rule.result.length - 1) / 2) * 140;
            directSpawnCard(resultTemplateId, positionX + offsetX, positionY);
        });
        
        // 处理原料卡消耗：由每张卡牌自身的 consumable 属性决定
        if (CARD_TEMPLATES[moved.templateId].consumable) {
            destroyCard(moved.instanceId);
        }
        if (CARD_TEMPLATES[target.templateId].consumable) {
            destroyCard(target.instanceId);
        }

        // 显示成功消息（如果有）
        if (rule.successMessage && hasChance) {
            log(`✅ [概率成功] ${rule.successMessage}`, "success");
        } else {
            log(`✅ [组合完成] 已生成 ${rule.result.length} 张新卡牌`, "success");
        }

        // 清除全局任务标志
        isAnyTaskProcessing = false;
    }, rule.delay);

    //  保存 timeoutId 到目标卡牌，以便在卡牌分离时取消任务
    target.pendingTimeoutId = timeoutId;

    return true; // 阻止默认堆叠
}
