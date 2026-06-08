# 🎮 TEC3 - 卡牌探索游戏

一款基于 Web 的卡牌探索游戏，全称 **T.E.C-OS // 纯物理规约终端**。玩家通过拖拽卡牌堆叠组合、场景探索、人物对话、捕获线索与归因推演，逐步揭示故事真相。

- **类型**：卡牌探索 / 多结局叙事
- **技术栈**：原生 HTML5 + CSS3 + JavaScript ES6+ 模块化 + Node.js HTTP 静态服务器
- **运行**：`node server.js` 启动于 `http://127.0.0.1:8080`
- **许可证**：MIT

---

## 📁 项目结构

```
TEC3/
├── index.html              # 主页面（包含所有弹窗 DOM 结构）
├── server.js               # Node.js 静态文件服务器（端口 8080）
├── README.md               # 项目说明文档
│
├── css/
│   ├── style.css           # 全局样式（CSS 变量、布局、header、board）
│   └── components.css      # 组件样式（卡牌、弹窗、进度条、气泡、槽位）
│
└── js/
    ├── main.js             # 入口文件
    ├── consts.js           # 全局常量（卡牌尺寸、进度条、探索、推演）
    ├── state.js            # 全局游戏状态
    ├── eventbus.js         # 事件总线（发布-订阅）
    ├── events.js           # UI 事件绑定层
    ├── engine.js           # 渲染引擎、拖拽管理、初始桌面生成
    ├── logic.js            # 核心游戏逻辑（捕获、密码锁、组合判定、结局）
    ├── renderer.js         # DOM 渲染层（进度条、气泡、卡牌 DOM）
    ├── shared.js           # 共享工具函数（嵌入、拖出、弹窗拖动、类型检查）
    ├── ui.js               # UI 交互（日志、面板、模态控制）
    │
    ├── exploration.js      # 场景探索系统
    ├── dialogue.js         # 人物对话系统
    ├── reasoning.js        # 归因推演系统
    │
    ├── core/               # 核心子系统
    │   ├── task-manager.js    # 抢占式任务调度
    │   ├── drag-system.js     # 拖拽系统
    │   └── stack-system.js    # 堆叠系统
    │
    ├── systems/            # 系统功能模块
    │   ├── sacrifice.js       # 献祭（回收）系统
    │   └── truename.js        # 真名揭示系统
    │
    └── config/             # 配置数据
        ├── index.js
        ├── cards.js          # 卡牌模板定义（32 张）
        ├── combinations.js   # 堆叠组合规则（12+ 条）
        ├── scenes.js         # 场景探索配置（2 个）
        ├── dialogues.js      # 人物对话配置
        └── endings.js        # 结局配置
```

---

## 🎯 当前已实现功能

### 1. 核心玩法
- ✅ 卡牌拖拽与堆叠（多张链式）
- ✅ 堆叠组合系统（A+B→C，可一次产多张）
- ✅ 场景探索（槽位条件限制 + 概率掉落 + 保底）
- ✅ 人物对话（拖入卡牌匹配多轮对话）
- ✅ 归因推演（5 槽位线索组合触发 6 种结局）
- ✅ 献祭回收（任务队列 + 抢占式调度 → 因果律）
- ✅ 真名揭示（五感线索收集 → 揭示旧日存在）
- ✅ 捕获功能（拖到目标上提取隐藏线索）
- ✅ 密码锁（暗码铁盒 305 解锁）

### 2. 卡牌系统（5 type × 32 卡）
| type | 配色 | 数量 | 说明 |
|------|------|------|------|
| `scene` | 紫 `#7c3aed` | 2 | 场景卡，双击进入探索 |
| `char` | 橙 `#e67e22` | 2 | 人物卡，双击对话 |
| `item` | 青 `#5dade2` | 19 | 道具/装备/捕获/货币/中间产物 |
| `clue` | 绿 `var(--color-vision)` | 9 | 线索卡，5 种感官共享绿边框，靠 emoji 区分 |
| `logic` | 浅紫 `#a78bfa` | 2 | 逻辑归因、献祭台 |

