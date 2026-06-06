// 拖拽管理系统 - 处理卡牌的拖拽、移动、吸附、特殊系统检测完整流程
// 依赖注入设计：所有外部依赖通过 init() 注入，不直接 import 业务模块

export class DragSystem {
    constructor() {
        this._activeDragId = null;
        this._dragOffsetX = 0;
        this._dragOffsetY = 0;
        this._deps = {};
        this._boundProcessDrag = null;
        this._boundEndDrag = null;
    }

    /** @returns {string|null} 当前拖拽中的卡牌ID */
    get activeDragId() { return this._activeDragId; }

    /**
     * 依赖注入初始化
     * @param {Object} deps
     */
    init(deps) {
        this._deps = deps;
        this._boundProcessDrag = this._processDrag.bind(this);
        this._boundEndDrag = this._endDrag.bind(this);
    }

    // ==================== 拖拽开始 ====================

    /**
     * 开始拖拽（由 mousedown 触发）
     * @param {MouseEvent} e
     * @param {Object} card - 卡牌数据对象
     */
    startDrag(e, card) {
        const d = this._deps;
        if (d.gameState.isGameOver) return;

        this._activeDragId = card.instanceId;

        // 取消卡牌语音气泡
        if (card.speechTimeoutId) {
            clearTimeout(card.speechTimeoutId);
            delete card.speechTimeoutId;
            d.hideSpeechBubble();
        }

        // 如果卡牌是堆叠的一部分，处理父卡牌关系
        if (card.parent) {
            // 沿 parent 链追溯找到功能卡（如果有任务队列的真正持有者）
            let chainCard = d.cardsMap.get(card.parent);
            let functionCard = null;
            while (chainCard) {
                if (!chainCard.parent) {
                    // 根卡牌：检查它是否是功能卡（持有任务队列）
                    if (d.taskManager.isTaskRunning(chainCard.instanceId)) {
                        functionCard = chainCard;
                    }
                    break;
                }
                chainCard = d.cardsMap.get(chainCard.parent);
            }

            const directParent = d.cardsMap.get(card.parent);

            // 检查直接父卡牌的 pendingTimeoutId（用于卡牌组合任务）
            if (directParent && directParent.pendingTimeoutId) {
                card._pendingTaskToCancel = directParent.pendingTimeoutId;
                card._parentCardForTask = directParent;
            }

            // 找到功能卡时：跳过当前任务，立刻处理剩余堆叠卡牌
            if (functionCard) {
                d.taskManager.skipCurrentTask(functionCard.instanceId);
            }

            // 解除堆叠关系
            const p = d.cardsMap.get(card.parent);
            if (p) p.next = null;
            card.parent = null;
        }

        // 用数据坐标计算偏移，避开 getBoundingClientRect 在复杂卡牌上的 reflow 误差
        const canvasRect = d.boardCanvas.getBoundingClientRect();
        this._dragOffsetX = (e.clientX - canvasRect.left) - card.x;
        this._dragOffsetY = (e.clientY - canvasRect.top) - card.y;
        document.addEventListener('mousemove', this._boundProcessDrag);
        document.addEventListener('mouseup', this._boundEndDrag);
        e.stopPropagation();
    }

    // ==================== 拖拽过程 ====================

    /**
     * 拖拽移动（由 mousemove 触发）
     * @param {MouseEvent} e
     */
    _processDrag(e) {
        const d = this._deps;
        if (!this._activeDragId) return;

        const mainCard = d.findCardData(this._activeDragId);
        if (!mainCard) {
            this._activeDragId = null;
            return;
        }

        const canvasRect = d.boardCanvas.getBoundingClientRect();
        let newX = e.clientX - canvasRect.left - this._dragOffsetX;
        let newY = e.clientY - canvasRect.top - this._dragOffsetY;
        let diffX = newX - mainCard.x;
        let diffY = newY - mainCard.y;

        // 移动主卡牌及所有子卡牌
        let current = mainCard;
        while (current) {
            current.x += diffX;
            current.y += diffY;
            current = current.next ? d.cardsMap.get(current.next) : null;
        }
        d.renderAllCards();

        // 更新进度条位置（递归向上找到根卡牌）
        if (mainCard.parent) {
            let rootCard = mainCard;
            while (rootCard.parent) {
                rootCard = d.cardsMap.get(rootCard.parent);
            }
            d.updateProgressBarPosition(rootCard.instanceId);
        } else {
            d.updateProgressBarPosition(mainCard.instanceId);
        }

        // 也更新所有子卡牌的进度条
        current = mainCard;
        while (current) {
            d.updateProgressBarPosition(current.instanceId);
            current = current.next ? d.cardsMap.get(current.next) : null;
        }
    }

