//  人物对话系统
import { DIALOGUE_DATA } from './config.js';
import { log } from './ui.js';
import { embedCardInSlot, restoreCardToBoard, setupCardDragOut, closeOtherPanels } from './shared.js';

let currentDialogue = null;  // 当前人物 templateId
let currentCardType = null;  // 当前槽位中的卡牌类型
let dialogueIndex = 0;       // 当前对话索引
let currentDialogueList = []; // 当前对话列表
let draggedCardData = null;  // 记录被拖入的卡牌数据

// 延迟获取 DOM 元素，确保 DOM 已加载
let dialoguePanel, dialogueTitle, dialogueSlot, dialogueText, nextBtn, endBtn, confirmBtn;

function initDialogueElements() {
    if (!dialoguePanel) {
        dialoguePanel = document.getElementById('dialogue-panel');
        dialogueTitle = document.getElementById('dialogue-title');
        dialogueSlot = document.getElementById('dialogue-slot');
        dialogueText = document.getElementById('dialogue-text');
        nextBtn = document.getElementById('dialogue-next-btn');
        endBtn = document.getElementById('dialogue-end-btn');
        confirmBtn = document.getElementById('dialogue-confirm-btn');
    }
}

// 打开对话窗口
export function openDialogue(characterId) {
    initDialogueElements();
    
    if (!DIALOGUE_DATA[characterId]) {
        log(`❌ [对话系统] 未找到该人物的对话数据`, "normal");
        return;
    }

    const charData = DIALOGUE_DATA[characterId];

    const doOpen = () => {
        currentDialogue = characterId;
        currentCardType = null;
        dialogueIndex = 0;
        currentDialogueList = [];

        dialogueTitle.innerText = `与【${charData.name}】对话`;
        
        dialogueSlot.innerHTML = '<div class="dialogue-slot-placeholder">将卡牌拖入此处</div>';
        dialogueText.innerText = '将物品、场景或线索拖入上方槽位，查看对应对话内容。';
        
        nextBtn.style.display = 'none';
        endBtn.style.display = 'none';
    if (confirmBtn) confirmBtn.style.display = 'none';
    // 监听从外部关闭
    if (!dialoguePanel._cleanupAttached) {
        dialoguePanel.addEventListener('panelclosed', () => {
            if (draggedCardData) {
                const panelWidth = 420;
                const cardWidth = 115;
                const visibleRightBound = window.innerWidth - panelWidth - cardWidth - 20;
                if (draggedCardData.x > visibleRightBound) {
                    draggedCardData.x = visibleRightBound;
                }
                restoreCardToBoard(draggedCardData);
                draggedCardData = null;
            }
            currentDialogue = null;
            currentCardType = null;
            dialogueIndex = 0;
            currentDialogueList = [];
            if (dialogueSlot) {
                dialogueSlot.innerHTML = '<div class="dialogue-slot-placeholder">将卡牌拖入此处</div>';
                dialogueSlot.classList.remove('drag-over', 'shake-error');
            }
        });
        dialoguePanel._cleanupAttached = true;
    }

        dialoguePanel.classList.remove('panel-closing');
        dialoguePanel.style.display = 'flex';
        
        log(`️ [对话系统] 开启了与【${charData.name}】的对话`, "success");
    };

    // 关闭其他面板，然后滑入
    closeOtherPanels('dialogue-panel');
    // 如果对话框已打开（切换角色），先滑出再滑入
    if (dialoguePanel.style.display === 'flex') {
        dialoguePanel.classList.add('panel-closing');
        setTimeout(() => {
            dialoguePanel.style.display = 'none';
            dialoguePanel.classList.remove('panel-closing');
            setTimeout(doOpen, 50);
        }, 250);
    } else {
        doOpen();
    }
}

