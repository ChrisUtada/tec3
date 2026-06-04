// 🔗 堆叠系统 - 卡牌堆叠链管理
// 从 engine.js 解耦抽离，负责堆叠链的遍历、增删和关系检查

/**
 * 堆叠系统处理器
 * 
 * 核心能力：
 * - 堆叠链遍历（isChildOf）
 * - 堆叠链移除与重连（removeCardFromStack）
 * - 批量断开堆叠链（breakStackChain）
 * 
 * 堆叠链数据结构：parent → card → next
 * 每张卡牌有 parent（指向父级）和 next（指向子级）
 */
class StackSystem {
    constructor() {
        /** @type {{ findCardData: Function, renderAllCards: Function }} */
        this.api = null;
    }

    /**
     * 初始化，注入依赖
     * @param {Object} api
     * @param {Function} api.findCardData - 卡牌查找函数
     * @param {Function} api.renderAllCards - 重新渲染函数
     */
    init(api) {
        this.api = api;
    }

    /**
     * 检查 childId 是否是 parentId 的子级（沿堆叠链向下遍历）
     * @param {string} parentId
     * @param {string} childId
     * @returns {boolean}
     */
    isChildOf(parentId, childId) {
        const root = this.api.findCardData(parentId);
        if (!root) return false;

        let c = root;
        while (c) {
            if (c.instanceId === childId) return true;
            c = c.next ? this.api.findCardData(c.next) : null;
        }
        return false;
    }

    /**
     * 从堆叠链中移除一张卡牌，并重新连接链
     * 例如：A → B → C → D  移除B后变为  A → C → D
     * @param {string} cardId - 要移除的卡牌ID
     */
    removeCardFromStack(cardId) {
        const card = this.api.findCardData(cardId);
        if (!card) return;

        const parentId = card.parent;
        const nextId = card.next;

        // 如果有父级，将父级的 next 指向当前卡牌的 next
        if (parentId) {
            const parent = this.api.findCardData(parentId);
            if (parent) {
                parent.next = nextId;
            }
        }

        // 如果有子级，将子级的 parent 指向当前卡牌的父级
        if (nextId) {
            const child = this.api.findCardData(nextId);
            if (child) {
                child.parent = parentId;
            }
        }

        // 清除当前卡牌的链关系
        card.parent = null;
        card.next = null;
    }

    /**
     * 批量断开一组卡牌的堆叠关系
     * @param {Array} cards - 卡牌数组
     */
    breakStackChain(cards) {
        const api = this.api;
        cards.forEach(c => {
            if (c.parent) {
                const p = api.findCardData(c.parent);
                if (p) p.next = null;
                c.parent = null;
            }
            c.next = null;
        });
        api.renderAllCards();
    }
}

export const stackSystem = new StackSystem();
