// TEC3 一键部署脚本
// 由 admin 面板生成
// 用法: node deploy.js
const fs = require('fs');

const RENAMES = {};

const FILES = [
    "js/engine.js",
    "js/exploration.js",
    "js/logic.js",
    "js/rest.js",
    "js/systems/corruption.js",
    "js/systems/sacrifice.js"
];

function writeFiles() {
    // 确保 js/config 目录存在
    const dir = 'js/config';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const configs = {
        'cards.js': `// 卡牌模板
export const CARD_TEMPLATES = {
    'ITEM_sdt': { name: '手电筒', desc: '【道具】强干涉物理光源。空间跃迁的基础。', type: 'item', class: 'item-card', consumable: false },
    'CHAR_zs': { name: '人物：朱穗', desc: '【NPC】高级调查员。可以直接扔线索给她进行无卡自发对质。', type: 'char', class: 'char-card', consumable: false, allowDuplicate: true },
    'CLUE_taste_metal': { name: '线索：金属的苦涩', desc: '【味觉】口腔中蔓延的诡异金属味。', type: 'clue', class: 'clue-taste', consumable: true, senseType: 'taste' },
    'CLUE_touch_ice': { name: '线索：刺骨的寒意', desc: '【触觉】穿透衣物的异常低温。', type: 'clue', class: 'clue-touch', consumable: true, senseType: 'touch' },
    'CLUE_smell_rot': { name: '线索：腐朽的气息', desc: '【嗅觉】令人作呕的腐烂气味。', type: 'clue', class: 'clue-smell', consumable: true, senseType: 'smell' },
    'CLUE_whisper': { name: '线索：低语声', desc: '【听觉异常】来自虚空的呢喃。用于归因推演的关键线索。', type: 'clue', class: 'clue-hearing', consumable: true },
    'LOGIC_capture': { name: '捕获', desc: '【常驻功能卡】将此卡放置在人物、场景或物品上进行捕获，可获得隐藏线索。此卡不会被消耗。', type: 'item', class: 'item-card capture-card', consumable: false, dropOnce: false },
    'LOGIC_reason': { name: '逻辑归因', desc: '【指令卡】打开归因推演界面，通过线索组合推导真相。双击使用。', type: 'logic', class: 'logic-card', consumable: true },
    'ITEM_recycle': { name: '⚡献祭', desc: '【功能】将多余卡牌献祭，获取因果律。将卡牌拖放到此卡上即可献祭。', type: 'logic', class: 'logic-card', consumable: false, recycleValue: 10, interactText: '将多余卡牌拖放到献祭台上，可将其转化为因果律。' },
    'ITEM_coin': { name: '因果律', desc: '【因果货币】可用于改变事件概率或购买特殊物品。', type: 'item', class: 'item-card', consumable: true, allowDuplicate: true, value: 10, interactText: '因果律：可用于干预现实的力量。' },
    'ITEM_true_name': { name: '???', desc: '【真名容器】未知的存在等待被揭示。', type: 'item', class: 'item-card true-name-card', consumable: false, realName: '「深渊低语者」', realDesc: '【旧日支配者碎片】\\n\\n这是一个来自深渊的古老存在的真名残片。\\n\\n——「在无尽的黑暗中，它凝视着你」' },
    'SCENE_truename': { name: '场景：真名共鸣协议', desc: '【场景】古老的设计图——"真名共鸣仪"的构造方案。', type: 'scene', class: 'scene-card', consumable: true, dropOnce: false },
    'ITEM_sense_all': { name: '感官聚合', desc: '【合成卡】五感线索已全部收集，等待进一步激活。', type: 'item', class: 'item-card', consumable: true },
    'ITEM_sense_all_light': { name: '五感手电筒', desc: '【合成卡】手电筒照亮的五感聚合体，可以揭示真名。', type: 'item', class: 'item-card', consumable: true },
    'ITEM_truename_clue': { name: '线索：被揭示的真名', desc: '【线索卡】旧日支配者的真名已被揭示。用于归因推演的关键线索。', type: 'clue', class: 'clue-vision', consumable: true },
    'SCENE_tec': { name: '场景：TEC总部', desc: '【核心锚点】调查员联合机构的物理中枢。需与初级调查员叠加，揭开 TEC 的真实面目。', type: 'scene', class: 'scene-card', consumable: false },
    'CHAR_tec': { name: '人物：TEC', desc: '【NPC】自称"调查员联合机构"。将初级调查员送入 TEC 总部后显露的真身。', type: 'char', class: 'char-card', consumable: false },
    'SCENE_plant_hunter': { name: '场景：植物学家的花园', desc: '【二级场景】由 TEC 引导进入的异界花园。植物学家在此失踪。', type: 'scene', class: 'scene-card', consumable: false },
    'ITEM_black_curtain': { name: '物品：黑色帘幕', desc: '【道具】厚重的黑色帘幕，遮蔽着什么。', type: 'item', class: 'item-card', consumable: false },
    'ITEM_plant': { name: '物品：植物', desc: '【道具】花园中随处可见的植物，触碰时有微妙感觉。', type: 'item', class: 'item-card', consumable: false },
    'SCENE_desk': { name: '地点：书桌', desc: '【场景】植物学家的工作台，上面散落着研究笔记。', type: 'scene', class: 'scene-card', consumable: false },
    'ITEM_phonograph': { name: '物品：唱机', desc: '【道具】老式留声机，唱片在无人触碰时自己转动。', type: 'item', class: 'item-card', consumable: false },
    'ITEM_shadow_figure': { name: '物品：黑影', desc: '【道具】一团无法聚焦的黑色人形虚影，似乎有自我意识。', type: 'item', class: 'item-card', consumable: true, corruptionTime: 180000 },
    'ITEM_syringe': { name: '物品：注射器', desc: '【道具】锈迹斑斑的医用注射器，内含不明液体。', type: 'item', class: 'item-card', consumable: false },
    'ITEM_handwritten_note': { name: '物品：手写笔记', desc: '【道具】植物学家留下的研究笔记，字迹潦草。', type: 'item', class: 'item-card', consumable: false },
    'SCENE_drawer': { name: '地点：抽屉', desc: '【场景】书桌的抽屉，藏有隐秘的物品。打开它需要仔细检查。', type: 'scene', class: 'scene-card', consumable: false },
    'ITEM_trash_can': { name: '物品：垃圾桶', desc: '【道具】角落里的垃圾桶，里面有揉皱的纸条。', type: 'item', class: 'item-card', consumable: false },
    'ITEM_desk_lamp': { name: '物品：台灯', desc: '【道具】老式台灯，灯罩泛黄，光线昏黄。', type: 'item', class: 'item-card', consumable: false },
    'ITEM_scissors': { name: '物品：剪刀', desc: '【道具】一把老式剪刀，金属部分有锈迹。', type: 'item', class: 'item-card', consumable: false },
    'ITEM_wooden_box': { name: '物品：精致的木盒', desc: '【道具】做工精细的小木盒，似乎装着重要的东西。', type: 'item', class: 'item-card', consumable: false },
    'ITEM_bandaged_corpse': { name: '物品：缠满绷带的尸体', desc: '【道具】一具被绷带层层缠绕的尸体，手电筒照亮后显出真实形态。', type: 'item', class: 'item-card', consumable: true },
    'ITEM_corpse_lu': { name: '物品：陆珩松的尸体', desc: '【道具】绷带被剪开后，露出的是一张苍白的脸——植物学家本人。', type: 'item', class: 'item-card', consumable: false },
    'CHAR_lu': { name: '人物：陆珩松', desc: '【NPC】植物学家。他沉默地站着，仿佛从一场长眠中醒来，但灵魂还没有完全回来。', type: 'char', class: 'char-card', consumable: false },
    'ITEM_crumpled_paper': { name: '物品：皱巴巴的纸', desc: '【道具】从陆珩松身上找到的纸条，上面的字迹被汗渍浸得模糊——只能认出几个词："花园"、"别回来"、"它醒了"。', type: 'item', class: 'item-card', consumable: false },
    'ITEM_stylus': { name: '物品：唱针', desc: '【道具】一枚老式唱针，沾着暗红色的痕迹。将它装回唱机上，也许能播放出本不该被听到的声音。', type: 'item', class: 'item-card', consumable: false },
    'LOGIC_observe': { name: '观测', desc: '【常驻功能卡】将此卡拖放到任意卡牌上，查看该卡牌的叙事信息。此卡不会被消耗。', type: 'item', class: 'item-card observe-card', consumable: false },
    'DEBUFF_fatigue': { name: '疲劳', desc: '【负面状态】连续探索导致的疲劳积累。桌面疲劳卡达到 5 张时将无法进行探索、对话和归因。放入休息卡中可恢复。', type: 'item', class: 'item-card debuff-card', consumable: true, allowDuplicate: true },
    'ITEM_peek_truth': { name: '疯狂窥视', desc: '【道具】疲劳极限时窥见的不可名状之物。', type: 'item', class: 'item-card', consumable: true, allowDuplicate: true, dropOnce: true },
    'SCENE_rest': { name: '休息处', desc: '【功能卡】将初级调查员和疲劳卡同时放入休息面板，消耗疲劳恢复状态。', type: 'scene', class: 'scene-card', consumable: false },
    'CHAR_dcy': { name: '人物：初级调查员', desc: '【NPC】新人调查员。负责协助搜索和记录证据。', type: 'char', class: 'char-card', consumable: false, fatigueTrigger: true, dropOnce: false, art: 'dcy.png' },
};
`,
        'combinations.js': `// 组合配方
export const CARD_COMBINATIONS = {
    'CHAR_zs+ITEM_sdt': { type: 'interaction', result: ["ITEM_mt"], message: '朱穗接过手电筒，递给你一个旧木桶："这个可能用得上。"', delay: 2000 },
    'CHAR_tec+SCENE_plant_hunter': { type: 'crafting', result: ["ITEM_true_name"], message: '植物学家的花园向 TEC 倾吐了它最后的秘密——一颗被掩埋的"真名"破土而出。', delay: 3000 },
    'CHAR_dcy+ITEM_corpse_lu': { type: 'interaction', result: ["物品：皱巴巴的纸","物品：唱针"], message: '初级调查员颤抖着翻开陆珩松的口袋，发现了一张皱巴巴的纸条和一枚沾着暗红的唱针。', delay: 3000 },
    'ITEM_bandaged_corpse+ITEM_scissors': { type: 'crafting', result: ["ITEM_corpse_lu","CHAR_lu"], message: '剪刀剪开层层绷带——一张苍白的脸露了出来。陆珩松缓缓睁开了眼睛。', delay: 3000 },
    'ITEM_sdt+ITEM_shadow_figure': { type: 'crafting', result: ["ITEM_bandaged_corpse"], message: '手电筒照亮黑影，它在光中崩解为一具缠满绷带的尸体。', delay: 2500 },
    'CHAR_zs+LOGIC_capture': { type: 'interaction', result: ["CLUE_shadow","线索：低语声","CLUE_blood"], message: '⚡ 捕获！从朱穗身上提取到隐藏线索！', delay: 3000 },
    'CHAR_dcy+LOGIC_capture': { type: 'interaction', result: ["CLUE_cold","CLUE_blood"], message: '⚡ 捕获！从初级调查员身上提取到隐藏线索！', delay: 3000 },
    'ITEM_sdt+LOGIC_capture': { type: 'interaction', result: ["CLUE_xhpb"], message: '⚡ 捕获！从手电筒中提取到隐藏线索！', delay: 3000 },
    'ITEM_sdt+ITEM_sense_all': { type: 'consumeAll', result: ["ITEM_sense_all_light"], message: '手电筒照亮了感官聚合体，五种感官在光中融为一体！', delay: 2000 },
    'ITEM_sense_all_light+ITEM_true_name': { type: 'consumeAll', result: ["ITEM_truename_clue"], message: '五感之光映照出真名——旧日支配者的名字被揭示！', delay: 2500 },
    'ITEM_peek_truth+ITEM_true_name': { type: 'consumeAll', result: ["ITEM_truename_clue"], message: '疯狂窥视撕开了真名的伪装——真相显露！', delay: 2000 },
};
`,
        'scenes.js': `// 场景配置
export const SCENE_EXPLORATION = {
    'SCENE_plant_hunter': { name: '植物学家的花园', slots: 3, exploreTime: 5000, fatigueDropRate: 0.1, dropGroups: [{"id":"investigate","label":"初级调查","message":"初级调查员踏入花园，藤蔓在身后悄悄合拢...","requiredCards":[{"templateId":"CHAR_dcy","min":1,"max":1}],"drops":[{"templateId":"ITEM_black_curtain","chance":1,"message":"在角落发现了一块黑色帘幕。"},{"templateId":"ITEM_plant","chance":1,"message":"花园中茂盛的植物引起了注意。"},{"templateId":"SCENE_desk","chance":0.8,"message":"植物学家的工作台仍然保存完好。"},{"templateId":"ITEM_phonograph","chance":0.6,"message":"老式唱机正在无人播放唱片。"},{"templateId":"ITEM_shadow_figure","chance":0.4,"message":"一团黑色人影从花丛中闪过...似乎想告诉你什么。"},{"templateId":"ITEM_syringe","chance":0.3,"message":"在土里埋着半截注射器，里面是黑色的液体。"}]},{"id":"tec_revelation","label":"TEC介入","message":"TEC 走入植物学家的花园，空气中弥漫着被遗忘的气息...","requiredCards":[{"templateId":"CHAR_tec","min":1,"max":1}],"drops":[{"templateId":"ITEM_true_name","chance":1,"message":"植物学家的花园向 TEC 倾吐了最后的秘密——一颗\\"真名\\"破土而出。"},{"templateId":"SCENE_truename","chance":1,"message":"同时你发现了一张古老的设计图——\\"真名共鸣仪\\"的构造方案。"}]}] },
    'SCENE_tec': { name: '场景：TEC总部', slots: 3, exploreTime: 5000, message: '在 TEC 总部中搜索，寻找有用的信息和资源...', fatigueDropRate: 0.1, requiredCards: [{"templateId":"CHAR_dcy","min":1,"max":1}], dropGroups: [{"id":"dcy","label":"","message":"","requiredCards":[{"templateId":"CHAR_dcy","min":1,"max":1}],"drops":[{"templateId":"CHAR_tec","chance":1,"message":"TEC 从阴影中现身：\\"你终于来了。\\""},{"templateId":"SCENE_plant_hunter","chance":1,"message":"TEC 指向一扇门：\\"植物学家的花园在等你。\\""}]},{"id":"tec","label":"","message":"","requiredCards":[{"templateId":"CHAR_tec","min":1,"max":1}],"drops":[{"templateId":"SCENE_truename","chance":1,"message":"真名共鸣协议"}]}] },
    'SCENE_truename': { name: '真名共鸣仪', slots: 5, exploreTime: 6000, message: '将五种感官线索放入槽位，激活真名共鸣仪...', fatigueDropRate: 0, requiredCards: [{"templateId":"CLUE_vision_eye","min":1,"max":1},{"templateId":"CLUE_hearing_echo","min":1,"max":1},{"templateId":"CLUE_taste_metal","min":1,"max":1},{"templateId":"CLUE_touch_ice","min":1,"max":1},{"templateId":"CLUE_smell_rot","min":1,"max":1}], drops: [{"templateId":"ITEM_sense_all","chance":1,"message":"五种感官数据已聚合！"}] },
    'SCENE_desk': { name: '书桌', slots: 3, exploreTime: 4000, message: '调查员翻查书桌，寻找有用的物品...', fatigueDropRate: 0.1, requiredCards: [{"templateId":"CHAR_dcy","min":1,"max":1}], drops: [{"templateId":"ITEM_handwritten_note","chance":1,"message":"发现了一份手写笔记！"},{"templateId":"SCENE_drawer","chance":1,"message":"书桌的抽屉里似乎藏着东西。"},{"templateId":"ITEM_trash_can","chance":0.8,"message":"角落的垃圾桶里有揉皱的纸条。"},{"templateId":"ITEM_desk_lamp","chance":0.6,"message":"一台老式台灯，灯罩泛黄。"}] },
    'SCENE_drawer': { name: '抽屉', slots: 3, exploreTime: 4000, message: '调查员打开抽屉，检查里面的物品...', fatigueDropRate: 0.1, requiredCards: [{"templateId":"CHAR_dcy","min":1,"max":1}], drops: [{"templateId":"ITEM_sdt","chance":1,"message":"抽屉里有一把手电筒！"},{"templateId":"ITEM_scissors","chance":0.8,"message":"发现了一把老式剪刀。"},{"templateId":"ITEM_wooden_box","chance":0.6,"message":"发现了一个精致的木盒。"}] },
};
`,
        'dialogues.js': `// 对话
export const DIALOGUE_DATA = {
    'CHAR_zs': { name: '朱穗'
    },
    'CHAR_tec': { name: 'TEC'
    },
    'CHAR_lu': { name: '陆珩松'
    },
    'CHAR_dcy': { name: '初级调查员'
    },
};
`,
        'endings.js': `// 结局
export const REASONING_ENDINGS = {
    'CLUE_tx': { title: '👅【因果品尝 (Taste) 结局 // 吞噬废墟】', story: '你将【铁锈的味道】投入归因推演仪...\\n\\n猩红色的数据波浪从桌面上爆发...你意识到这个世界的污染已经无法挽回。所有的线索都指向同一个真相：这里的一切都在崩解。\\n\\n你选择了品尝这终极的苦涩。' },
    'CLUE_hz_inside': { title: '📖【展现 (Show) 结局 // 宗族之名】', story: '你将【宗族谱本】投入归因推演仪...\\n\\n古老的文字在虚空中展开，每一个名字都是一段被吞噬的历史。你看到了真相的全貌：这个荒宅见证了一个家族的消亡。\\n\\n你选择了展现这一切。' },
    'CLUE_tx+CLUE_hz_inside': { title: '🌑【吞噬与展现 // 终焉真相】', story: '你将【铁锈的味道】和【宗族谱本】同时投入推演仪...\\n\\n味觉与视觉的双重冲击让你看到了完整的真相：这个家族的消亡不是意外，而是某种不可名状之物的吞噬。\\n\\n铁锈的味道，就是他们最后的痕迹。' },
    'CLUE_xhpb+CLUE_shadow': { title: '👁️【视觉迷宫 // 虚假现实】', story: '你将【信号屏蔽】和【墙上的阴影】投入推演仪...\\n\\n你意识到所有的视觉线索都不可信。信号屏蔽掩盖了真相，而墙上的阴影指向了一个不存在的空间。\\n\\n你陷入了视觉的迷宫。' },
    'ITEM_truename_clue': { title: '🏛️【真名揭示 // 深渊低语者】', story: '你将【被揭示的真名】投入归因推演仪...\\n\\n当旧日支配者的真名在虚空中回荡，整个世界都在震颤。你看到了真相：这个世界的异常，不过是某个古老存在的梦境。\\n\\n你念出了它的名字——深渊低语者。\\n\\n梦境破碎，现实重组。' },
    'CLUE_tx+CLUE_hz_inside+CLUE_xhpb': { title: '🌀【三维真相 // 完全觉醒】', story: '你将三条关键线索同时投入推演仪...\\n\\n味觉、视觉、文献的三重验证让你完全觉醒。你看到了这个世界的本质：一个被异常力量扭曲的现实泡。\\n\\n铁锈的味道是污染，宗族谱本是历史，信号屏蔽是掩盖。三者结合，真相大白。' },
    'default': { title: '🔮【未明结局 // 线索不足】', story: '你投入的线索组合无法形成完整的因果链...\\n\\n推演仪显示：需要更多关键线索才能揭示真相。\\n\\n继续探索吧，调查员。真相就在不远处。' },
};
`,
        'observations.js': `// 观测
export const OBSERVATION_TEXTS = {
    'ITEM_sdt': '手电筒的电池仓里印着一行小字："T.E.C 资产 #0042"。光束在黑暗中划出的轨迹，比你想的要长。',
    'CHAR_zs': '朱穗靠在墙边抽烟，烟雾在空气中凝成扭曲的符号。她看了你一眼，没有说话。',
    'CLUE_taste_metal': '金属的味道在舌根蔓延。那是一种来自时间深处的苦味，像是历史的金属被压成了液体。',
    'CLUE_touch_ice': '冰冷的触感从指尖向心脏蔓延。不是外界在变冷——是你的体温在被抽走。',
    'CLUE_smell_rot': '腐烂的气息像是有重量一样压在嗅觉神经上。有什么东西正在你的记忆深处分解。',
    'CLUE_whisper': '声音停下来的时候，你才意识到它在说话。你没有听懂——但你记住了它的语调。',
    'LOGIC_capture': '捕获协议是一个单向契约。当你捕获一个实体时，你也允许它捕获你的一部分。',
    'LOGIC_reason': '逻辑归因卡的工作方式是反的。不是你在推导真相——是真相在推导你。',
    'ITEM_recycle': '献祭台不消耗物品。它将物品还原为它们本来的状态。有些东西被还原后就不再是物品了。',
    'ITEM_coin': '因果律硬币的一面是数字，另一面是空白的。它掷出的结果永远是正面——空白的那面。',
    'ITEM_true_name': '容器里的存在知道你的名字。它正在等你叫出它的，以便交换。',
    'SCENE_tec': 'TEC总部的走廊里没有门牌号。墙壁的材质摸起来像金属，但敲击声是空心的——像是墙后面还有墙。',
    'CHAR_tec': 'TEC 没有影子。或者说，他的影子落在了一个你无法看见的方向。他说话的时候，空气会轻微震动。',
    'SCENE_plant_hunter': '花园里的植物在靠近时会微微转向你。它们的根须在地下形成了一个巨大的网络——你正站在网络的中心。',
    'ITEM_black_curtain': '帘幕后面什么都没有。但当你背对它时，你能感觉到它正在被从后面撑起。',
    'ITEM_plant': '植物的叶片上排列着规律的孔洞。将它们对准光源，会投影出一串数字——或者一个名字。',
    'SCENE_desk': '书桌上有一杯还温热的茶。植物学家离开的时间，可能比你想象的更近。',
    'ITEM_phonograph': '唱机在无人操作时自行转动。唱片上录制的不是音乐——是一个女人在反复说"别碰"。',
    'ITEM_shadow_figure': '黑影是三维的——不，准确地说，它比三维少了什么。它拥有形状、运动，但没有深度。',
    'ITEM_syringe': '注射器里的液体是黑色的，但摇晃后变成透明。静置后恢复黑色。它像是在呼吸。',
    'ITEM_handwritten_note': '笔记上最后一行字写得很用力，划破了纸："它知道我们来了。它一直都知道。"',
    'SCENE_drawer': '抽屉的把手是后人换上去的。原装的那个被保存在抽屉里面——和一把干枯的手指一起。',
    'ITEM_trash_can': '垃圾桶里有几团揉皱的纸条。展开后上面都写着同一句话："不要相信 TEC。"',
    'ITEM_desk_lamp': '灯罩上画着细小的符文。关灯后，符文会继续发光三十秒，然后逐渐熄灭。',
    'ITEM_scissors': '剪刀的刀刃上布满了划痕。它们不是被使用留下的——是在无人使用时自己产生的。',
    'ITEM_wooden_box': '木盒的盖子上刻着"给下一个我"。里面的绒布上有一个物品的压痕，但现在是空的。',
    'ITEM_bandaged_corpse': '绷带下的口鼻位置有呼吸的起伏。它的胸腔里有微弱的心跳——一声之后，永远停止了。',
    'ITEM_corpse_lu': '陆珩松的身体很轻，像是被抽空了什么重要的东西。他的眼睛半睁着，瞳孔里映出的不是天花板——是一座花园。',
    'CHAR_lu': '陆珩松站在那里面无表情。他的嘴唇偶尔微动，像在跟某个不在场的人对话。你问话时，他要过很久才会回答。',
    'ITEM_crumpled_paper': '纸条上的字迹在灯光下时隐时现。用铅笔涂抹纸面空白处，会浮现出另一行字："对不起。"',
    'ITEM_stylus': '唱针的尖端在放大镜下能看到细密的刻痕——它在某张唱片上走过太多遍了。那张唱片录制的，也许是一个人最后的证词。',
    'SCENE_truename': '',
    'CHAR_dcy': '初级调查员的制服还是崭新的。他反复翻着那本空白的笔记本，似乎期待着什么来填满它。',
};
`,
        'start.js': `//  初始桌面与开场配置
// 编辑后运行 node deploy.js 或手动重启服务端

export const INITIAL_BOARD = [
    { templateId: 'CHAR_dcy', x: 40, y: 50, isCaptured: true },
    { templateId: 'SCENE_tec', x: 175, y: 50, isCaptured: true },
    { templateId: 'LOGIC_capture', x: 310, y: 50, isCaptured: true },
    { templateId: 'LOGIC_reason', x: 445, y: 50, isCaptured: true },
    { templateId: 'LOGIC_observe', x: 40, y: 180, isCaptured: true },
    { templateId: 'SCENE_rest', x: 175, y: 180, isCaptured: true },
];

export const INITIAL_SPAWN = [
];
`,
    };
    
    for (const [name, content] of Object.entries(configs)) {
        fs.writeFileSync('js/config/' + name, content, 'utf-8');
        console.log('  ✓ 写入 js/config/' + name);
    }
}

