// 🎯 任务队列系统 - 通用任务管理器
// 从 engine.js 解耦抽离，提供抢占式任务调度能力
// 取代模式：新卡顶掉正在执行的卡，被中断的卡存入 preemptedStack 等待恢复

/**
 * 任务管理器
 * 
 * 核心能力：
 * - 按功能卡维护任务队列
 * - 抢占式调度（新卡立即执行，旧卡被中断后排队恢复）
 * - 任务取消（清理定时器、重置状态）
 * - 全局任务处理标志同步
 */
class TaskManager {
    constructor() {
        // key = 功能卡ID, value = { isRunning, currentTimeoutId, currentStackedCardId, currentExecutionFn, preemptedStack: [] }
        this.taskQueues = {};

        // 全局任务处理标志
        this._isProcessing = false;

        /** @type {{ findCardData, hideStackProgressBar, log, getTaskProcessing, setTaskProcessing }} */
        this.api = null;
    }

    /**
     * 初始化，注入依赖
     * @param {Object} api
     * @param {Function} api.findCardData
     * @param {Function} api.hideStackProgressBar
     * @param {Function} api.log
     * @param {Function} api.getTaskProcessing
     * @param {Function} api.setTaskProcessing
     */
    init(api) {
        this.api = api;
    }

    /** 全局任务处理标志 */
    get isAnyTaskProcessing() {
        return this._isProcessing;
    }

    /** 同步来自 logic.js 的全局标志 */
    syncTaskProcessingFlag() {
        this._isProcessing = this.api.getTaskProcessing();
    }

    /** 清除本地处理标志（不触发 logic.js） */
    clearProcessingFlag() {
        this._isProcessing = false;
    }

    /** 清除处理标志并同步到 logic.js */
    clearProcessingFlagGlobal() {
        this._isProcessing = false;
        this.api.setTaskProcessing(false);
    }

    /**
     * 获取或创建功能卡的任务队列
     * @param {string} cardId
     * @returns {Object}
     */
    getTaskQueue(cardId) {
        if (!this.taskQueues[cardId]) {
            this.taskQueues[cardId] = {
                isRunning: false,
                currentTimeoutId: null,
                currentStackedCardId: null,
                currentExecutionFn: null,
                preemptedStack: []
            };
        }
        return this.taskQueues[cardId];
    }

    /**
     * 检查功能卡是否有正在运行的任务
     * @param {string} cardId
     * @returns {boolean}
     */
    isTaskRunning(cardId) {
        const q = this.taskQueues[cardId];
        return !!(q && q.isRunning && q.currentTimeoutId);
    }

    /**
     * 跳过当前任务，立刻继续处理 preemptedStack 中的下一张卡
     * （不清空整个队列，只取消当前执行的卡，保留剩余排队的卡）
     * @param {string} cardId - 功能卡ID
     */
    skipCurrentTask(cardId) {
        const q = this.taskQueues[cardId];
        if (!q || !q.isRunning) return;

        if (q.currentTimeoutId) {
            clearTimeout(q.currentTimeoutId);
            q.currentTimeoutId = null;
        }
        this.api.hideStackProgressBar(cardId);

        // 跳过当前卡，直接处理 preemptedStack 中的等待卡牌
        q.currentStackedCardId = null;
        q.currentExecutionFn = null;

        if (q.preemptedStack.length > 0) {
            const prev = q.preemptedStack.pop();
            const cardRef = this.api.findCardData(prev.stackedCardId);
            if (cardRef) {
                this.enqueueTask(cardId, prev.stackedCardId, prev.executionFn);
            } else {
                this._processNextPreempted(cardId);
            }
        } else {
            this._isProcessing = false;
            this.api.setTaskProcessing(false);
            q.isRunning = false;
        }
    }

    /**
     * 取消功能卡上的所有任务
     * @param {string} cardId - 功能卡ID
     */
    cancelTask(cardId) {
        const q = this.taskQueues[cardId];
        if (!q) return;

        if (q.currentTimeoutId) {
            clearTimeout(q.currentTimeoutId);
            q.currentTimeoutId = null;
        }

        q.isRunning = false;
        q.currentStackedCardId = null;
        q.currentExecutionFn = null;
        q.preemptedStack = [];
        this._isProcessing = false;
        this.api.setTaskProcessing(false);
    }

    /**
     * 将任务加入处理队列。如果功能卡正在执行，则取消当前任务，立即处理新卡。
     * 被中断的卡牌信息存入 preemptedStack，等新卡处理完后再继续。
     * @param {string} functionCardId - 功能卡ID
     * @param {string} stackedCardId - 被堆叠的卡牌ID（需要被处理的卡）
     * @param {Function} executionFn - 执行函数，接收 (done, storeTimeout) 两个回调
     *   - done: 任务完成时调用
     *   - storeTimeout: 传入 setTimeout 的返回值 ID，用于取消任务
     */
    enqueueTask(functionCardId, stackedCardId, executionFn) {
        const api = this.api;
        const q = this.getTaskQueue(functionCardId);

        // 如果正在执行，取消当前任务
        if (q.isRunning) {
            if (q.currentTimeoutId) {
                clearTimeout(q.currentTimeoutId);
                q.currentTimeoutId = null;
            }
            api.hideStackProgressBar(functionCardId);
            // 把当前被中断的卡牌信息存入 preemptedStack
            if (q.currentStackedCardId && q.currentStackedCardId !== stackedCardId) {
                q.preemptedStack.push({
                    stackedCardId: q.currentStackedCardId,
                    executionFn: q.currentExecutionFn
                });
                api.log(`⏸️ [取代] 新卡牌介入，当前任务暂停等待`, "normal");
            }
        }

        // 立即执行新任务
        this._isProcessing = true;
        api.setTaskProcessing(true);
        q.isRunning = true;
        q.currentStackedCardId = stackedCardId;
        q.currentExecutionFn = executionFn;

        executionFn(
            // done 回调
            () => {
                q.currentTimeoutId = null;
                q.currentStackedCardId = null;
                q.currentExecutionFn = null;

                // 检查是否有被中断的卡牌等待处理
                if (q.preemptedStack.length > 0) {
                    const prev = q.preemptedStack.pop();
                    const cardRef = api.findCardData(prev.stackedCardId);
                    if (cardRef) {
                        api.log(`↩️ [恢复] 继续处理上一张卡牌`, "normal");
                        this.enqueueTask(functionCardId, prev.stackedCardId, prev.executionFn);
                    } else {
                        this._processNextPreempted(functionCardId);
                    }
                } else {
                    this._isProcessing = false;
                    api.setTaskProcessing(false);
                    q.isRunning = false;
                }
            },
            // storeTimeout 回调
            (timeoutId) => {
                q.currentTimeoutId = timeoutId;
            }
        );
    }

    /**
     * 跳过已销毁的卡牌，处理下一个被中断的任务
     * @param {string} cardId
     * @private
     */
    _processNextPreempted(cardId) {
        const api = this.api;
        const q = this.getTaskQueue(cardId);
        if (q.preemptedStack.length > 0) {
            const prev = q.preemptedStack.pop();
            const cardRef = api.findCardData(prev.stackedCardId);
            if (cardRef) {
                this.enqueueTask(cardId, prev.stackedCardId, prev.executionFn);
            } else {
                this._processNextPreempted(cardId);
            }
        } else {
            this._isProcessing = false;
            api.setTaskProcessing(false);
            q.isRunning = false;
        }
    }
}

export const taskManager = new TaskManager();
