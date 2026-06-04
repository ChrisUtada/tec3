// 🃏 卡牌模板定义
export const CARD_TEMPLATES = {
    'ITEM_sdt': { name: '手电筒', desc: '【道具】强干涉物理光源。空间跃迁的基础。', type: 'item', class: 'item-card', consumable: false, allowDuplicate: true },
    'SCENE_wz': { name: '场景：未知地点', desc: '【核心锚点】初始坐标。将其与手电筒叠加，并用[⚡前往]卡催化。', type: 'scene', class: 'scene-card', consumable: true },
    'CHAR_zs': { name: '人物：朱穗', desc: '【NPC】高级调查员。可以直接扔线索给她进行无卡自发对质。', type: 'char', class: 'char-card', consumable: false, allowDuplicate: true },
    'CHAR_investigator': { name: '人物：初级调查员', desc: '【NPC】新人调查员。负责协助搜索和记录证据。', type: 'char', class: 'char-card', consumable: false },
    
    'SCENES_hzyl': { name: '场景：荒宅院落', desc: '【因果宣告处】二级核心场景。将捕获后的关键线索堆叠于此触发终局。', type: 'scene', class: 'scene-card', consumable: false },
    'CLUES_xhpb': { name: '线索：信号屏蔽', desc: '【视觉线索】常态信息暴露。直接堆在荒宅场景上可完成常态脱离。', type: 'clue', class: 'clue-vision', consumable: true },
    'ITEM_mt': { name: '道具：木桶', desc: '【道具】坚固旧木桶。直接把贴纸丢上去可以融合成密码盒。', type: 'item', class: 'item-card', consumable: true },
    'ITEM_tz': { name: '五行贴纸', desc: '【资产】带有高维规约的符号贴纸。直接丢进木桶里自发反应。', type: 'item', class: 'item-card', consumable: true },
    'ITEM_mmh': { name: '暗码铁盒', desc: '【机械锁】沉重紧闭的盒身。[双击卡面] 激活解码校验机制。', type: 'item', class: 'item-card lock-card', consumable: false },
    'CLUE_hz_inside': { name: '线索：宗族谱本', desc: '【文献】记录了异常的真名。用于归因推演的关键线索。', type: 'clue', class: 'clue-vision', consumable: true },
    'CLUE_tx': { name: '线索：铁锈的味道', desc: '【味觉异常】致命污染。用于归因推演的关键线索。', type: 'clue', class: 'clue-taste', consumable: true },
    'CLUE_xhpb': { name: '线索：信号屏蔽', desc: '【视觉线索】常态信息暴露。用于归因推演的关键线索。', type: 'clue', class: 'clue-vision', consumable: true },
    
    // 五感线索卡 - 每种感官对应一种线索
    'CLUE_vision_eye': { name: '线索：扭曲的视线', desc: '【视觉】视网膜捕捉到不属于这个世界的影像。', type: 'clue', class: 'clue-vision', consumable: true, senseType: 'vision' },
    'CLUE_hearing_echo': { name: '线索：回响的低语', desc: '【听觉】来自异空间的声音碎片。', type: 'clue', class: 'clue-hearing', consumable: true, senseType: 'hearing' },
    'CLUE_taste_metal': { name: '线索：金属的苦涩', desc: '【味觉】口腔中蔓延的诡异金属味。', type: 'clue', class: 'clue-taste', consumable: true, senseType: 'taste' },
    'CLUE_touch_ice': { name: '线索：刺骨的寒意', desc: '【触觉】穿透衣物的异常低温。', type: 'clue', class: 'clue-touch', consumable: true, senseType: 'touch' },
    'CLUE_smell_rot': { name: '线索：腐朽的气息', desc: '【嗅觉】令人作呕的腐烂气味。', type: 'clue', class: 'clue-smell', consumable: true, senseType: 'smell' },
    
    // 原有测试线索
    'CLUE_shadow': { name: '线索：墙上的阴影', desc: '【视觉异常】不合常理的投影角度。用于归因推演的关键线索。', type: 'clue', class: 'clue-vision', consumable: true, allowDuplicate: true },
    'CLUE_whisper': { name: '线索：低语声', desc: '【听觉异常】来自虚空的呢喃。用于归因推演的关键线索。', type: 'clue', class: 'clue-hearing', consumable: true },
    'CLUE_cold': { name: '线索：骤降的温度', desc: '【触觉异常】空间温度异常波动。用于归因推演的关键线索。', type: 'clue', class: 'clue-touch', consumable: true },
    'CLUE_blood': { name: '线索：血迹图案', desc: '【视觉线索】地板上神秘的符文。用于归因推演的关键线索。', type: 'clue', class: 'clue-vision', consumable: true, allowDuplicate: true },
    
    // 功能卡：捕获（常驻功能）
    'LOGIC_capture': { name: '⚡捕获', desc: '【常驻功能卡】将此卡放置在人物、场景或物品上进行捕获，可获得隐藏线索。此卡不会被消耗。', type: 'item', class: 'item-card capture-card', consumable: false },
    
    // 逻辑归因卡牌
    'LOGIC_reason': { name: '逻辑归因', desc: '【指令卡】打开归因推演界面，通过线索组合推导真相。双击使用。', type: 'logic', class: 'logic-card', consumable: true },
    
    // 献祭卡牌（功能卡）
    'ITEM_recycle': { 
        name: '⚡献祭', 
        desc: '【功能】将多余卡牌献祭，获取因果律。将卡牌拖放到此卡上即可献祭。', 
        type: 'logic', 
        class: 'logic-card', 
        consumable: false,
        recycleValue: 10,
        interactText: '将多余卡牌拖放到献祭台上，可将其转化为因果律。'
    },
    
    // 因果律卡
    'ITEM_coin': {
        name: '因果律',
        desc: '【因果货币】可用于改变事件概率或购买特殊物品。',
        type: 'item',
        class: 'item-card',
        consumable: true,
        allowDuplicate: true,    // 货币可无限刷出
        value: 10,
        interactText: '因果律：可用于干预现实的力量。'
    },
    
    // 真名卡
    'ITEM_true_name': { 
        name: '???', 
        desc: '【真名容器】未知的存在等待被揭示。将五感线索拖放到此卡上进行揭示。', 
        type: 'item', 
        class: 'item-card true-name-card', 
        consumable: false,
        isRevealed: false,
        realName: '「深渊低语者」',
        realDesc: '【旧日支配者碎片】\n\n这是一个来自深渊的古老存在的真名残片。\n\n当五个感官线索全部收集完毕，\n它的真实形态将被揭示。\n\n——「在无尽的黑暗中，它凝视着你」',
        targetSenses: ['vision', 'hearing', 'taste', 'touch', 'smell'],
        collectedSenses: []
    },
    
    // 新掉落物品
    'ITEM_cdyg': { name: '惨白的月亮', desc: '【道具】散发着诡异光芒的装饰。', type: 'item', class: 'item-card', consumable: false, allowDuplicate: true },
    'ITEM_zxtz': { name: '嘴型贴纸', desc: '【资产】带有神秘图案的贴纸。', type: 'item', class: 'item-card', consumable: true, allowDuplicate: true },
    'ITEM_mmd': { name: '木门', desc: '【道具】一扇古朴的木门。', type: 'item', class: 'item-card', consumable: false, allowDuplicate: true },
    'ITEM_s_qhj': { name: '奇怪的痕迹', desc: '【资产】地板上神秘的擦痕。', type: 'item', class: 'item-card', consumable: true, allowDuplicate: true },
    'ITEM_mk': { name: '门扣', desc: '【道具】沉重的金属门扣。', type: 'item', class: 'item-card', consumable: true, allowDuplicate: true },
    'ITEM_s_eyes': { name: '眼睛', desc: '【装备】墙上窥视的眼睛。', type: 'item', class: 'equipment-card', consumable: false, allowDuplicate: true },
    
    'ITEM_mmd_eyes': { name: '带有眼睛的木门', desc: '【道具】门板上嵌着一只窥视的眼睛，似乎在等待什么。', type: 'item', class: 'item-card', consumable: false }
};
