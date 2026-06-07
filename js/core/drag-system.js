// 拖拽管理系统 - 处理卡牌的拖拽、移动、吸附、特殊系统检测完整流程
// 依赖注入设计：所有外部依赖通过 init() 注入，不直接 import 业务模块

import { dragEventManager } from './drag-event-manager.js';
import { CARD } from '../consts.js';
import { playSound } from '../sound.js';

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

        playSound('click');
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
            } else if (card.pendingTimeoutId) {
                // 自身有 pendingTimeoutId（被观测的卡牌叠放在父卡上时）
                card._pendingTaskToCancel = card.pendingTimeoutId;
                card._parentCardForTask = card;
            }

            // 找到功能卡时：跳过当前任务，立刻处理剩余堆叠卡牌
            if (functionCard) {
                d.taskManager.skipCurrentTask(functionCard.instanceId);
            }

            // 更新数据坐标到实际渲染位置（渲染引擎使用根卡牌的 x/y + depth*24，
            // 而不是子卡牌自身的 x/y，所以直接加上 depth*24 可能是错的）
            let rootCard = d.cardsMap.get(card.parent);
            while (rootCard && rootCard.parent) {
                rootCard = d.cardsMap.get(rootCard.parent);
            }
            if (rootCard) {
                let depth = 0;
                let _c = d.cardsMap.get(card.parent);
                while (_c) { depth++; _c = _c.parent ? d.cardsMap.get(_c.parent) : null; }
                card.x = rootCard.x;
                card.y = rootCard.y + (depth * CARD.STACK_OFFSET_Y);
            }

            // 解除堆叠关系
            const p2 = d.cardsMap.get(card.parent);
            if (p2) p2.next = null;
            card.parent = null;
        }

        const canvasRect = d.boardCanvas.getBoundingClientRect();
        this._dragOffsetX = (e.clientX - canvasRect.left) - card.x;
        this._dragOffsetY = (e.clientY - canvasRect.top) - card.y;
        dragEventManager.startDrag(card.instanceId, {
            onDrag: this._boundProcessDrag,
            onDragEnd: this._boundEndDrag
        });
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

        if (!this._activeDragId) {
            return;
        }

        const mainCard = d.findCardData(this._activeDragId);

        // ===== 0. 休息槽位检测（最高优先级，过度疲劳时只有此检测有效） =====
        if (this._checkRestSlot(e, mainCard)) return;

        // ===== 过度疲劳：跳过所有其他操作 =====
        if (d.isOverfatigued()) {
            this._constrainCardToBoard(mainCard);
            this._activeDragId = null;
            d.renderAllCards();
            return;
        }

        // ===== 1. 检查是否拖拽到对话槽 =====
        if (this._checkDialogueSlot(e, mainCard)) return;

        // ===== 2. 检查是否拖拽到归因推演槽 =====
        if (this._checkReasoningSlot(e, mainCard)) return;

        // ===== 3. 检查是否拖拽到探索窗口槽位 =====
        if (this._checkExplorationSlot(e, mainCard)) return;

        // ===== 4. 检查特殊系统：献祭 + 真名揭示 =====
        if (this._checkSpecialSystems(mainCard)) return;

        // ===== 5. 原有堆叠逻辑 =====
        const didStack = this._doStandardStacking(mainCard);

        if (!didStack) {
            // 未吸附：如果卡牌落在激活的探索面板下方，拉回可见区域
            this._constrainCardToBoard(mainCard);
            playSound('drop');
        }

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
        const dialoguePanel = document.getElementById('dialogue-panel');

        if (dialogueSlot && dialoguePanel.classList.contains('show')) {
            const slotRect = dialogueSlot.getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            if (mouseX >= slotRect.left && mouseX <= slotRect.right &&
                mouseY >= slotRect.top && mouseY <= slotRect.bottom) {
                // 检查返回值，只有成功时才清除拖拽状态
                if (d.placeCardInSlot(mainCard)) {
                    playSound('slot');
                    this._activeDragId = null;
                    d.renderAllCards();
                    return true;
                }
                // 验证失败，返回 false 让流程继续到标准堆叠逻辑
                return false;
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
        const reasoningPanel = document.getElementById('reasoning-panel');

        if (reasoningPanel && reasoningPanel.classList.contains('show')) {
            for (let i = 0; i < 5; i++) {
                const slot = document.getElementById(`slot-${i}`);
                if (!slot) continue;

                const slotRect = slot.getBoundingClientRect();
                const mouseX = e.clientX;
                const mouseY = e.clientY;

                if (mouseX >= slotRect.left && mouseX <= slotRect.right &&
                    mouseY >= slotRect.top && mouseY <= slotRect.bottom) {
                    // 检查返回值，只有成功时才清除拖拽状态
                    if (d.placeCardInReasoningSlot(mainCard, i)) {
                        playSound('slot');
                        this._activeDragId = null;
                        d.renderAllCards();
                        return true;
                    }
                    // 验证失败，返回 false 让流程继续到标准堆叠逻辑
                    return false;
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
        const explorationPanel = document.getElementById('exploration-panel');

        if (explorationPanel && explorationPanel.classList.contains('show')) {
            const explorationSlotsContainer = document.getElementById('exploration-slots');
            if (explorationSlotsContainer) {
                const slots = explorationSlotsContainer.querySelectorAll('.exploration-slot');
                const mouseX = e.clientX;
                const mouseY = e.clientY;

                for (let i = 0; i < slots.length; i++) {
                    const slotRect = slots[i].getBoundingClientRect();

                    if (mouseX >= slotRect.left && mouseX <= slotRect.right &&
                        mouseY >= slotRect.top && mouseY <= slotRect.bottom) {
                        // 检查返回值，只有成功时才清除拖拽状态
                        if (d.placeCardInExplorationSlot(mainCard, i)) {
                            playSound('slot');
                            this._activeDragId = null;
                            d.renderAllCards();
                            return true;
                        }
                        // 验证失败，返回 false 让流程继续到标准堆叠逻辑
                        return false;
                    }
                }
            }
        }
        return false;
    }

    // ---------- 特殊系统检测 ----------

    /**
     * 检查是否拖放到休息面板槽位
     */
    _checkRestSlot(e, mainCard) {
        const d = this._deps;
        const restPanel = document.getElementById('rest-panel');
        if (!restPanel || !restPanel.classList.contains('show')) return false;

        const restInvestigatorSlot = document.getElementById('rest-investigator-slot');
        const restFatigueSlot = document.getElementById('rest-fatigue-slot');
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        const checkSlot = (slotEl, slotIndex) => {
            if (!slotEl) return false;
            const rect = slotEl.getBoundingClientRect();
            if (mouseX >= rect.left && mouseX <= rect.right &&
                mouseY >= rect.top && mouseY <= rect.bottom) {
                if (d.placeCardInRestSlot(mainCard, slotIndex)) {
                    playSound('slot');
                    this._activeDragId = null;
                    d.renderAllCards();
                    return true;
                }
                return false;
            }
            return false;
        };

        if (checkSlot(restInvestigatorSlot, 0)) return true;
        if (checkSlot(restFatigueSlot, 1)) return true;
        return false;
    }

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
            let tailRenderX = chainTail.x;
            let tailRenderY = chainTail.y;
            if (chainTail.parent) {
                let depth = 0;
                let p = d.cardsMap.get(chainTail.parent);
                let root = chainTail;
                while (p) {
                    depth++;
                    root = p;
                    p = p.parent ? d.cardsMap.get(p.parent) : null;
                }
                tailRenderX = root.x;
                tailRenderY = root.y + (depth * CARD.STACK_OFFSET_Y);
            }

            // 检测吸附（与标准堆叠使用相同阈值）
            if (Math.abs(mainCard.x - tailRenderX) < CARD.SNAP_DISTANCE && Math.abs(mainCard.y - tailRenderY) < CARD.SNAP_DISTANCE_Y) {
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

            // 计算链尾卡牌的渲染位置（渲染引擎使用根卡牌坐标，而非链尾自身 data 坐标）
            let tailRenderX = chainTail.x;
            let tailRenderY = chainTail.y;
            if (chainTail.parent) {
                let depth = 0;
                let p = d.cardsMap.get(chainTail.parent);
                let root = chainTail;
                while (p) {
                    depth++;
                    root = p;
                    p = p.parent ? d.cardsMap.get(p.parent) : null;
                }
                tailRenderX = root.x;
                tailRenderY = root.y + (depth * CARD.STACK_OFFSET_Y);
            }

            // 使用链尾卡牌的渲染位置进行吸附检测
            if (Math.abs(mainCard.x - tailRenderX) < CARD.SNAP_DISTANCE && Math.abs(mainCard.y - tailRenderY) < CARD.SNAP_DISTANCE_Y) {

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
                    return true;
                }

                if (d.gameState.isGameOver) return true;
                return true;
            }
        }
        return false;
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

            d.taskManager.clearProcessingFlagGlobal();

            d.log(`⚠️ [组合中断] 卡牌已分离，任务取消`, "normal");
            delete mainCard._parentCardForTask;
        }
    }

    /**
     * 释放位置修正：如果卡牌落在右侧面板区域，自动拉回可见区
     */
    _constrainCardToBoard(card) {
        const anyPanelOpen = document.querySelector('.right-panel.show');
        if (!anyPanelOpen) return;
        const panelWidth = 420;
        const padding = 20;
        const maxX = window.innerWidth - panelWidth - CARD.WIDTH - padding;
        if (card.x > maxX) {
            card.x = maxX;
        }
    }
}

/** 单例导出 */
export const dragSystem = new DragSystem();
