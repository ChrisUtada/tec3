//  初始桌面与开场配置
// 编辑后运行 node deploy.js 或手动重启服务端

export const INITIAL_BOARD = [
    { templateId: 'CHAR_investigator', x: 40, y: 50, isCaptured: true },
    { templateId: 'SCENE_tec', x: 175, y: 50, isCaptured: true },
    { templateId: 'LOGIC_capture', x: 310, y: 50, isCaptured: true },
    { templateId: 'LOGIC_reason', x: 445, y: 50, isCaptured: true },
    { templateId: 'ITEM_recycle', x: 580, y: 50, isCaptured: true },
    { templateId: 'LOGIC_observe', x: 40, y: 180, isCaptured: true },
    { templateId: 'SCENE_rest', x: 175, y: 180, isCaptured: true },
];

export const INITIAL_SPAWN = [
];
