// 🎯 事件总线 - 模块间解耦通信
// 替代全局函数挂载，减少 window.xxx 污染

class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * 订阅事件
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     * @returns {Function} 取消订阅的函数
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        
        // 返回取消订阅函数
        return () => this.off(event, callback);
    }

    /**
     * 取消订阅
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    /**
     * 触发事件
     * @param {string} event - 事件名
     * @param {*} data - 事件数据
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`[EventBus] Error in event handler for "${event}":`, e);
                }
            });
        }
    }

    /**
     * 订阅事件（一次性）
     * @param {string} event - 事件名
     * @param {Function} callback - 回调函数
     */
    once(event, callback) {
        const wrapper = (data) => {
            this.off(event, wrapper);
            callback(data);
        };
        this.on(event, wrapper);
    }
}

// 全局事件总线单例
export const eventBus = new EventBus();

// 预定义事件名称常量
export const EVENTS = {
    // 卡牌事件
    CARD_CAPTURED: 'card:captured',
    CARD_DESTROYED: 'card:destroyed',
    CARD_SPAWNED: 'card:spawned',
    CARD_DRAG_START: 'card:drag:start',
    CARD_DRAG_END: 'card:drag:end',
    
    // 组合事件
    COMBINATION_SUCCESS: 'combination:success',
    COMBINATION_FAILED: 'combination:failed',
    
    // 探索事件
    EXPLORATION_START: 'exploration:start',
    EXPLORATION_COMPLETE: 'exploration:complete',
    
    // 对话事件
    DIALOGUE_START: 'dialogue:start',
    DIALOGUE_NEXT: 'dialogue:next',
    DIALOGUE_END: 'dialogue:end',
    
    // 归因推演事件
    REASONING_START: 'reasoning:start',
    REASONING_EXECUTE: 'reasoning:execute',
    REASONING_END: 'reasoning:end',
    
    // 结局事件
    ENDING_TRIGGER: 'ending:trigger',
    ENDING_COMPLETE: 'ending:complete',
    
    // 游戏状态事件
    GAME_OVER: 'game:over',
    STATE_UPDATE: 'state:update'
};
