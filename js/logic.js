// 🎮 核心游戏逻辑：合成、捕获与结局判定
import { CARD_TEMPLATES, CARD_COMBINATIONS } from './config.js';
import { gameState, updateState } from './state.js';
import { log, showEndingReport, setSystemStatus, updateModalContent, toggleSceneModal } from './ui.js';
import { showStackProgressBar, hideStackProgressBar, showSpeechBubble, hideSpeechBubble } from './renderer.js';
import { CARD } from './consts.js';

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

export function checkReaction(moved, target, destroyCard, spawnUnboundCard, directSpawnCard) {
    if (gameState.isGameOver) return false;

    // 生成无序组合键（确保 A+B 和 B+A 相同）
    const combinationKey = [moved.templateId, target.templateId].sort().join('+');
    const rule = CARD_COMBINATIONS[combinationKey];
    
    if (!rule) {
        // 没有匹配的组合，使用默认堆叠逻辑
        return false;
    }

    // 找到匹配的组合，显示进度条
    // 进度条显示在堆叠位置的正下方（使用两张卡牌的中心点中点）
    const positionX = (moved.x + target.x + CARD.WIDTH) / 2;
    const positionY = target.y + CARD.DROP_OFFSET_Y;

    // 特效类组合（speech）：显示气泡，不产出卡牌
    if (rule.type === 'speech') {
        showSpeechBubble(positionX, target.y, rule.speechText, rule.speechDuration || 2500);
        log(`✨ [${rule.type}] ${rule.message}`, "success");
        setTimeout(() => {
            hideSpeechBubble();
        }, rule.speechDuration || 2500);
        return true;
    }

    showStackProgressBar(positionX, positionY, rule.delay);
    log(`✨ [${rule.type}] ${rule.message}`, "success");
    
    // 延迟执行结果
    setTimeout(() => {
        // 隐藏进度条
        hideStackProgressBar();
        
        // 概率检查：如果规则有 chance 属性，需要先判断概率
        const hasChance = rule.chance !== undefined && rule.chance < 1;
        const rollSuccess = !hasChance || Math.random() <= rule.chance;
        
        if (hasChance && !rollSuccess) {
            // 概率失败
            if (rule.failMessage) {
                log(`❌ [概率失败] ${rule.failMessage}`, "normal");
            }
            return; // 不生成卡牌，直接返回
        }
        
        // 生成结果卡牌
        rule.result.forEach((resultTemplateId, index) => {
            // 扇形分布生成位置
            const offsetX = (index - (rule.result.length - 1) / 2) * 140;
            directSpawnCard(resultTemplateId, positionX + offsetX, positionY);
        });
        
        // 处理原料卡消耗
        console.log('[消耗检查]', {
            movedTemplate: CARD_TEMPLATES[moved.templateId],
            targetTemplate: CARD_TEMPLATES[target.templateId],
            movedId: moved.instanceId,
            targetId: target.instanceId
        });
        
        if (rule.consumeAll) {
            console.log('🗑️ 全部消耗模式');
            destroyCard(moved.instanceId);
            destroyCard(target.instanceId);
        } else {
            // 根据每张卡牌自身的 consumable 属性决定是否消耗
            const movedConsumable = CARD_TEMPLATES[moved.templateId].consumable;
            const targetConsumable = CARD_TEMPLATES[target.templateId].consumable;
            
            console.log('📦 智能消耗 - 根据卡牌 consumable 属性:');
            
            if (movedConsumable) {
                console.log(`🗑️ 消耗移动的卡: ${moved.instanceId} (consumable=${movedConsumable})`);
                destroyCard(moved.instanceId);
            } else {
                console.log(`✅ 保留移动的卡: ${moved.instanceId} (consumable=${movedConsumable})`);
            }
            
            if (targetConsumable) {
                console.log(`️ 消耗目标的卡: ${target.instanceId} (consumable=${targetConsumable})`);
                destroyCard(target.instanceId);
            } else {
                console.log(`✅ 保留目标的卡: ${target.instanceId} (consumable=${targetConsumable})`);
            }
        }
        
        // 显示成功消息（如果有）
        if (rule.successMessage && hasChance) {
            log(`✅ [概率成功] ${rule.successMessage}`, "success");
        } else {
            log(`✅ [组合完成] 已生成 ${rule.result.length} 张新卡牌`, "success");
        }
    }, rule.delay);
    
    return true; // 阻止默认堆叠
}
