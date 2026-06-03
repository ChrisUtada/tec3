// 🃏 卡牌模板定义
export const CARD_TEMPLATES = {
    'ITEM_sdt': { name: '手电筒', desc: '【道具】强干涉物理光源。空间跃迁的基础。', type: 'item', class: 'item-card', consumable: false },
    'SCENE_wz': { name: '场景：未知地点', desc: '【核心锚点】初始坐标。将其与手电筒叠加，并用[⚡前往]卡催化。', type: 'scene', class: 'scene-card', consumable: true },
    'CHAR_zs': { name: '人物：朱穗', desc: '【NPC】高级调查员。可以直接扔线索给她进行无卡自发对质。', type: 'char', class: 'char-card', consumable: false },
    'CHAR_investigator': { name: '人物：初级调查员', desc: '【NPC】新人调查员。负责协助搜索和记录证据。', type: 'char', class: 'char-card', consumable: false },
    
    'SCENES_hzyl': { name: '场景：荒宅院落', desc: '【因果宣告处】二级核心场景。将捕获后的关键线索堆叠于此触发终局。', type: 'scene', class: 'scene-card', consumable: false },
    'CLUES_xhpb': { name: '线索：信号屏蔽', desc: '【视觉线索】常态信息暴露。直接堆在荒宅场景上可完成常态脱离。', type: 'clue', class: 'clue-vision', consumable: true },
    'ITEM_mt': { name: '道具：木桶', desc: '【道具】坚固旧木桶。直接把贴纸丢上去可以融合成密码盒。', type: 'item', class: 'item-card', consumable: true },
    'ITEM_tz': { name: '五行贴纸', desc: '【资产】带有高维规约的符号贴纸。直接丢进木桶里自发反应。', type: 'item', class: 'item-card', consumable: true },
    'ITEM_mmh': { name: '暗码铁盒', desc: '【机械锁】沉重紧闭的盒身。[双击卡面] 激活解码校验机制。', type: 'item', class: 'item-card lock-card', consumable: false },
    'CLUE_hz_inside': { name: '线索：宗族谱本', desc: '【文献】记录了异常的真名。用于归因推演的关键线索。', type: 'clue', class: 'clue-vision', consumable: true },
    'CLUE_tx': { name: '线索：铁锈的味道', desc: '【味觉异常】致命污染。用于归因推演的关键线索。', type: 'clue', class: 'clue-taste', consumable: true },
    'CLUE_xhpb': { name: '线索：信号屏蔽', desc: '【视觉线索】常态信息暴露。用于归因推演的关键线索。', type: 'clue', class: 'clue-vision', consumable: true },
    
    // 新增测试线索
    'CLUE_shadow': { name: '线索：墙上的阴影', desc: '【视觉异常】不合常理的投影角度。用于归因推演的关键线索。', type: 'clue', class: 'clue-vision', consumable: true },
    'CLUE_whisper': { name: '线索：低语声', desc: '【听觉异常】来自虚空的呢喃。用于归因推演的关键线索。', type: 'clue', class: 'clue-hearing', consumable: true },
    'CLUE_cold': { name: '线索：骤降的温度', desc: '【触觉异常】空间温度异常波动。用于归因推演的关键线索。', type: 'clue', class: 'clue-taste', consumable: true },
    'CLUE_blood': { name: '线索：血迹图案', desc: '【视觉线索】地板上神秘的符文。用于归因推演的关键线索。', type: 'clue', class: 'clue-vision', consumable: true },
    
    // 逻辑归因卡牌
    'LOGIC_reason': { name: '逻辑归因', desc: '【指令卡】打开归因推演界面，通过线索组合推导真相。双击使用。', type: 'logic', class: 'logic-card', consumable: true },
    
    // 回收卡牌（功能卡）
    'ITEM_recycle': { 
        name: '物资回收站', 
        desc: '【功能】消耗多余卡牌，兑换金币。将卡牌拖放到此卡上即可回收。', 
        type: 'logic', 
        class: 'logic-card', 
        consumable: false,
        recycleValue: 10,
        interactText: '将多余卡牌拖放到回收站上，可将其兑换为金币。'
    },
    
    // 金币卡
    'ITEM_coin': { 
        name: '金币', 
        desc: '【货币】可用于购买物资或线索。', 
        type: 'item', 
        class: 'item-card', 
        consumable: true,
        value: 10,
        interactText: '金币：可用于交易的货币。'
    },
    
    // 新掉落物品
    'ITEM_cdyg': { name: '惨白的月亮', desc: '【道具】散发着诡异光芒的装饰。', type: 'item', class: 'item-card', consumable: false },
    'ITEM_zxtz': { name: '嘴型贴纸', desc: '【资产】带有神秘图案的贴纸。', type: 'item', class: 'item-card', consumable: true },
    'ITEM_mmd': { name: '木门', desc: '【道具】一扇古朴的木门。', type: 'item', class: 'item-card', consumable: false },
    'ITEM_s_qhj': { name: '奇怪的痕迹', desc: '【资产】地板上神秘的擦痕。', type: 'item', class: 'item-card', consumable: true },
    'ITEM_mk': { name: '门扣', desc: '【道具】沉重的金属门扣。', type: 'item', class: 'item-card', consumable: true },
    'ITEM_s_eyes': { name: '眼睛', desc: '【装备】墙上窥视的眼睛。', type: 'equipment', class: 'equipment-card', consumable: false },
    'ITEM_shoudiantong': { name: '手电筒', desc: '【道具】另一个手电筒。', type: 'item', class: 'item-card', consumable: false },
    'ITEM_mmd_eyes': { name: '带有眼睛的木门', desc: '【道具】门板上嵌着一只窥视的眼睛，似乎在等待什么。', type: 'item', class: 'item-card', consumable: false }
};
