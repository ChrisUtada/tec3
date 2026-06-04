// 🌍 场景探索配置
export const SCENE_EXPLORATION = {
    // 未知地点探索
    'SCENE_wz': {
        name: '未知地点',
        slots: 3,  // 3个槽位
        exploreTime: 5000,  // 5秒探索时间
        message: '探索未知地点，寻找隐藏的线索和资源...',
        // 槽位条件限制（可选）
        // requiredCards 定义必须放入的卡牌条件
        // templateId: 指定卡牌模板ID（与 type 二选一）
        // type: 指定卡牌类型（char/item/clue/scene/logic）
        // min: 最少需要放入的数量
        // max: 最多允许放入的数量
        requiredCards: [
            { templateId: 'ITEM_sdt', min: 1, max: 1 },           // 必须放入1个手电筒
            { templateId: 'CHAR_investigator', min: 1, max: 1 }   // 必须放入1个初级调查员
        ],
        // 掉落配置
        drops: [
            { templateId: 'ITEM_cdyg', chance: 1.0, message: '发现了惨白的月亮！' },
            { templateId: 'ITEM_zxtz', chance: 1.0, message: '发现了雕塑贴纸！' },
            { templateId: 'ITEM_mmd', chance: 1.0, message: '发现了木门！' },
            { templateId: 'ITEM_s_qhj', chance: 1.0, message: '发现了奇怪的痕迹！' },
            { templateId: 'ITEM_mk', chance: 1.0, message: '发现了门扣！' },
            { templateId: 'ITEM_s_eyes', chance: 1.0, message: '发现了眼睛！' },
            { templateId: 'ITEM_sdt', chance: 1.0, message: '发现了手电筒！' }
        ]
    },
    // 荒宅院落探索
    'SCENES_hzyl': {
        name: '荒宅院落',
        slots: 3,  // 3个槽位
        exploreTime: 5000,  // 5秒探索时间
        message: '探索荒宅院落，寻找隐藏的线索和资源...',
        // 槽位条件限制
        requiredCards: [
            { templateId: 'CHAR_zs', min: 1, max: 1 },   // 必须放入朱穗
            { type: 'clue', min: 1, max: 2 }             // 必须放入1-2个线索卡
        ],
        // 掉落配置
        drops: [
            { templateId: 'CLUE_blood', chance: 0.6, message: '在墙角发现了血迹图案！' },
            { templateId: 'CLUE_shadow', chance: 0.5, message: '墙上出现了不合常理的阴影...' },
            { templateId: 'ITEM_sdt', chance: 0.3, message: '在地上找到了一个手电筒！' },
            { templateId: 'CHAR_zs', chance: 0.2, message: '朱穗突然出现在院落中...' }
        ]
    }
};
