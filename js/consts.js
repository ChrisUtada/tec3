// 📐 全局常量定义 - 统一管理硬编码数值
// 与 CSS 变量保持同步，一处修改全局生效

/**
 * 卡牌尺寸常量
 */
export const CARD = {
    WIDTH: 140,          // 卡牌宽度（px）
    HEIGHT: 185,         // 卡牌高度（px）
    HALF_WIDTH: 70,      // 卡牌半宽（用于居中计算）
    STACK_OFFSET_Y: 30,  // 堆叠时的 Y 偏移
    DROP_OFFSET_Y: 195,  // 进度条显示位置（卡牌高度 + 间距10）
    SNAP_DISTANCE: 110,  // 水平吸附距离
    SNAP_DISTANCE_Y: 140, // 垂直吸附距离
};

/**
 * 进度条常量
 */
export const PROGRESS = {
    BAR_WIDTH: 120,
    BAR_HEIGHT: 8,
    DEFAULT_DELAY: 2000
};

/**
 * 探索系统常量
 */
export const EXPLORATION = {
    DEFAULT_TIME: 5000,
    DEFAULT_SLOTS: 3
};

/**
 * 归因推演常量
 */
export const REASONING = {
    SLOTS: 5,
    PROGRESS_TIME: 3000
};