// 🌟 真名揭示系统 - 真名卡专属逻辑
// 从 engine.js 解耦抽离，通过依赖注入获取底层能力

import { CARD_TEMPLATES } from '../config.js';

/**
 * 真名揭示系统处理器
 * 触发条件: 五感线索堆叠到 ITEM_true_name
 * 核心逻辑: 感官收集 → 五感集齐 → 真名揭示
 */
class TrueNameSystem {
    constructor() {
        /** @type {{ findCardData, cardsMap, cardsData, destroyCard,
         *             renderAllCards, enqueueTask, removeCardFromStack, getTaskQueue,
         *             log, showStackProgressBar, hideStackProgressBar, setSystemStatus }} */
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
     * 检查是否应该触发真名揭示
     * @param {Object} movedCard - 被拖拽的卡牌（线索卡）
     * @param {Object} targetCard - 目标卡牌
     * @returns {boolean}
     */
    canProcess(movedCard, targetCard) {
        const targetTemplate = CARD_TEMPLATES[targetCard.templateId];
        return targetTemplate?.class?.includes('true-name-card');
    }

    /**
     * 处理真名揭示（建立堆叠 + 加入任务队列）
     * @param {Object} mainCard - 线索卡牌
     * @param {Object} targetCard - 真名卡
     */
    processReveal(mainCard, targetCard) {
        const api = this.api;
        const { findCardData, cardsMap, cardsData, destroyCard,
                renderAllCards, enqueueTask, removeCardFromStack, getTaskQueue,
                log, showStackProgressBar, hideStackProgressBar, setSystemStatus } = api;

        const mainTemplate = CARD_TEMPLATES[mainCard.templateId];
        const targetTemplate = CARD_TEMPLATES[targetCard.templateId];

        // 检查是否是线索卡
        if (mainTemplate.type !== 'clue') {
            log(`❌ [真名揭示] 只有线索卡可以用于揭示真名！`, "normal");
            return;
        }

        // 获取线索卡的感官类型
        const senseType = mainTemplate.senseType;
        if (!senseType) {
            log(`❌ [真名揭示] 该线索卡没有定义感官类型！`, "normal");
            return;
        }

        // 初始化已收集感官数组
        if (!targetCard.collectedSenses) {
            targetCard.collectedSenses = [];
        }

        // 检查是否已经收集过该感官
        if (targetCard.collectedSenses.includes(senseType)) {
            log(`❌ [真名揭示] 【${mainTemplate.name}】的感官类型已收集！`, "normal");
            return;
        }

        // 1. 建立堆叠关系（追加到链尾，不覆盖）
        const mainId = mainCard.instanceId;
        if (targetCard.next) {
            let tail = cardsMap.get(targetCard.next);
            while (tail && tail.next) {
                tail = cardsMap.get(tail.next);
            }
            if (tail) {
                tail.next = mainId;
                mainCard.parent = tail.instanceId;
            } else {
                targetCard.next = mainId;
                mainCard.parent = targetCard.instanceId;
            }
        } else {
            targetCard.next = mainId;
            mainCard.parent = targetCard.instanceId;
        }
        renderAllCards();

        const senseNames = { vision: '视觉', hearing: '听觉', taste: '味觉', touch: '触觉', smell: '嗅觉' };

        // 2. 加入任务队列
        enqueueTask(targetCard.instanceId, mainId, (done, storeTimeout) => {
            const mainCardRef = findCardData(mainId);
            if (!mainCardRef) {
                done();
                return;
            }

            if (targetCard.collectedSenses.includes(senseType)) {
                log(`❌ [真名揭示] 【${mainTemplate.name}】的感官类型已收集！`, "normal");
                if (mainCardRef.parent) {
                    const parent = findCardData(mainCardRef.parent);
                    if (parent) parent.next = null;
                }
                renderAllCards();
                done();
                return;
            }

            showStackProgressBar(targetCard.instanceId, 2000);
            log(`✨ [真名揭示] 正在解析【${senseNames[senseType]}】感官数据...`, "success");

            const timeoutId = setTimeout(() => {
                hideStackProgressBar(targetCard.instanceId);

                const currentMainCard = findCardData(mainId);
                if (!currentMainCard || !currentMainCard.parent) {
                    log(`⚠️ [真名揭示中断] 卡牌已分离，揭示取消`, "normal");
                    done();
                    return;
                }

                if (targetCard.collectedSenses.includes(senseType)) {
                    log(`❌ [真名揭示] 【${mainTemplate.name}】的感官类型已收集！`, "normal");
                    if (currentMainCard.parent) {
                        const parent = findCardData(currentMainCard.parent);
                        if (parent) parent.next = null;
                    }
                    renderAllCards();
                    done();
                    return;
                }

                targetCard.collectedSenses.push(senseType);

                const targetSenses = targetTemplate.targetSenses || ['vision', 'hearing', 'taste', 'touch', 'smell'];
                const allCollected = targetSenses.every(sense => targetCard.collectedSenses.includes(sense));

                if (allCollected) {
                    log(`🎉 [真名揭示] 五感集齐！【${targetTemplate.realName}】降临！`, "success");
                    setSystemStatus(`● 真名已揭示 // 旧日支配者苏醒`, '#ffd700');

                    const q = getTaskQueue(targetCard.instanceId);
                    q.preemptedStack = [];

                    // 先读取位置，再销毁
                    const targetEl = document.getElementById(targetCard.instanceId);
                    const actualX = targetEl ? parseInt(targetEl.style.left) : targetCard.x;
                    const actualY = targetEl ? parseInt(targetEl.style.top) : targetCard.y;

                    destroyCard(targetCard.instanceId);
                    destroyCard(mainId);

                    const offsetX = (Math.random() - 0.5) * 40;
                    const offsetY = (Math.random() - 0.5) * 40;
                    const revealedCard = {
                        instanceId: 'revealed_' + targetCard.instanceId,
                        templateId: targetCard.templateId,
                        x: actualX + offsetX,
                        y: actualY + offsetY + 50,
                        next: null,
                        parent: null,
                        isCaptured: true,
                        isRevealed: true,
                        collectedSenses: [...targetSenses]
                    };
                    cardsData.push(revealedCard);
                    cardsMap.set(revealedCard.instanceId, revealedCard);

                    log(`✨ [真名揭示] 新卡牌已生成！双击查看详情。`, "success");
                    done();
                } else {
                    const progress = targetCard.collectedSenses.length / targetSenses.length * 100;
                    log(`📊 [真名揭示] 揭示进度: ${targetCard.collectedSenses.length}/${targetSenses.length} (${Math.round(progress)}%)`, "success");

                    removeCardFromStack(mainId);
                    destroyCard(mainId);
                }

                renderAllCards();
                done();
            }, 2000);

            storeTimeout(timeoutId);
        });
    }
}

export const trueNameSystem = new TrueNameSystem();
