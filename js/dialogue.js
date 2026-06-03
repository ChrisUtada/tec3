//  人物对话系统
import { DIALOGUE_DATA } from './config.js';
import { log } from './ui.js';
import { embedCardInSlot, restoreCardToBoard, initModalDrag } from './shared.js';

let currentDialogue = null;  // 当前人物 templateId
let currentCardType = null;  // 当前槽位中的卡牌类型
let dialogueIndex = 0;       // 当前对话索引
let currentDialogueList = []; // 当前对话列表
let draggedCardData = null;  // 记录被拖入的卡牌数据

// 延迟获取 DOM 元素，确保 DOM 已加载
let dialogueModal, dialogueTitle, dialogueSlot, dialogueText, nextBtn, endBtn;

function initDialogueElements() {
    if (!dialogueModal) {
        dialogueModal = document.getElementById('dialogue-modal');
        dialogueTitle = document.getElementById('dialogue-title');
        dialogueSlot = document.getElementById('dialogue-slot');
        dialogueText = document.getElementById('dialogue-text');
        nextBtn = document.getElementById('dialogue-next-btn');
        endBtn = document.getElementById('dialogue-end-btn');
    }
}

// 打开对话窗口
export function openDialogue(characterId) {
    initDialogueElements();
    
    if (!DIALOGUE_DATA[characterId]) {
        log(`❌ [对话系统] 未找到该人物的对话数据`, "normal");
        return;
    }

    currentDialogue = characterId;
    currentCardType = null;
    dialogueIndex = 0;
    currentDialogueList = [];

    const charData = DIALOGUE_DATA[characterId];
    dialogueTitle.innerText = `与【${charData.name}】对话`;
    
    // 重置槽位
    dialogueSlot.innerHTML = '<div class="dialogue-slot-placeholder">将卡牌拖入此处</div>';
    dialogueText.innerText = '将物品、场景或线索拖入上方槽位，查看对应对话内容。';
    
    // 隐藏按钮
    nextBtn.style.display = 'none';
    endBtn.style.display = 'none';

    // 显示弹窗
    dialogueModal.style.display = 'flex';
    
    // 初始化弹窗拖动
    initDialogueDrag();
    
    log(`️ [对话系统] 开启了与【${charData.name}】的对话`, "success");
}

// 关闭对话窗口
export function closeDialogueModal() {
    initDialogueElements();
    
    dialogueModal.style.display = 'none';
    
    // 恢复桌面上的卡牌
    if (draggedCardData) {
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
        dialogueSlot.classList.remove('drag-over');
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

    const templateId = cardData.templateId;
    const charData = DIALOGUE_DATA[currentDialogue];

    // 检查是否有对应的对话
    let dialogueList = charData.dialogues[templateId];
    
    if (!dialogueList) {
        // 使用默认对话
        dialogueList = charData.defaultDialogues;
        log(`🗣️ ${charData.name}：（看着你拿来的东西，似乎不知该如何回应）`, "normal");
    }

    currentCardType = templateId;
    currentDialogueList = dialogueList;
    dialogueIndex = 0;
    draggedCardData = cardData;  // 保存卡牌数据

    // 将卡牌移动到槽位中
    const cardEl = document.getElementById(cardData.instanceId);
    if (cardEl) {
        // 使用共享工具函数嵌入卡牌
        embedCardInSlot(cardEl, cardData, dialogueSlot);
        
        // 添加拖出功能
        setupCardDragOut(cardEl, cardData);
    }

    dialogueSlot.classList.add('drag-over');

    // 显示第一条对话
    showDialogue();
}

// 显示当前对话
function showDialogue() {
    if (dialogueIndex >= currentDialogueList.length) {
        // 对话结束
        dialogueText.innerText = '对话已结束。';
        nextBtn.style.display = 'none';
        endBtn.style.display = 'inline-block';
        return;
    }

    const dialogue = currentDialogueList[dialogueIndex];
    dialogueText.innerText = dialogue.text;

    // 显示按钮
    if (dialogueIndex < currentDialogueList.length - 1) {
        // 还有下一条对话
        nextBtn.style.display = 'inline-block';
        endBtn.style.display = 'none';
    } else {
        // 最后一条对话
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

// 初始化弹窗拖动功能
function initDialogueDrag() {
    initModalDrag(dialogueModal);
}

// 供 HTML onclick 调用的全局函数
window.closeDialogueModal = closeDialogueModal;
window.nextDialogue = nextDialogue;

// 设置卡牌拖出功能
function setupCardDragOut(cardEl, cardData) {
    let isDragging = false;
    let startX, startY;
    
    cardEl.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        cardEl.classList.remove('embedded');
        cardEl.style.cursor = 'grabbing';
        
        e.preventDefault();
        e.stopPropagation();
    });
    
    const moveHandler = (e) => {
        if (!isDragging) return;
        
        const diffX = e.clientX - startX;
        const diffY = e.clientY - startY;
        
        if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
            // 使用共享工具函数恢复卡牌到桌面
            restoreCardToBoard(cardData);
            
            // 清除对话状态
            draggedCardData = null;
            currentCardType = null;
            currentDialogueList = [];
            dialogueIndex = 0;
            
            // 重置槽位
            dialogueSlot.innerHTML = '<div class="dialogue-slot-placeholder">将卡牌拖入此处</div>';
            dialogueSlot.classList.remove('drag-over');
            
            // 重置对话文字
            dialogueText.innerText = '将物品、场景或线索拖入上方槽位，查看对应对话内容。';
            nextBtn.style.display = 'none';
            endBtn.style.display = 'none';
            
            log(`🔄 [对话系统] 卡牌已取出`, "normal");
            
            // 移除事件监听
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
        }
    };
    
    const upHandler = () => {
        if (isDragging) {
            isDragging = false;
            cardEl.classList.add('embedded');
            cardEl.style.cursor = 'grab';
        }
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
}
