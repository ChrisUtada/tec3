// 🎯 卡牌堆叠组合配置（核心玩法）
export const CARD_COMBINATIONS = {
    // 场景探索类：手电筒 + 未知地点 → 荒宅院落
    'ITEM_sdt+SCENE_wz': {
        type: 'explore',
        result: ['SCENES_hzyl'],
        message: '强光穿透迷雾，空间坐标锚定...新场景已解锁！',
        delay: 3000,
        consumeAll: false
    },
    
    // 人物互动类：手电筒 + 朱穗 → 木桶
    'CHAR_zs+ITEM_sdt': {
        type: 'interaction',
        result: ['ITEM_mt'],
        message: '朱穗接过手电筒，递给你一个旧木桶："这个可能用得上。"',
        delay: 2000,
        consumeAll: false
    },
    
    // 道具制作类：五行贴纸 + 木桶 → 密码盒
    'ITEM_mt+ITEM_tz': {
        type: 'crafting',
        result: ['ITEM_mmh'],
        message: '五行贴纸融入木桶，形成机械锁结构...',
        delay: 2000,
        consumeAll: true
    },
    
    // 特效类：嘴型贴纸 + 惨白月亮 → 滋滋滋（无产出，仅视觉效果）
    'ITEM_cdyg+ITEM_zxtz': {
        type: 'speech',
        speechText: '滋滋滋...',
        speechDuration: 2500,
        message: '贴纸贴在月亮上，它开始发出诡异的声响...',
        consumeAll: false
    },

    // 概率掉落：手电筒 + 惨白月亮 → 信号屏蔽装置（10%几率）
    'ITEM_cdyg+ITEM_sdt': {
        type: 'crafting',
        result: ['CLUE_xhpb'],
        chance: 0.1,
        successMessage: '手电筒照在月亮上，一个信号屏蔽装置掉了出来！',
        failMessage: '手电筒照在月亮上，没有任何反应...',
        message: '手电筒照在月亮上，似乎在寻找什么...',
        delay: 2000,
        consumeAll: false
    },

    // 线索合成类：信号屏蔽 + 朱穗 → 铁锈的味道
    'CHAR_zs+CLUES_xhpb': {
        type: 'synthesis',
        result: ['CLUE_tx'],
        message: '朱穗瞳孔放大："那是个死人的名字。空气里的铁锈味越来越浓了……"',
        delay: 2500,
        consumeAll: false
    },

    // 组合道具：眼睛 + 木门 → 带有眼睛的木门（眼睛保留，木门消耗）
    // sort() 后 ['ITEM_mmd', 'ITEM_s_eyes']，所以木门是 target（被拖放的卡是 mover=眼睛）
    'ITEM_mmd+ITEM_s_eyes': {
        type: 'crafting',
        result: ['ITEM_mmd_eyes'],
        message: '眼睛贴在木门上，瞳孔微微转动...它在看着你。',
        delay: 1500,
        consumeTarget: true
    },

    // 场景解锁：手电筒 + 带有眼睛的木门 → 荒宅院落
    // sort() 后 'ITEM_mmd_eyes' < 'ITEM_sdt'（'m' < 's'）
    'ITEM_mmd_eyes+ITEM_sdt': {
        type: 'explore',
        result: ['SCENES_hzyl'],
        message: '强光照亮了木门上的眼睛，它猛然睁大——空间裂开，荒宅院落显现！',
        delay: 3000,
        consumeAll: false
    },
    
    // 捕获功能卡规则（捕获任意人物、场景、物品掉落线索）
    // 捕获卡是常驻功能卡，不会被消耗
    'CHAR_zs+LOGIC_capture': {
        type: 'capture',
        result: ['CLUE_shadow', 'CLUE_whisper', 'CLUE_blood'],
        message: '⚡ 捕获！从朱穗身上提取到隐藏线索！',
        delay: 3000,
        consumeAll: false
    },
    'CHAR_investigator+LOGIC_capture': {
        type: 'capture',
        result: ['CLUE_cold', 'CLUE_blood'],
        message: '⚡ 捕获！从初级调查员身上提取到隐藏线索！',
        delay: 3000,
        consumeAll: false
    },
    'SCENE_wz+LOGIC_capture': {
        type: 'capture',
        result: ['CLUE_shadow', 'CLUE_xhpb'],
        message: '⚡ 捕获！从未知地点提取到隐藏线索！',
        delay: 3000,
        consumeAll: false
    },
    'SCENES_hzyl+LOGIC_capture': {
        type: 'capture',
        result: ['CLUE_blood', 'CLUE_shadow', 'CLUE_whisper'],
        message: '⚡ 捕获！从荒宅院落提取到隐藏线索！',
        delay: 3000,
        consumeAll: false
    },
    'ITEM_sdt+LOGIC_capture': {
        type: 'capture',
        result: ['CLUE_xhpb'],
        message: '⚡ 捕获！从手电筒中提取到隐藏线索！',
        delay: 3000,
        consumeAll: false
    },
    'ITEM_mmd+LOGIC_capture': {
        type: 'capture',
        result: ['CLUE_shadow', 'CLUE_blood'],
        message: '⚡ 捕获！从木门中提取到隐藏线索！',
        delay: 3000,
        consumeAll: false
    },
    'ITEM_mmd_eyes+LOGIC_capture': {
        type: 'capture',
        result: ['CLUE_shadow', 'CLUE_whisper', 'CLUE_cold'],
        message: '⚡ 捕获！从带有眼睛的木门中提取到隐藏线索！',
        delay: 3000,
        consumeAll: false
    }
};