### 3. 模块化架构
- ✅ ES6 模块化（`import/export`）
- ✅ Map 替代数组查找（O(1)）
- ✅ 任务管理器（抢占式调度，新任务顶掉旧任务）
- ✅ 依赖注入（系统模块解耦）
- ✅ 事件总线（已定义 18 个事件，预留扩展）
- ✅ DOM 操作统一到 `renderer.js`

---

## 🎴 卡牌配置体系

### 卡牌模板字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✓ | 显示名称 |
| `desc` | string | ✓ | 描述文本 |
| `type` | enum | ✓ | `scene` / `char` / `item` / `clue` / `logic` |
| `class` | string | ✓ | CSS 类名（可空格分隔多个） |
| `consumable` | boolean | ✗ | 组合/探索后是否销毁，默认 `false` |
| `allowDuplicate` | boolean | ✗ | 是否可重复掉落，默认 `false` |
| `senseType` | enum | ✗ | 线索卡的感官类型：`vision` / `hearing` / `taste` / `touch` / `smell` |
| `recycleValue` | number | ✗ | 献祭获得的因果律数量（logic 类型） |
| `value` | number | ✗ | 货币面值（item 类型） |
| `interactText` | string | ✗ | 交互提示文本 |
| `realName` | string | ✗ | 真名卡揭示后的名称 |
| `realDesc` | string | ✗ | 真名卡揭示后的描述 |
| `targetSenses` | string[] | ✗ | 真名卡需要收集的感官数组 |
| `isRevealed` | boolean | ✗ | 真名卡初始状态（默认 `false`） |

### 32 张卡牌一览

| ID | 名称 | type | class | 备注 |
|----|------|------|-------|------|
| ITEM_sdt | 手电筒 | item | item-card | allowDuplicate ✓ |
| SCENE_wz | 场景:未知地点 | scene | scene-card | |
| CHAR_zs | 人物:朱穗 | char | char-card | allowDuplicate ✓ |
| CHAR_investigator | 人物:初级调查员 | char | char-card | |
| SCENES_hzyl | 场景:荒宅院落 | scene | scene-card | |
| CLUE_shadow | 线索:墙上的阴影 | clue | clue-vision | allowDuplicate ✓ |
| ITEM_mt | 道具:木桶 | item | item-card | |
| ITEM_tz | 五行贴纸 | item | item-card | |
| ITEM_mmh | 暗码铁盒 | item | item-card lock-card | 密码 305 |
| CLUE_hz_inside | 线索:宗族谱本 | clue | clue-vision | |
| CLUE_tx | 线索:铁锈的味道 | clue | clue-taste | 触发污染 |
| CLUE_xhpb | 线索:信号屏蔽 | clue | clue-vision | |
| CLUE_vision_eye | 线索:扭曲的视线 | clue | clue-vision | senseType: vision |
| CLUE_hearing_echo | 线索:回响的低语 | clue | clue-hearing | senseType: hearing |
| CLUE_taste_metal | 线索:金属的苦涩 | clue | clue-taste | senseType: taste |
| CLUE_touch_ice | 线索:刺骨的寒意 | clue | clue-touch | senseType: touch |
| CLUE_smell_rot | 线索:腐朽的气息 | clue | clue-smell | senseType: smell |
| CLUE_whisper | 线索:低语声 | clue | clue-hearing | |
| CLUE_cold | 线索:骤降的温度 | clue | clue-touch | |
| CLUE_blood | 线索:血迹图案 | clue | clue-vision | allowDuplicate ✓ |
| LOGIC_capture | ⚡捕获 | item | item-card capture-card | 常驻功能 |
| LOGIC_reason | 逻辑归因 | logic | logic-card | 双击打开归因窗 |
| ITEM_recycle | ⚡献祭 | logic | logic-card | 接收其他卡 → 因果律 |
| ITEM_coin | 因果律 | item | item-card | allowDuplicate ✓ |
| ITEM_true_name | ??? | item | item-card true-name-card | 五感容器 |
| ITEM_cdyg | 惨白的月亮 | item | item-card | allowDuplicate ✓ |
| ITEM_mmd | 木门 | item | item-card | allowDuplicate ✓ |
| ITEM_s_qhj | 奇怪的痕迹 | item | item-card | allowDuplicate ✓ |
| ITEM_mk | 门扣 | item | item-card | allowDuplicate ✓ |
| ITEM_s_eyes | 眼睛 | item | equipment-card | allowDuplicate ✓ |
| ITEM_mmd_eyes | 带有眼睛的木门 | item | item-card | 合成产物 |

