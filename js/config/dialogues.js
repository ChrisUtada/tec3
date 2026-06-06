// 💬 人物对话配置
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
    },
    
    'CHAR_investigator': {
        name: '初级调查员',
        defaultDialogues: [
            { text: '初级调查员紧张地说："我、我刚被分配到这个案子...请多指教。"', index: 0 },
            { text: '初级调查员翻开笔记本："总部让我们记录所有异常现象，可是...我什么都不懂。"', index: 1 },
            { text: '初级调查员小声问："TEC 真的存在吗？我只在入职合同上见过这个名字。"', index: 2 }
        ]
    },
    
    'CHAR_tec': {
        name: 'TEC',
        dialogues: {
            'SCENE_tec': [
                { text: 'TEC："欢迎回来，调查员。总部一切正常。至少...对外是这样。"', index: 0 },
                { text: 'TEC："为什么盯着总部看？它在你的认知里，就只是几间办公室而已。"', index: 1 },
                { text: 'TEC："有些东西你越追问，它越不愿意回答你。"', index: 2 }
            ],
            'SCENE_plant_hunter': [
                { text: 'TEC停下手中动作："植物学家的花园...你为什么要去那里？"', index: 0 },
                { text: 'TEC压低声音："那里没有植物学家。只有植物。"', index: 1 },
                { text: 'TEC："如果你执意要去，别带回任何种子。它们会记得你。"', index: 2 }
            ],
            'SCENE_wz': [
                { text: 'TEC："未知地点...我们的档案里没有这个坐标。"', index: 0 },
                { text: 'TEC顿了顿："或者有，但被标记为不可访问。"', index: 1 },
                { text: 'TEC："你确信那个地方真的存在吗？"', index: 2 }
            ],
            'CLUE_shadow': [
                { text: 'TEC接过阴影的影像："这个角度的光源...违反了十七层折射率。"', index: 0 },
                { text: 'TEC："这影子不是被遮挡出来的，是被「写」出来的。"', index: 1 },
                { text: 'TEC："谁有这个权限？"', index: 2 }
            ],
            'CLUE_blood': [
                { text: 'TEC审视着血迹图案："这是...指引。或者警告。"', index: 0 },
                { text: 'TEC："血液在我们这里只是旧计量单位。"', index: 1 },
                { text: 'TEC："别试着翻译它，让它自己告诉你。"', index: 2 }
            ],
            'CLUE_hz_inside': [
                { text: 'TEC看见宗族谱本，瞳孔收缩："你从哪里拿到这个的？"', index: 0 },
                { text: 'TEC急忙说："这份谱本不应该流出 T.E.C 的物理隔绝层。"', index: 1 },
                { text: 'TEC："如果你已经看到上面的名字...我需要你忘掉它们。"', index: 2 }
            ],
            'CLUE_tx': [
                { text: 'TEC后退一步："铁锈的味道...你接触过污染源。"', index: 0 },
                { text: 'TEC命令道："立刻进入 3 号隔离协议，不要再接触任何实物。"', index: 1 },
                { text: 'TEC低声说："这味道意味着 T.E.C 的边界正在失效。"', index: 2 }
            ],
            'CLUE_xhpb': [
                { text: 'TEC："信号屏蔽装置。我们内部称为「规约擦除器」。"', index: 0 },
                { text: 'TEC："它会同时屏蔽你和异常之间的因果连接。"', index: 1 },
                { text: 'TEC："代价是你会暂时失去对 T.E.C 的访问权限。"', index: 2 }
            ],
            'ITEM_mmd_eyes': [
                { text: 'TEC凝视着木门上的眼睛："这扇门不该在这里。"', index: 0 },
                { text: 'TEC："这是旧时代的产物。我们在 H-07 之前就禁止了它。"', index: 1 },
                { text: 'TEC："不要盯着它的瞳孔看。它会以为你在回答。"', index: 2 }
            ],
            'ITEM_true_name': [
                { text: 'TEC沉默良久："你找到了它。"', index: 0 },
                { text: 'TEC："T.E.C 成立的初衷，就是为了阻止这个名字被念出。"', index: 1 },
                { text: 'TEC："但现在你已经把它装在容器里了。它也看见了你。"', index: 2 }
            ],
            'CLUE_vision_eye': [
                { text: 'TEC接过扭曲的视线："视网膜上的残影...这不是你的眼睛看见的。"', index: 0 },
                { text: 'TEC："你的视神经被改写过了。写入方不在 T.E.C 名册上。"', index: 1 },
                { text: 'TEC："能让你看见不存在的东西，是一种祝福。也是诅咒。"', index: 2 }
            ],
            'CLUE_hearing_echo': [
                { text: 'TEC侧耳倾听："这是低语层的声音...你听过几次？"', index: 0 },
                { text: 'TEC："T.E.C 的隔音标准是 17 级。这个声音穿透了 19 级。"', index: 1 },
                { text: 'TEC："如果你能听懂它在说什么，告诉我。我需要你逐字复述。"', index: 2 }
            ],
            'CLUE_taste_metal': [
                { text: 'TEC递过来一杯水："漱口。这不是金属，是凝固的因果律。"', index: 0 },
                { text: 'TEC："你舔到了什么不该存在的东西。"', index: 1 },
                { text: 'TEC："从现在起，你对 T.E.C 的访问权是临时的。"', index: 2 }
            ],
            'CLUE_touch_ice': [
                { text: 'TEC看着你发青的指尖："热力学崩溃的症状。"', index: 0 },
                { text: 'TEC："你的体温正在向某个不在这个维度的坐标传导。"', index: 1 },
                { text: 'TEC："如果它继续抽取，你会变成一个低温镜像。T.E.C 已经有七个了。"', index: 2 }
            ],
            'CLUE_smell_rot': [
                { text: 'TEC皱眉："腐朽的气息...是花园的痕迹。"', index: 0 },
                { text: 'TEC低声说："植物学家失踪前的最后报告里提到过这个味道。"', index: 1 },
                { text: 'TEC："如果你闻到了，说明那个花园已经在你体内种下了什么。"', index: 2 }
            ],
            'CHAR_zs': [
                { text: 'TEC看向朱穗："高级调查员。她很有潜力。但她不属于这里。"', index: 0 },
                { text: 'TEC："朱穗知道的比她愿意说的多。让她继续调查对你有好处。"', index: 1 },
                { text: 'TEC："等她发现得太多的时候，T.E.C 会接管她。"', index: 2 }
            ],
            'CHAR_investigator': [
                { text: 'TEC："初级调查员？他是被你送进来的。"', index: 0 },
                { text: 'TEC："从那扇门进来的人，都已经不是他们自己。"', index: 1 },
                { text: 'TEC："T.E.C 接收的是躯壳。名字会换一个。"', index: 2 }
            ],
            'ITEM_sdt': [
                { text: 'TEC："手电筒。古典的光学工具。我们已经不再使用。"', index: 0 },
                { text: 'TEC："但对低层级调查员来说，它比任何规约都可靠。"', index: 1 },
                { text: 'TEC："用它的光去照一切你认为可疑的东西。"', index: 2 }
            ]
        },
        defaultDialogues: [
            { text: 'TEC："我一直在观察你。从你第一次打开那扇门开始。"', index: 0 },
            { text: 'TEC："T.E.C 不是一个机构。T.E.C 是一个问题。"', index: 1 },
            { text: 'TEC："如果你还在问我是不是真实存在的，那说明你还没准备好。"', index: 2 }
        ]
    }
};