    // ==================== 拖拽结束 ====================

    /**
     * 拖拽结束（由 mouseup 触发）
     * @param {MouseEvent} e
     */
    _endDrag(e) {
        const d = this._deps;

        document.removeEventListener('mousemove', this._boundProcessDrag);
        document.removeEventListener('mouseup', this._boundEndDrag);

        if (!this._activeDragId) {
            return;
        }

        const mainCard = d.findCardData(this._activeDragId);

        // ===== 1. 检查是否拖拽到对话槽 =====
        if (this._checkDialogueSlot(e, mainCard)) return;

        // ===== 2. 检查是否拖拽到归因推演槽 =====
        if (this._checkReasoningSlot(e, mainCard)) return;

        // ===== 3. 检查是否拖拽到探索窗口槽位 =====
        if (this._checkExplorationSlot(e, mainCard)) return;

        // ===== 4. 检查特殊系统：献祭 + 真名揭示 =====
        if (this._checkSpecialSystems(mainCard)) return;

        // ===== 5. 原有堆叠逻辑 =====
        this._doStandardStacking(mainCard);

        // ===== 6. 清理未粘合卡牌的待处理任务 =====
        this._cleanupPendingTasks(mainCard);

        this._activeDragId = null;
        d.renderAllCards();
    }

    // ---------- 槽位检测子方法 ----------

    /**
     * 检查是否拖放到对话槽
     * @returns {boolean} 是否已处理
     */
    _checkDialogueSlot(e, mainCard) {
        const d = this._deps;
        const dialogueSlot = document.getElementById('dialogue-slot');
        const dialogueModal = document.getElementById('dialogue-modal');

        if (dialogueSlot && dialogueModal.style.display === 'flex') {
            const slotRect = dialogueSlot.getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            if (mouseX >= slotRect.left && mouseX <= slotRect.right &&
                mouseY >= slotRect.top && mouseY <= slotRect.bottom) {
                d.placeCardInSlot(mainCard);
                this._activeDragId = null;
                d.renderAllCards();
                return true;
            }
        }
        return false;
    }