---

## 🧩 组合系统（`combinations.js`）

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | enum | ✓ | `explore` / `interaction` / `crafting` / `synthesis` / `capture` / `speech` |
| `result` | string[] | 视 type | 产物 templateId 数组 |
| `message` | string | ✓ | 进度条主提示 |
| `delay` | number | ✓ | 进度条时长（毫秒） |
| `consumeAll` | boolean | ✗ | 两张原料都销毁（优先级最低）|
| `consumeMover` | boolean | ✗ | 仅销毁被拖动的卡（精确控制）|
| `consumeTarget` | boolean | ✗ | 仅销毁被拖到的卡（精确控制）|
| `chance` | number | ✗ | 概率（0~1），低于 1 需配 success/failMessage |
| `successMessage` | string | 视 chance | 概率成功提示 |
| `failMessage` | string | 视 chance | 概率失败提示 |
| `speechText` | string | speech | 气泡文本 |
| `speechDuration` | number | speech | 气泡时长 |

### 消耗控制优先级

```
1. consumeMover / consumeTarget 显式指定 → 精确控制
2. consumeAll === true → 全部销毁
3. 都不指定 → 按各卡牌自身的 consumable 字段决定
```

### 12 条组合规则

| 组合 | type | 产物 | 消耗 |
|------|------|------|------|
| 手电筒 + 未知地点 | explore | 荒宅院落 | 都不消耗 |
| 手电筒 + 朱穗 | interaction | 木桶 | 都不消耗 |
| 五行贴纸 + 木桶 | crafting | 暗码铁盒 | 全部消耗 |
| 惨白月亮 + 手电筒 | crafting | 信号屏蔽（10%） | 都不消耗 |
| 信号屏蔽 + 朱穗 | synthesis | 铁锈的味道 | 都不消耗 |
| 木门 + 眼睛 | crafting | 带眼睛的木门 | 仅消耗木门 |
| 手电筒 + 带眼睛木门 | explore | 荒宅院落 | 都不消耗 |
| 7 条 `LOGIC_capture + X` | capture | 3 条线索 | 都不消耗 |

---

## 🌍 场景系统（`scenes.js`）

每个场景定义在 `SCENE_EXPLORATION` 对象里：

```js
'SCENE_wz': {
    name: '未知地点',
    slots: 3,                    // 槽位数
    exploreTime: 5000,           // 探索时长（毫秒）
    message: '探索...',
    
    // 必放卡条件（可选）
    requiredCards: [
        { templateId: 'ITEM_sdt', min: 1, max: 1 },
        { type: 'clue', min: 1, max: 2 }   // 也可按 type 匹配
    ],
    
    // 掉落配置
    drops: [
        { templateId: 'ITEM_cdyg', chance: 1.0, message: '发现了惨白的月亮！' }
    ]
}
```

| 场景 | 槽位 | 必放 | 主要掉落 |
|------|------|------|---------|
| `SCENE_wz` 未知地点 | 3 | 1 手电筒 + 1 初级调查员 | 月亮、贴纸、木门、痕迹、门扣、眼睛、手电筒 |
| `SCENES_hzyl` 荒宅院落 | 3 | 1 朱穗 + 1~2 线索 | 血迹、阴影、手电筒、朱穗（20%）|

掉落是否可重复由**卡牌模板**的 `allowDuplicate` 决定，无需在 drop 配置中重复声明。