function patchFiles() {
    const oldIds = Object.keys(RENAMES);
    if (!oldIds.length) return;
    
    for (const filePath of FILES) {
        try {
            if (!fs.existsSync(filePath)) {
                console.log('  ⚠ 跳过（不存在）: ' + filePath);
                continue;
            }
            let content = fs.readFileSync(filePath, 'utf-8');
            let changed = false;
            for (const [oldId, newId] of Object.entries(RENAMES)) {
                const regex = new RegExp("'" + oldId.replace(/[.*+?^${}()|[]\\]/g, '\\$&') + "'", 'g');
                const newContent = content.replace(regex, "'" + newId + "'");
                if (newContent !== content) { changed = true; content = newContent; }
            }
            if (changed) {
                fs.writeFileSync(filePath, content, 'utf-8');
                console.log('  ✓ 已更新: ' + filePath);
            } else {
                console.log('  - 无需修改: ' + filePath);
            }
        } catch(e) {
            console.log('  ✗ 失败: ' + filePath + ' - ' + e.message);
        }
    }
}

console.log('=== TEC3 部署脚本 ===');
console.log('写入配置...');
writeFiles();
if (Object.keys(RENAMES).length) {
    console.log('修补运行时文件...');
    patchFiles();
}
console.log('=== 部署完成 ===');