// 关闭对话窗口
export function closeDialogueModal() {
    initDialogueElements();
    
    // 滑出动画
    dialoguePanel.classList.add('panel-closing');
    const hideTimer = setTimeout(() => {
        dialoguePanel.style.display = 'none';
        dialoguePanel.classList.remove('panel-closing');
    }, 300);
    
    // 恢复桌面上的卡牌
    if (draggedCardData) {
        // 将卡牌恢复到面板左侧可见区域
        const panelWidth = 420;
        const cardWidth = 115;
        const visibleRightBound = window.innerWidth - panelWidth - cardWidth - 20;
        if (draggedCardData.x > visibleRightBound) {
            draggedCardData.x = visibleRightBound;
        }
        restoreCardToBoard(draggedCardData);
        draggedCardData = null;
    }
    
    currentDialogue = null;
    currentCardType = null;
    dialogueIndex = 0;
    currentDialogueList = [];
    
    // 重置槽位
    if (dialogueSlot) {
        dialogueSlot.innerHTML = '<div class="dialogue-slot-placeholder">将卡牌拖入此处</div>';
        dialogueSlot.classList.remove('drag-over', 'shake-error');
    }
    
    log(`️ [对话系统] 结束了对话`, "normal");
}

// 将卡牌放入槽位
export function placeCardInSlot(cardData) {
    initDialogueElements();
    
    if (!currentDialogue) {
        log(`❌ [对话系统] 请先打开人物对话窗口`, "normal");
        return;
    }

    draggedCardData = cardData;

    // 将卡牌移动到槽位中
    const cardEl = document.getElementById(cardData.instanceId);
    if (cardEl) {
        embedCardInSlot(cardEl, cardData, dialogueSlot);
        setupCardDragOut(cardEl, cardData, {
            slotIndex: 0,
            slotsArray: null,
            slotElement: dialogueSlot,
            placeholderText: '将卡牌拖入此处',
            onRemove: () => {
                const pW = 420, cW = 115;
                const rightBound = window.innerWidth - pW - cW - 20;
                if (cardData.x > rightBound) cardData.x = rightBound;
                if (cardData.y > window.innerHeight - 200) cardData.y = window.innerHeight - 200;
                dialogueSlot.classList.remove('shake-error', 'drag-over');
                draggedCardData = null;
                currentCardType = null;
                currentDialogueList = [];
                dialogueIndex = 0;
                dialogueText.innerText = '将物品、场景或线索拖入上方槽位，查看对应对话内容。';
                nextBtn.style.display = 'none';
                endBtn.style.display = 'none';
                confirmBtn.style.display = 'none';
            },
            logMessage: '对话系统：卡牌已取出'
        });
    }
    dialogueSlot.classList.remove('shake-error');
    dialogueSlot.classList.add('drag-over');

    // 显示确认按钮，等待玩家验证
    confirmBtn.style.display = 'inline-block';
    nextBtn.style.display = 'none';
    endBtn.style.display = 'none';
    dialogueText.innerText = '请确认要使用的卡牌。';
}

// 点击确认对话：验证卡牌是否有对应对话
export function confirmDialogueCard() {
    initDialogueElements();

    if (!currentDialogue || !draggedCardData) {
        dialogueText.innerText = '请先将一张卡牌放入槽位。';
        return;
    }

    const templateId = draggedCardData.templateId;
    const charData = DIALOGUE_DATA[currentDialogue];
    const dialogueList = charData.dialogues?.[templateId];

    if (!dialogueList) {
        dialogueSlot.classList.remove('shake-error');
        void dialogueSlot.offsetWidth;
        dialogueSlot.classList.add('shake-error');
        dialogueText.innerText = '这张卡牌无法与当前角色进行对话。';
        log(`❌ [对话系统] ${charData.name} 对「${draggedCardData.templateId}」没有对话配置`, "normal");
        return;
    }

    currentCardType = templateId;
    currentDialogueList = dialogueList;
    dialogueIndex = 0;
    confirmBtn.style.display = 'none';
    showDialogue();
}

// 显示当前对话
function showDialogue() {
    if (confirmBtn) confirmBtn.style.display = 'none';
    if (dialogueIndex >= currentDialogueList.length) {
        dialogueText.innerText = '对话已结束。';
        nextBtn.style.display = 'none';
        endBtn.style.display = 'inline-block';
        return;
    }

    const dialogue = currentDialogueList[dialogueIndex];
    dialogueText.innerText = dialogue.text;

    if (dialogueIndex < currentDialogueList.length - 1) {
        nextBtn.style.display = 'inline-block';
        endBtn.style.display = 'none';
    } else {
        nextBtn.style.display = 'none';
        endBtn.style.display = 'inline-block';
    }
}

// 下一条对话
export function nextDialogue() {
    if (dialogueIndex < currentDialogueList.length - 1) {
        dialogueIndex++;
        showDialogue();
    }
}

// 右侧面板固定定位，无需拖动
