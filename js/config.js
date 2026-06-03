// 🌍 全量数据字典定义
export const CARD_TEMPLATES = {
    'VERB_investigate': { name: '⚡ 前往 / 使用', desc: '【指令卡】用于打破宏观物理瓶颈（如前往未知地点）。', type: 'action', class: 'verb-card v-investigate', consumable: true },
    'VERB_talk': { name: '⚡ 出示 / 质询', desc: '【指令卡】用于进行强光强干涉盘问。', type: 'action', class: 'verb-card v-talk', consumable: true },

    'ITEM_sdt': { name: '手电筒', desc: '【道具】强干涉物理光源。空间跃迁的基础。', type: 'item', class: 'item-card', consumable: false },
    'SCENE_wz': { name: '场景：未知地点', desc: '【核心锚点】初始坐标。将其与手电筒叠加，并用[⚡前往]卡催化。', type: 'scene', class: 'scene-card', consumable: true },
    'CHAR_zs': { name: '人物：朱穗', desc: '【NPC】高级调查员。可以直接扔线索给她进行无卡自发对质。', type: 'char', class: 'char-card', consumable: false },
    
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
    
    // 回收卡牌
    'ITEM_recycle': { 
        name: '物资回收站', 
        desc: '【道具】消耗多余卡牌，兑换金币。将卡牌拖放到此卡上即可回收。', 
        type: 'item', 
        class: 'item-card', 
        consumable: false,  // 回收卡本身不可消耗
        recycleValue: 10,  // 回收一张卡牌获得10金币
        interactText: '将多余卡牌拖放到回收站上，可将其兑换为金币。'
    },
    
    // 金币卡
    'ITEM_coin': { 
        name: '金币', 
        desc: '【货币】可用于购买物资或线索。', 
        type: 'item', 
        class: 'item-card', 
        consumable: true,  // 金币可以被消耗
        value: 10,  // 每张金币价值10
        interactText: '金币：可用于交易的货币。'
    }
};

// 🎯 卡牌堆叠组合配置（核心玩法）
export const CARD_COMBINATIONS = {
    // 场景探索类：手电筒 + 未知地点 → 荒宅院落
    'ITEM_sdt+SCENE_wz': {
        type: 'explore',
        result: ['SCENES_hzyl'],
        message: '强光穿透迷雾，空间坐标锚定...新场景已解锁！',
        delay: 3000,
        consumeAll: false  // 根据每张卡牌的 consumable 属性决定是否消耗
    },
    
    // 人物互动类：手电筒 + 朱穗 → 木桶
    'CHAR_zs+ITEM_sdt': {
        type: 'interaction',
        result: ['ITEM_mt'],
        message: '朱穗接过手电筒，递给你一个旧木桶："这个可能用得上。"',
        delay: 2000,
        consumeAll: false  // 根据每张卡牌的 consumable 属性决定是否消耗
    },
    
    // 道具制作类：五行贴纸 + 木桶 → 密码盒
    'ITEM_mt+ITEM_tz': {
        type: 'crafting',
        result: ['ITEM_mmh'],
        message: '五行贴纸融入木桶，形成机械锁结构...',
        delay: 2000,
        consumeAll: true  // 材料类全部消耗
    },
    
    // 线索合成类：信号屏蔽 + 朱穗 → 铁锈的味道
    'CHAR_zs+CLUES_xhpb': {
        type: 'synthesis',
        result: ['CLUE_tx'],
        message: '朱穗瞳孔放大："那是个死人的名字。空气里的铁锈味越来越浓了……"',
        delay: 2500,
        consumeAll: false  // 根据每张卡牌的 consumable 属性决定是否消耗
    }
};

// 🌍 场景探索配置
export const SCENE_EXPLORATION = {
    // 荒宅院落探索
    'SCENES_hzyl': {
        name: '荒宅院落',
        slots: 3,  // 3个槽位
        exploreTime: 5000,  // 5秒探索时间
        message: '探索荒宅院落，寻找隐藏的线索和资源...',
        // 掉落配置
        drops: [
            { templateId: 'CLUE_blood', chance: 0.6, message: '在墙角发现了血迹图案！' },
            { templateId: 'CLUE_shadow', chance: 0.5, message: '墙上出现了不合常理的阴影...' },
            { templateId: 'ITEM_sdt', chance: 0.3, message: '在地上找到了一个手电筒！' },
            { templateId: 'CHAR_zs', chance: 0.2, message: '朱穗突然出现在院落中...' }
        ]
    }
};

