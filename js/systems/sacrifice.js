// 🗑️ 献祭系统 - 回收卡牌专属逻辑
// 从 engine.js 解耦抽离，通过依赖注入获取底层能力

import { CARD_TEMPLATES } from '../config.js';

/**
 * 献祭系统处理器
 * 触发条件: 任意卡牌堆叠到 ITEM_recycle
 * 核心逻辑: 卡牌回收 → 生成因果律金币
 */
class SacrificeSystem {
    constructor() {
        /** @type {{ findCardData, cardsMap, destroyCard, directSpawnCard,
         *             renderAllCards, enqueueTask, removeCardFromStack,
         *             log, showStackProgressBar, hideStackProgressBar }} */
        this.api = null;
    }

    /**
     * 初始化，注入依赖
     * @param {Object} api - 底层能力 API
     */
    init(api) {
        this.api = api;
    }

    /**
     * 检查是否应该触发献祭
     * @param {Object} movedCard - 被拖拽的卡牌
     * @param {Object} targetCard - 目标卡牌
     * @returns {boolean}
     */
    canProcess(movedCard, targetCard) {
        return targetCard.templateId === 'ITEM_recycle';
    }

    /**
     * 沿 parent 链追溯，检查卡牌是否仍连接到指定功能卡
     * @param {Object} card - 当前卡牌
     * @param {string} functionCardId - 功能卡（回收站）ID
     * @returns {boolean}
     */
    _isStillConnectedTo(card, functionCardId) {
        let current = this.api.cardsMap.get(card.parent);
        while (current) {
            if (current.instanceId === functionCardId) return true;
            if (!current.parent) return false;
            current = this.api.cardsMap.get(current.parent);
        }
        return false;
    }

    /**
     * 处理献祭（建立堆叠 + 加入任务队列）
     * @param {Object} cardToRecycle - 要被回收的卡牌
     * @param {Object} recycleCard - 回收站卡牌
     */
    processSacrifice(cardToRecycle, recycleCard) {
        const api = this.api;
        const { findCardData, cardsMap, destroyCard, directSpawnCard,
                renderAllCards, enqueueTask, removeCardFromStack,
                log, showStackProgressBar, hideStackProgressBar } = api;

        const recycledTemplate = CARD_TEMPLATES[cardToRecycle.templateId];
        const recycleTemplate = CARD_TEMPLATES[recycleCard.templateId];

        // 金币卡不可回收（防止无限循环）
        if (cardToRecycle.templateId === 'ITEM_coin') {
            log(`❌ [回收系统] 【${recycledTemplate.name}】是货币，无法回收！`, "normal");
            return;
        }

        const coinValue = recycleTemplate.recycleValue || 10;
        const recycledId = cardToRecycle.instanceId;

        // 1. 建立正常堆叠关系（追加到链尾，不覆盖）
        if (recycleCard.next) {
            let tail = cardsMap.get(recycleCard.next);
            while (tail && tail.next) {
                const nextCard = cardsMap.get(tail.next);
                if (!nextCard) {
                    tail.next = null;
                    break;
                }
                tail = nextCard;
            }
            if (tail) {
                tail.next = recycledId;
                cardToRecycle.parent = tail.instanceId;
            } else {
                recycleCard.next = recycledId;
                cardToRecycle.parent = recycleCard.instanceId;
            }
        } else {
            recycleCard.next = recycledId;
            cardToRecycle.parent = recycleCard.instanceId;
        }
        renderAllCards();

        // 2. 加入任务队列（抢占式，新卡顶旧卡）
        enqueueTask(recycleCard.instanceId, recycledId, (done, storeTimeout) => {
            const cardRef = findCardData(recycledId);
            if (!cardRef || !cardRef.parent || !this._isStillConnectedTo(cardRef, recycleCard.instanceId)) {
                log(`⚠️ [献祭系统] 卡牌已分离，跳过`, "normal");
                done();
                return;
            }

            showStackProgressBar(recycleCard.instanceId, 3000);
            log(`✨ [献祭系统] 正在解析【${recycledTemplate.name}】因果结构...`, "success");

            const timeoutId = setTimeout(() => {
                hideStackProgressBar(recycleCard.instanceId);

                const currentRecycledCard = findCardData(recycledId);
                if (!currentRecycledCard || !currentRecycledCard.parent || !this._isStillConnectedTo(currentRecycledCard, recycleCard.instanceId)) {
                    log(`⚠️ [献祭中断] 卡牌已分离，回收取消`, "normal");
                    done();
                    return;
                }

                removeCardFromStack(recycledId);
                destroyCard(recycledId);

                const currentRecycleCard = findCardData(recycleCard.instanceId);
                if (currentRecycleCard) {
                    const recycleEl = document.getElementById(recycleCard.instanceId);
                    const actualX = recycleEl ? parseInt(recycleEl.style.left) : currentRecycleCard.x;
                    const actualY = recycleEl ? parseInt(recycleEl.style.top) : currentRecycleCard.y;

                    let offsetX, offsetY;
                    do {
                        const side = Math.random() > 0.5 ? 1 : -1;
                        offsetX = side * (60 + Math.random() * 60);
                        offsetY = (Math.random() - 0.5) * 60;
                    } while (Math.abs(offsetX) < 50);

                    directSpawnCard('ITEM_coin', actualX + offsetX, actualY + offsetY);
                }

                log(`🗑️ [献祭系统] 【${recycledTemplate.name}】已被献祭，获得 ${coinValue} 因果律！`, "success");
                done();
            }, 3000);

            storeTimeout(timeoutId);
        });
    }
}

export const sacrificeSystem = new SacrificeSystem();