    /**
     * 检查是否拖放到归因推演槽
     * @returns {boolean} 是否已处理
     */
    _checkReasoningSlot(e, mainCard) {
        const d = this._deps;
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
                    d.placeCardInReasoningSlot(mainCard, i);
                    this._activeDragId = null;
                    d.renderAllCards();
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 检查是否拖放到探索窗口槽位
     * @returns {boolean} 是否已处理
     */
    _checkExplorationSlot(e, mainCard) {
        const d = this._deps;
        const explorationModal = document.getElementById('exploration-modal');

        if (explorationModal && (explorationModal.style.display === 'flex' || explorationModal.style.display === 'block')) {
            const explorationSlotsContainer = document.getElementById('exploration-slots');
            if (explorationSlotsContainer) {
                const slots = explorationSlotsContainer.querySelectorAll('.exploration-slot');
                const mouseX = e.clientX;
                const mouseY = e.clientY;

                for (let i = 0; i < slots.length; i++) {
                    const slotRect = slots[i].getBoundingClientRect();

                    if (mouseX >= slotRect.left && mouseX <= slotRect.right &&
                        mouseY >= slotRect.top && mouseY <= slotRect.bottom) {
                        d.placeCardInExplorationSlot(mainCard);
                        this._activeDragId = null;
                        d.renderAllCards();
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // ---------- 特殊系统检测 ----------

    /**
     * 检查并执行特殊系统（献祭、真名揭示）的堆叠
     * @returns {boolean} 是否被特殊系统处理
     */
    _checkSpecialSystems(mainCard) {
        const d = this._deps;

        for (let i = 0; i < d.cardsData.length; i++) {
            let target = d.cardsData[i];
            if (target.instanceId === mainCard.instanceId) continue;

            // 找到堆叠组合的链尾
            let chainTail = target;
            while (chainTail.next) {
                const nextCard = d.cardsMap.get(chainTail.next);
                if (!nextCard) {
                    chainTail.next = null;
                    break;
                }
                chainTail = nextCard;
            }

            // 计算链尾卡牌的渲染位置
            let tailRenderY = chainTail.y;
            if (chainTail.parent) {
                let depth = 0;
                let p = d.cardsMap.get(chainTail.parent);
                while (p) {
                    depth++;
                    p = p.parent ? d.cardsMap.get(p.parent) : null;
                }
                tailRenderY = chainTail.y + (depth * 24);
            }

            // 检测吸附
            if (Math.abs(mainCard.x - chainTail.x) < 80 && Math.abs(mainCard.y - tailRenderY) < 100) {
                // 献祭系统
                if (d.sacrificeSystem.canProcess(mainCard, target)) {
                    d.sacrificeSystem.processSacrifice(mainCard, target);
                    this._activeDragId = null;
                    return true;
                }

                // 真名揭示系统
                if (d.trueNameSystem.canProcess(mainCard, target)) {
                    d.trueNameSystem.processReveal(mainCard, target);
                    this._activeDragId = null;
                    return true;
                }
            }
        }
        return false;
    }

    // ---------- 标准堆叠逻辑 ----------

    /**
     * 执行标准卡牌堆叠检测和连接
     */
    _doStandardStacking(mainCard) {
        const d = this._deps;

        // 同步全局任务标志
        d.taskManager.syncTaskProcessingFlag();

        for (let i = 0; i < d.cardsData.length; i++) {
            let target = d.cardsData[i];
            if (target.instanceId === mainCard.instanceId || d.stackSystem.isChildOf(mainCard.instanceId, target.instanceId)) continue;

            // 找到堆叠组合的链尾
            let chainTail = target;
            while (chainTail.next) {
                const nextCard = d.cardsMap.get(chainTail.next);
                if (!nextCard) {
                    chainTail.next = null;
                    break;
                }
                chainTail = nextCard;
            }

            // 计算链尾卡牌的渲染位置
            let tailRenderY = chainTail.y;
            if (chainTail.parent) {
                let depth = 0;
                let p = d.cardsMap.get(chainTail.parent);
                while (p) {
                    depth++;
                    p = p.parent ? d.cardsMap.get(p.parent) : null;
                }
                tailRenderY = chainTail.y + (depth * 24);
            }

            // 使用链尾卡牌的渲染位置进行吸附检测
            if (Math.abs(mainCard.x - chainTail.x) < 80 && Math.abs(mainCard.y - tailRenderY) < 100) {

                // 追加到链尾
                chainTail.next = mainCard.instanceId;
                mainCard.parent = chainTail.instanceId;

                // 先渲染卡牌，确保DOM位置正确
                this._activeDragId = null;
                d.renderAllCards();

                // 检查是否是结局判定逻辑
                if (d.checkReaction(mainCard, target, d.destroyCard, d.spawnUnboundCard, d.directSpawnCard)) {
                    // 堆叠成功，清理临时标记
                    delete mainCard._pendingTaskToCancel;
                    delete mainCard._parentCardForTask;
                    return;
                }

                if (d.gameState.isGameOver) break;
                break;
            }
        }
    }

    // ---------- 清理待处理任务 ----------

    /**
     * 清理因拖拽分离而遗留的未执行任务
     */
    _cleanupPendingTasks(mainCard) {
        const d = this._deps;

        // 处理 pendingTimeoutId 类型的任务
        if (mainCard._pendingTaskToCancel && mainCard._parentCardForTask) {
            clearTimeout(mainCard._pendingTaskToCancel);
            delete mainCard._parentCardForTask.pendingTimeoutId;
            delete mainCard._pendingTaskToCancel;

            d.hideStackProgressBar(mainCard._parentCardForTask.instanceId);

            d.taskManager.clearProcessingFlag();

            d.log(`⚠️ [组合中断] 卡牌已分离，任务取消`, "normal");
            delete mainCard._parentCardForTask;
        }
    }
}

/** 单例导出 */
export const dragSystem = new DragSystem();