//  人物对话配置
export const DIALOGUE_DATA = {
    'CHAR_zs': {
        name: '朱穗',
        dialogues: {
            'ITEM_sdt': [
                { text: '朱穗皱了皱眉："手电筒？你觉得这种普通工具能派上什么用场？"', index: 0 },
                { text: '朱穗叹了口气："好吧，至少比什么都没有强。记得检查电池。"', index: 1 },
                { text: '朱穗点点头："行，带上它。我们在黑暗中可能需要光源。"', index: 2 }
            ],
            'SCENE_wz': [
                { text: '朱穗眼神变得严肃："那个坐标...你确定要去那里？"', index: 0 },
                { text: '朱穗低声说："我之前去过一次，那里的空间结构不太稳定。"', index: 1 },
                { text: '朱穗郑重地说："如果你坚持要去，我会陪你。但我们必须小心。"', index: 2 }
            ],
            'SCENES_hzyl': [
                { text: '朱穗的表情瞬间凝重："荒宅院落...那里不祥。"', index: 0 },
                { text: '朱穗回忆道："我听说过那里的传闻，进去的人很少能完整出来。"', index: 1 },
                { text: '朱穗握紧拳头："但如果线索在那里，我们必须面对。"', index: 2 }
            ],
            'CLUES_xhpb': [
                { text: '朱穗接过信号屏蔽器："这个能干扰异常波动？有意思。"', index: 0 },
                { text: '朱穗研究了一会儿："理论上可以创造一个安全区，但持续时间有限。"', index: 1 },
                { text: '朱穗下定决心："好，我们用它来掩护撤退路线。"', index: 2 }
            ],
            'ITEM_mt': [
                { text: '朱穗看着木桶："旧木桶？看起来普普通通。"', index: 0 },
                { text: '朱穗敲了敲桶壁："等等...这个材质不太对劲。"', index: 1 },
                { text: '朱穗若有所思："也许可以用来装一些不稳定的东西。"', index: 2 }
            ],
            'ITEM_tz': [
                { text: '朱穗盯着五行贴纸："这些符号...我在哪里见过。"', index: 0 },
                { text: '朱穗脸色微变："这是古代用来封印异常的术式！"', index: 1 },
                { text: '朱穗急促地说："我们必须找到对应的容器，这些贴纸不能单独使用！"', index: 2 }
            ],
            'ITEM_mmh': [
                { text: '朱穗打量着铁盒："暗码铁盒...里面装着什么？"', index: 0 },
                { text: '朱穗尝试打开："有机械锁，需要密码。你从哪里找到的？"', index: 1 },
                { text: '朱穗谨慎地说："不管里面是什么，一定很重要。我们得解开它。"', index: 2 }
            ],
            'CLUE_hz_inside': [
                { text: '朱穗看到宗族谱本，倒吸一口凉气："这是...禁忌之物。"', index: 0 },
                { text: '朱穗声音颤抖："上面记录的名字，都是被异常吞噬的人。"', index: 1 },
                { text: '朱穗坚定地说："我们必须摧毁它，不能让这些名字继续存在。"', index: 2 }
            ],
            'CLUE_tx': [
                { text: '朱穗闻到铁锈味，脸色骤变："这个味道...不好！"', index: 0 },
                { text: '朱穗捂住口鼻："这是现实崩解的前兆，我们必须立刻离开！"', index: 1 },
                { text: '朱穗痛苦地说："已经太晚了...污染已经开始扩散。"', index: 2 }
            ]
        },
        defaultDialogues: [
            { text: '朱穗看着你："有什么发现吗？"', index: 0 },
            { text: '朱穗催促道："时间不多，我们需要更多信息。"', index: 1 },
            { text: '朱穗鼓励地说："继续调查，我相信你能找到真相。"', index: 2 }
        ]
    }
};

// ️ 归因推演结局配置
export const REASONING_ENDINGS = {
    // 单线索结局
    'CLUE_tx': {
        title: '👅【因果品尝 (Taste) 结局 // 吞噬废墟】',
        story: `你将【铁锈的味道】投入归因推演仪...\n\n猩红色的数据波浪从桌面上爆发...你意识到这个世界的污染已经无法挽回。所有的线索都指向同一个真相：这里的一切都在崩解。\n\n你选择了品尝这终极的苦涩。`  
    },
    'CLUE_hz_inside': {
        title: '📖【展现 (Show) 结局 // 宗族之名】',
        story: `你将【宗族谱本】投入归因推演仪...\n\n古老的文字在虚空中展开，每一个名字都是一段被吞噬的历史。你看到了真相的全貌：这个荒宅见证了一个家族的消亡。\n\n你选择了展现这一切。`
    },
    
    // 双线索组合结局
    'CLUE_tx+CLUE_hz_inside': {
        title: '🌑【吞噬与展现 // 终焉真相】',
        story: `你将【铁锈的味道】和【宗族谱本】同时投入推演仪...\n\n味觉与视觉的双重冲击让你看到了完整的真相：这个家族的消亡不是意外，而是某种不可名状之物的吞噬。\n\n铁锈的味道，就是他们最后的痕迹。`
    },
    'CLUE_xhpb+CLUE_shadow': {
        title: '👁️【视觉迷宫 // 虚假现实】',
        story: `你将【信号屏蔽】和【墙上的阴影】投入推演仪...\n\n你意识到所有的视觉线索都不可信。信号屏蔽掩盖了真相，而墙上的阴影指向了一个不存在的空间。\n\n你陷入了视觉的迷宫。`
    },
    
    // 三线索组合结局
    'CLUE_tx+CLUE_hz_inside+CLUE_xhpb': {
        title: '🌀【三维真相 // 完全觉醒】',
        story: `你将三条关键线索同时投入推演仪...\n\n味觉、视觉、文献的三重验证让你完全觉醒。你看到了这个世界的本质：一个被异常力量扭曲的现实泡。\n\n铁锈的味道是污染，宗族谱本是历史，信号屏蔽是掩盖。三者结合，真相大白。`
    },
    
    // 默认结局（未匹配到预设组合）
    'default': {
        title: '🔮【未明结局 // 线索不足】',
        story: `你投入的线索组合无法形成完整的因果链...\n\n推演仪显示：需要更多关键线索才能揭示真相。\n\n继续探索吧，调查员。真相就在不远处。`
    }
};
