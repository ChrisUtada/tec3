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
    // 植物学家的花园探索（条件分支产出）
    'SCENE_plant_hunter': {
        name: '植物学家的花园',
        slots: 3,
        exploreTime: 5000,
        // 条件分支产出：根据放入的卡牌不同，掉落不同的物品
        dropGroups: [
            {
                id: 'investigate',
                label: '初级调查',
                message: '初级调查员踏入花园，藤蔓在身后悄悄合拢...',
                requiredCards: [
                    { templateId: 'CHAR_investigator', min: 1, max: 1 }
                ],
                drops: [
                    { templateId: 'ITEM_black_curtain', chance: 1.0, message: '在角落发现了一块黑色帘幕。' },
                    { templateId: 'ITEM_plant', chance: 1.0, message: '花园中茂盛的植物引起了注意。' },
                    { templateId: 'SCENE_desk', chance: 0.8, message: '植物学家的工作台仍然保存完好。' },
                    { templateId: 'ITEM_phonograph', chance: 0.6, message: '老式唱机正在无人播放唱片。' },
                    { templateId: 'ITEM_shadow_figure', chance: 0.4, message: '一团黑色人影从花丛中闪过...似乎想告诉你什么。' },
                    { templateId: 'ITEM_syringe', chance: 0.3, message: '在土里埋着半截注射器，里面是黑色的液体。' }
                ]
            },
            {
                id: 'tec_revelation',
                label: 'TEC介入',
                message: 'TEC 走入植物学家的花园，空气中弥漫着被遗忘的气息...',
                requiredCards: [
                    { templateId: 'CHAR_tec', min: 1, max: 1 }
                ],
                drops: [
                    { templateId: 'ITEM_true_name', chance: 1.0, message: '植物学家的花园向 TEC 倾吐了最后的秘密——一颗"真名"破土而出。' }
                ]
            }
        ]
    },
    
    // TEC总部探索
    'SCENE_tec': {
        name: 'TEC总部',
        slots: 3,
        exploreTime: 5000,
        message: '在 TEC 总部中搜索，寻找有用的信息和资源...',
        requiredCards: [
            { templateId: 'CHAR_investigator', min: 1, max: 1 }
        ],
        drops: [
            { templateId: 'CHAR_tec', chance: 1.0, message: 'TEC 从阴影中现身："你终于来了。"' },
            { templateId: 'SCENE_plant_hunter', chance: 1.0, message: 'TEC 指向一扇门："植物学家的花园在等你。"' }
        ]
    },
    
    // 书桌探索
    'SCENE_desk': {
        name: '书桌',
        slots: 3,
        exploreTime: 4000,
        message: '调查员翻查书桌，寻找有用的物品...',
        requiredCards: [
            { templateId: 'CHAR_investigator', min: 1, max: 1 }
        ],
        drops: [
            { templateId: 'ITEM_handwritten_note', chance: 1.0, message: '发现了一份手写笔记！' },
            { templateId: 'SCENE_drawer', chance: 1.0, message: '书桌的抽屉里似乎藏着东西。' },
            { templateId: 'ITEM_trash_can', chance: 0.8, message: '角落的垃圾桶里有揉皱的纸条。' },
            { templateId: 'ITEM_desk_lamp', chance: 0.6, message: '一台老式台灯，灯罩泛黄。' }
        ]
    },
    
    // 抽屉探索
    'SCENE_drawer': {
        name: '抽屉',
        slots: 3,
        exploreTime: 4000,
        message: '调查员打开抽屉，检查里面的物品...',
        requiredCards: [
            { templateId: 'CHAR_investigator', min: 1, max: 1 }
        ],
        drops: [
            { templateId: 'ITEM_sdt', chance: 1.0, message: '抽屉里有一把手电筒！' },
            { templateId: 'ITEM_scissors', chance: 0.8, message: '发现了一把老式剪刀。' },
            { templateId: 'ITEM_wooden_box', chance: 0.6, message: '发现了一个精致的木盒。' }
        ]
    }
};
