// 组合配方
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
