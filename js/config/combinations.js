// 🎯 卡牌堆叠组合配置（核心玩法）
// 消耗规则：由每张卡牌自身的 consumable 属性决定，组合配方不指定消耗
export const CARD_COMBINATIONS = {
    // 人物互动类：手电筒 + 朱穗 → 木桶
    'CHAR_zs+ITEM_sdt': {
        type: 'interaction',
        result: ['ITEM_mt'],
        message: '朱穗接过手电筒，递给你一个旧木桶："这个可能用得上。"',
        delay: 2000
    },
    
    // 道具制作类：五行贴纸 + 木桶 → 密码盒
    'ITEM_mt+ITEM_tz': {
        type: 'crafting',
        result: ['ITEM_mmh'],
        message: '五行贴纸融入木桶，形成机械锁结构...',
        delay: 2000
    },
    
    // 概率掉落：手电筒 + 惨白月亮 → 信号屏蔽装置（10%几率）
    'ITEM_cdyg+ITEM_sdt': {
        type: 'crafting',
        result: ['CLUE_xhpb'],
        chance: 0.1,
        successMessage: '手电筒照在月亮上，一个信号屏蔽装置掉了出来！',
        failMessage: '手电筒照在月亮上，没有任何反应...',
        message: '手电筒照在月亮上，似乎在寻找什么...',
        delay: 2000
    },

    // 线索合成类：信号屏蔽 + 朱穗 → 铁锈的味道
    'CHAR_zs+CLUES_xhpb': {
        type: 'synthesis',
        result: ['CLUE_tx'],
        message: '朱穗瞳孔放大："那是个死人的名字。空气里的铁锈味越来越浓了……"',
        delay: 2500
    },

    // 组合道具：眼睛 + 木门 → 带有眼睛的木门
    'ITEM_mmd+ITEM_s_eyes': {
        type: 'crafting',
        result: ['ITEM_mmd_eyes'],
        message: '眼睛贴在木门上，瞳孔微微转动...它在看着你。',
        delay: 1500
    },

    // 献祭类：植物学家的花园 + TEC → 真名卡
    'CHAR_tec+SCENE_plant_hunter': {
        type: 'crafting',
        result: ['ITEM_true_name'],
        message: '植物学家的花园向 TEC 倾吐了它最后的秘密——一颗被掩埋的"真名"破土而出。',
        delay: 3000
    },
    
    // 调查类：初级调查员 + 陆珩松的尸体 → 皱巴巴的纸 + 唱针
    'CHAR_investigator+ITEM_corpse_lu': {
        type: 'explore',
        result: ['ITEM_crumpled_paper', 'ITEM_stylus'],
        message: '初级调查员颤抖着翻开陆珩松的口袋，发现了一张皱巴巴的纸条和一枚沾着暗红的唱针。',
        delay: 3000
    },
    
    // 合成类：剪刀 + 缠满绷带的尸体 → 陆珩松的尸体 + 陆珩松
    'ITEM_bandaged_corpse+ITEM_scissors': {
        type: 'crafting',
        result: ['ITEM_corpse_lu', 'CHAR_lu'],
        message: '剪刀剪开层层绷带——一张苍白的脸露了出来。陆珩松缓缓睁开了眼睛。',
        delay: 3000
    },
    
    // 合成类：手电筒 + 黑影 → 缠满绷带的尸体
    'ITEM_sdt+ITEM_shadow_figure': {
        type: 'crafting',
        result: ['ITEM_bandaged_corpse'],
        message: '手电筒照亮黑影，它在光中崩解为一具缠满绷带的尸体。',
        delay: 2500
    },
    
    // 捕获功能卡规则
    'CHAR_zs+LOGIC_capture': {
        type: 'capture',
        result: ['CLUE_shadow', 'CLUE_whisper', 'CLUE_blood'],
        message: '⚡ 捕获！从朱穗身上提取到隐藏线索！',
        delay: 3000
    },
    'CHAR_investigator+LOGIC_capture': {
        type: 'capture',
        result: ['CLUE_cold', 'CLUE_blood'],
        message: '⚡ 捕获！从初级调查员身上提取到隐藏线索！',
        delay: 3000
    },
    'SCENE_wz+LOGIC_capture': {
        type: 'capture',
        result: ['CLUE_shadow', 'CLUE_xhpb'],
        message: '⚡ 捕获！从未知地点提取到隐藏线索！',
        delay: 3000
    },
    'ITEM_sdt+LOGIC_capture': {
        type: 'capture',
        result: ['CLUE_xhpb'],
        message: '⚡ 捕获！从手电筒中提取到隐藏线索！',
        delay: 3000
    },
    'ITEM_mmd+LOGIC_capture': {
        type: 'capture',
        result: ['CLUE_shadow', 'CLUE_blood'],
        message: '⚡ 捕获！从木门中提取到隐藏线索！',
        delay: 3000
    },
    'ITEM_mmd_eyes+LOGIC_capture': {
        type: 'capture',
        result: ['CLUE_shadow', 'CLUE_whisper', 'CLUE_cold'],
        message: '⚡ 捕获！从带有眼睛的木门中提取到隐藏线索！',
        delay: 3000
    },

    // 疯狂窥视 + 真名卡 → 即刻揭露真名
    'ITEM_peek_truth+ITEM_true_name': {
        type: 'peekReveal',
        message: '疯狂窥视撕开了真名的伪装——真相显露！',
        delay: 2000
    }
};