---

## 🛠️ 技术栈

- **前端**：原生 HTML5 + CSS3 + JavaScript ES6+ Modules
- **服务器**：Node.js HTTP 模块
- **架构**：模块化 + 依赖注入 + 任务队列 + 事件总线
- **状态管理**：全局 `gameState` 对象 + `Map` 索引
- **样式**：CSS 变量体系 + Flexbox/Grid + 渐变 + 动画

---

## 🚀 快速开始

### 启动开发服务器

```bash
# 进入项目目录
cd TEC3

# 启动本地服务器
node server.js

# 打开浏览器访问
http://127.0.0.1:8080
```

### 端口冲突处理

```bash
# Windows 查找占用进程
netstat -ano | findstr :8080

# 终止进程
taskkill /F /PID <PID>

# 重新启动
node server.js
```

---

## 📝 配置指南

### 添加新卡牌

编辑 `js/config/cards.js`：

```js
'NEW_CARD_ID': {
    name: '卡牌名称',
    desc: '卡牌描述',
    type: 'item',         // scene/char/item/clue/logic
    class: 'item-card',   // CSS 类名
    consumable: false,    // 是否消耗
    allowDuplicate: true  // 是否可重复掉落
}
```

### 添加新组合

编辑 `js/config/combinations.js`：

```js
'CARD1+CARD2': {            // 按字典序 sort() 后拼接
    type: 'crafting',
    result: ['RESULT_CARD'],
    message: '组合提示',
    delay: 2000,
    consumeAll: true         // 或 consumeMover / consumeTarget 精确控制
}
```

### 添加新场景

编辑 `js/config/scenes.js`：

```js
'SCENE_ID': {
    name: '场景名',
    slots: 3,
    exploreTime: 5000,
    message: '提示',
    requiredCards: [
        { templateId: 'ITEM_xxx', min: 1, max: 1 }
    ],
    drops: [
        { templateId: 'ITEM_yyy', chance: 0.5, message: '掉落提示' }
    ]
}
```

---

## 🎮 游戏操作指南

### 基础操作
- **拖拽**：点击卡牌并拖动到目标位置
- **堆叠**：拖放到另一张卡上触发组合
- **双击**：双击卡牌触发专属行为（场景→探索，人物→对话，逻辑归因→推演，密码锁→解码）

### 探索流程
1. 双击场景卡打开探索窗口
2. 按 `requiredCards` 提示放入必放卡
3. 点击"探索"按钮
4. 等待 `exploreTime` 毫秒的进度条
5. 概率掉落（命中为空时触发保底随机）

### 献祭流程
1. 将卡牌拖放到"⚡献祭"卡上
2. 3 秒进度条（任务队列，新卡顶掉旧卡）
3. 自动生成因果律金币（每张 10 因果律）

### 真名揭示流程
1. 将五感线索卡（带 `senseType`）拖放到 `???` 真名卡
2. 每次 2 秒进度条，标记该感官已收集
3. 五感集齐后揭示真名「深渊低语者」

---

## 📋 后续开发计划

### 已完成
- ✅ 卡牌系统 5 type 划分
- ✅ 配色统一（每 type 单一颜色）
- ✅ 模块化拆分（core / systems）
- ✅ 任务队列（抢占式调度）
- ✅ 依赖注入（系统模块解耦）
- ✅ 事件总线（18 事件预留）
- ✅ Map 索引（O(1) 查找）
- ✅ 增量 z-index 管理
- ✅ `allowDuplicate` 统一属性
- ✅ 真名揭示 bug 修复

### 待完成
- 🔄 事件总线全面接入
- 🔄 存档系统（localStorage 保存 flags/进度）
- 🔄 移动端适配（触屏拖放）
- 🔄 卡牌动画增强（入场/出场/翻转）
- 🔄 `combinations.js` 的 `type` 字段驱动差异化行为
- 🔄 TypeScript 迁移
- 🔄 单元测试覆盖

---

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📧 联系方式

如有问题或建议，请通过 Issue 联系。
