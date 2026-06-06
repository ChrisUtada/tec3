# TEC3 设计文档

> **版本**: v2.0 | **更新日期**: 2026-06-04

---

## 目录

1. [项目架构](#1-项目架构)
2. [卡牌类型总览](#2-卡牌类型总览)
3. [功能分层设计](#3-功能分层设计)
4. [待完成工作](#4-待完成工作)
5. [后续扩展指南](#5-后续扩展指南)
6. [附录](#附录)

---

## 1. 项目架构

### 1.1 当前文件结构

```
js/
├── config/              # 配置文件
│   ├── cards.js          # 卡牌模板定义 (24张)
│   ├── combinations.js   # 卡牌组合规则
│   ├── scenes.js         # 场景探索配置
│   ├── endings.js        # 归因结局配置
│   └── index.js          # 聚合导出
├── core/                 # ✅ 核心层模块
│   ├── drag-system.js    # 拖拽管理
│   ├── stack-system.js   # 堆叠系统
│   └── task-manager.js   # 任务管理
├── systems/              # ✅ 应用层系统模块
│   ├── sacrifice.js      # 献祭系统
│   └── truename.js       # 真名揭示系统
├── engine.js             # 渲染引擎 + 主循环 (待进一步拆分)
├── logic.js              # 核心游戏逻辑 (卡牌组合)
├── renderer.js           # UI渲染工具
├── exploration.js        # 探索系统
├── reasoning.js          # 归因推演系统
├── dialogue.js           # 对话系统
├── eventbus.js           # 事件总线
├── events.js             # 事件定义
├── shared.js             # 共享工具函数
├── state.js              # 状态管理
├── ui.js                 # UI交互
├── config.js             # 基础配置常量
├── consts.js             # 常量定义
└── main.js               # 入口文件
```

### 1.2 架构状态概览

| 模块 | 状态 | 说明 |
|------|------|------|
| `core/drag-system.js` | ✅ 已完成 | 拖拽事件、吸附检测、堆叠检测全部抽离 |
| `core/stack-system.js` | ✅ 已完成 | 堆叠链管理独立模块 |
| `core/task-manager.js` | ✅ 已完成 | 任务队列、进度条、取消/恢复 |
| `systems/sacrifice.js` | ✅ 已完成 | 献祭系统完全独立于 engine.js |
| `systems/truename.js` | ✅ 已完成 | 真名揭示系统完全独立于 engine.js |
| `engine.js` | ⚠️ 部分 | 仍包含渲染逻辑，待进一步拆分为 render-manager |
| 策略模式注册表 | ❌ 未开始 | 统一卡牌处理器接口 |
| 单元测试 | ❌ 未开始 | 各系统模块测试覆盖 |

---

## 2. 卡牌类型总览

共 **24 张**卡牌模板，按功能类别分类如下：

### 2.1 道具卡 (ITEM_*, type: item)

| ID | 名称 | consumable | 说明 |
|----|------|:---:|------|
| `ITEM_sdt` | 手电筒 | ❌ | 强干涉物理光源，空间跃迁基础 |
| `ITEM_mt` | 木桶 | ✅ | 与贴纸融合成密码盒 |
| `ITEM_tz` | 五行贴纸 | ✅ | 高维规约符号贴纸，与木桶反应 |
| `ITEM_mmh` | 暗码铁盒 | ❌ | 双击激活解码校验机制 |
| `ITEM_cdyg` | 惨白的月亮 | ❌ | 散发诡异光芒的装饰 |
| `ITEM_zxtz` | 嘴型贴纸 | ✅ | 带有神秘图案的贴纸 |
| `ITEM_mmd` | 木门 | ❌ | 一扇古朴的木门 |
| `ITEM_s_qhj` | 奇怪的痕迹 | ✅ | 地板上神秘的擦痕 |
| `ITEM_mk` | 门扣 | ✅ | 沉重的金属门扣 |
| `ITEM_mmd_eyes` | 带有眼睛的木门 | ❌ | 门板嵌着窥视的眼睛 |
| `ITEM_coin` | 因果律 | ✅ | 因果货币，可用于改变事件概率 |

### 2.2 装备卡 (ITEM_*, type: equipment)

| ID | 名称 | consumable | 说明 |
|----|------|:---:|------|
| `ITEM_s_eyes` | 眼睛 | ❌ | 墙上窥视的眼睛 |

### 2.3 功能卡 (type: logic)

| ID | 名称 | consumable | 说明 |
|----|------|:---:|------|
| `LOGIC_capture` | ⚡捕获 | ❌ | 放置在人物/场景/物品上进行捕获，获得隐藏线索 |
| `LOGIC_reason` | 逻辑归因 | ✅ | 双击打开归因推演界面，组合线索推导真相 |
| `ITEM_recycle` | ⚡献祭 | ❌ | 将卡牌拖放到此卡上献祭，获取因果律 |

> **注意**：`ITEM_recycle` 虽以 ITEM_ 为前缀，但 `type` 定义为 `logic`，属于功能卡。

### 2.4 真名容器卡 (type: item)

| ID | 名称 | consumable | 说明 |
|----|------|:---:|------|
| `ITEM_true_name` | ??? | ❌ | 将五感线索拖放至此进行揭示，揭示后显示真名 |

### 2.5 人物卡 (CHAR_*, type: char)

| ID | 名称 | consumable | 说明 |
|----|------|:---:|------|
| `CHAR_zs` | 朱穗 | ❌ | 高级调查员，可进行无卡自发对质 |
| `CHAR_investigator` | 初级调查员 | ❌ | 新人调查员，协助搜索和记录证据 |

### 2.6 场景卡 (SCENE_/SCENES_*, type: scene)

| ID | 名称 | consumable | 说明 |
|----|------|:---:|------|
| `SCENE_wz` | 未知地点 | ✅ | 初始坐标，核心锚点 |
| `SCENES_hzyl` | 荒宅院落 | ❌ | 二级核心场景，堆叠线索触发终局 |

### 2.7 线索卡 (CLUE_/CLUES_*, type: clue)

#### 归因推演线索（用于结局判定）

| ID | 名称 | 感官类型 |
|----|------|------|
| `CLUES_xhpb` | 信号屏蔽 | 视觉 |
| `CLUE_hz_inside` | 宗族谱本 | 视觉 |
| `CLUE_tx` | 铁锈的味道 | 味觉 |
| `CLUE_xhpb` | 信号屏蔽 | 视觉 |
| `CLUE_shadow` | 墙上的阴影 | 视觉 |
| `CLUE_whisper` | 低语声 | 听觉 |
| `CLUE_cold` | 骤降的温度 | 触觉 |
| `CLUE_blood` | 血迹图案 | 视觉 |

#### 五感线索（用于真名揭示）

| ID | 名称 | senseType |
|----|------|------|
| `CLUE_vision_eye` | 扭曲的视线 | `vision` |
| `CLUE_hearing_echo` | 回响的低语 | `hearing` |
| `CLUE_taste_metal` | 金属的苦涩 | `taste` |
| `CLUE_touch_ice` | 刺骨的寒意 | `touch` |
| `CLUE_smell_rot` | 腐朽的气息 | `smell` |

### 2.8 卡牌交互方式总结

| 交互方式 | 适用卡牌 | 触发行为 |
|---------|---------|---------|
| 拖放堆叠 | 所有卡牌 | 建立堆叠关系，触发组合反应 |
| 双击 | `LOGIC_reason` | 打开归因推演窗口 |
| 双击 | 场景卡 (`SCENE_*`) | 打开探索窗口 |
| 双击 | `CHAR_zs`, `CHAR_investigator` | 触发对话系统 |
| 双击 | `ITEM_mmh` | 激活解码校验 |
| 拖放到 `ITEM_recycle` | 任意卡牌 | 献祭获取因果律 |
| 拖放到 `ITEM_true_name` | 五感线索 | 收集感官，揭示真名 |

---

## 3. 功能分层设计

### 3.1 三层架构

```
┌─────────────────────────────────────────────┐
│  应用层 (Application)                        │
│  ├── sacrifice.js    ✅ 献祭系统             │
│  ├── truename.js     ✅ 真名揭示系统         │
│  ├── exploration.js     探索系统             │
│  ├── reasoning.js       归因推演系统         │
│  └── dialogue.js        对话系统             │
└─────────────────────────────────────────────┘
                     ↑ 调用
┌─────────────────────────────────────────────┐
│  核心层 (Core)                               │
│  ├── task-manager.js  ✅ 任务队列管理        │
│  ├── stack-system.js  ✅ 堆叠关系管理        │
│  ├── logic.js            卡牌组合匹配        │
│  └── eventbus.js         事件总线            │
└─────────────────────────────────────────────┘
                     ↑ 调用
┌─────────────────────────────────────────────┐
│  基础层 (Infrastructure)                     │
│  ├── drag-system.js   ✅ 拖拽事件管理        │
│  ├── engine.js        ⚠️ 渲染引擎 + 主循环   │
│  ├── renderer.js         UI渲染工具          │
│  ├── shared.js           共享工具函数        │
│  ├── state.js            状态管理            │
│  └── config/             配置数据            │
└─────────────────────────────────────────────┘
```

### 3.2 系统模块统一接口

所有 `systems/` 下的模块遵循统一接口约定：

```javascript
class XxxSystem {
    canProcess(...args)  // 检查是否应由本系统处理
    process(...args)     // 主要处理逻辑
    cancel(...args)      // 取消处理
    dispose()            // 清理资源
}
```

---

## 4. 待完成工作

### 4.1 优先级排序

| 优先级 | 任务 | 工作量 | 说明 |
|:---:|------|:---:|------|
| **P1** | 拆分 engine.js 渲染逻辑为 render-manager | 中 | 目前 engine.js 仍承担过多渲染职责 |
| **P1** | 统一事件总线集成 | 中 | eventbus.js 已存在，需在各系统间推广使用 |
| **P2** | 实现策略模式注册表 | 高 | 让新增卡牌只需注册处理器，无需修改拖拽代码 |
| **P3** | 添加单元测试 | 高 | 核心层和应用层模块需要测试覆盖 |
| **P3** | engine.js 进一步精简 | 中 | 理想状态：仅保留初始化与主循环 |

### 4.2 策略模式注册表（方案）

当前拖拽系统中的处理器调用仍是硬编码（逐条检查 `canProcess`）：

```javascript
// 现有方式（drag-system.js）
if (d.sacrificeSystem.canProcess(mainCard, target)) { ... }
if (d.trueNameSystem.canProcess(mainCard, target)) { ... }
```

**目标**：通过注册表动态分发，新增系统无需修改 drag-system.js：

```javascript
// 目标方式
const handlers = handlerRegistry.getAll();
for (const handler of handlers) {
    if (handler.canProcess(mainCard, target)) {
        handler.process(mainCard, target);
        return;
    }
}
```

### 4.3 事件总线集成

现有 `eventbus.js` 未在核心流程中使用。建议将以下关键节点改为事件驱动：

- `card:drag-start` → 拖拽开始
- `card:drag-end` → 拖拽结束
- `card:stack` → 堆叠建立
- `card:unstack` → 堆叠解除
- `task:start` / `task:complete` / `task:cancel` → 任务生命周期
- `system:sacrifice` / `system:truename` → 系统事件

---

## 5. 后续扩展指南

### 5.1 添加新卡牌类型

1. 在 `config/cards.js` 定义模板
2. 如需特殊逻辑，在 `systems/` 创建对应模块
3. 在 `config/combinations.js` 注册组合规则
4. 在策略注册表（完成后）注册处理器

### 5.2 设计原则

- **单一职责**：每个模块只负责一个功能领域
- **依赖倒置**：高层不依赖低层，都依赖抽象接口
- **开闭原则**：对扩展开放，对修改封闭
- **组合优于继承**：优先使用组合复用代码

---

## 附录

### A. 关键代码位置

| 功能 | 文件 | 说明 |
|------|------|------|
| 献祭处理 | `systems/sacrifice.js` | canProcess / processSacrifice |
| 真名揭示 | `systems/truename.js` | canProcess / processReveal / collectSense |
| 拖拽管理 | `core/drag-system.js` | startDrag / processDrag / endDrag |
| 堆叠管理 | `core/stack-system.js` | addToStack / removeFromStack / isChildOf |
| 任务管理 | `core/task-manager.js` | enqueueTask / cancelTask / clearProcessingFlag |
| 卡牌组合 | `logic.js` | checkReaction |
| 卡牌模板 | `config/cards.js` | CARD_TEMPLATES (24张) |
| 组合规则 | `config/combinations.js` | CARD_COMBINATIONS |
| 场景配置 | `config/scenes.js` | 探索系统配置 |
| 结局配置 | `config/endings.js` | 归因推演结局 |

### B. 卡牌类型快速索引

| 前缀 | 类型 | 数量 | 示例 |
|------|------|:---:|------|
| `ITEM_` | item / equipment / logic | 14 | 手电筒、木桶、献祭、真名容器、因果律 |
| `CHAR_` | char | 2 | 朱穗、初级调查员 |
| `SCENE_` / `SCENES_` | scene | 2 | 未知地点、荒宅院落 |
| `CLUE_` / `CLUES_` | clue | 13 | 信号屏蔽、五感线索、归因线索 |
| `LOGIC_` | logic | 2 | 捕获、逻辑归因 |

### C. 最近完成记录

| 日期 | 事项 |
|------|------|
| 2026-06-04 | 修复献祭卡双击弹出归因推演弹窗 bug |
| 2026-06-04 | 清理 50+ 处冗余 console.log 调试日志 |
| 2026-06-03 | 抽离献祭系统 → `systems/sacrifice.js` |
| 2026-06-03 | 抽离真名揭示系统 → `systems/truename.js` |
| 2026-06-03 | 创建拖拽管理系统 → `core/drag-system.js` |
| 2026-06-03 | 创建堆叠系统 → `core/stack-system.js` |
| 2026-06-03 | 创建任务管理器 → `core/task-manager.js` |

---

**文档版本**: v2.0  
**创建日期**: 2026-06-03  
**最后更新**: 2026-06-04  
**维护者**: TEC3 开发团队
