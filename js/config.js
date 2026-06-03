// 📦 配置聚合导出模块（向后兼容）
// 新的模块化结构在 js/config/ 子目录中
// 此文件保持向后兼容，建议逐步迁移到从 config/index.js 导入

// 从子模块重新导出所有配置
export { CARD_TEMPLATES } from './config/cards.js';
export { CARD_COMBINATIONS } from './config/combinations.js';
export { SCENE_EXPLORATION } from './config/scenes.js';
export { DIALOGUE_DATA } from './config/dialogues.js';
export { REASONING_ENDINGS } from './config/endings.js';
