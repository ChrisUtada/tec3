// 🔧 共享工具函数 - 消除重复代码
import { CARD_TEMPLATES } from './config.js';
import { log } from './ui.js';

/**
 * 将卡牌元素嵌入到槽位中
 * @param {HTMLElement} cardEl - 卡牌元素
 * @param {Object} cardData - 卡牌数据
 * @param {HTMLElement} slotElement - 槽位元素
 * @param {string} embeddedClass - 嵌入样式类名（可选）
 */
export function embedCardInSlot(cardEl, cardData, slotElement, embeddedClass = 'embedded') {
    if (!cardEl || !slotElement) return;
    
    // 保存原始位置
    cardData.originalX = cardData.x;
    cardData.originalY = cardData.y;
    
    // 设置卡牌样式为相对定位
    cardEl.style.position = 'relative';
    cardEl.style.left = 'auto';
    cardEl.style.top = 'auto';
    cardEl.style.display = 'flex';
    cardEl.style.width = '106px';
    cardEl.style.height = '136px';
    cardEl.style.zIndex = '10';
    
    // 添加嵌入效果
    cardEl.classList.add(embeddedClass);
    
    // 清空槽位并放入卡牌
    slotElement.innerHTML = '';
    slotElement.appendChild(cardEl);
    slotElement.classList.add('drag-over');
}

/**
 * 将卡牌恢复到桌面画布
 * @param {Object} cardData - 卡牌数据
 * @param {string} containerId - 容器 ID（默认为 board-canvas）
 */
export function restoreCardToBoard(cardData, containerId = 'board-canvas') {
    const cardEl = document.getElementById(cardData.instanceId);
    if (!cardEl) return;
    
    const boardCanvas = document.getElementById(containerId);
    boardCanvas.appendChild(cardEl);
    
    cardEl.style.position = 'absolute';
    cardEl.style.left = cardData.x + 'px';
    cardEl.style.top = cardData.y + 'px';
    cardEl.style.display = 'flex';
    cardEl.style.width = '115px';
    cardEl.style.height = '150px';
    cardEl.classList.remove('embedded');
}

/**
 * 设置卡牌拖出功能
 * @param {HTMLElement} cardEl - 卡牌元素
 * @param {Object} cardData - 卡牌数据
 * @param {number} slotIndex - 槽位索引
 * @param {Array} slotsArray - 槽位数据数组（用于清空槽位）
 * @param {HTMLElement} slotElement - 槽位元素（用于重置显示）
 * @param {Function} onUpdate - 更新回调函数（可选）
 * @param {string} logMessage - 日志消息
 */
export function setupCardDragOut(cardEl, cardData, slotIndex, slotsArray, slotElement, onUpdate = null, logMessage = '卡牌已从槽位取出') {
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
            // 将卡牌移回桌面
            restoreCardToBoard(cardData);
            
            // 清除槽位数据
            if (slotsArray && slotIndex !== undefined) {
                slotsArray[slotIndex] = null;
            }
            
            // 重置槽位显示
            if (slotElement) {
                slotElement.innerHTML = `<div class="slot-placeholder">槽位 ${slotIndex + 1}</div>`;
                slotElement.classList.remove('drag-over');
            }
            
            // 执行更新回调
            if (onUpdate) onUpdate();
            
            log(`🔄 [系统] ${logMessage}`, "normal");
            
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

/**
 * 初始化弹窗拖动功能（通用版）
 * @param {HTMLElement} modal - 弹窗元素
 * @param {Function} isBlocked - 是否阻止拖动的检查函数（可选）
 */
export function initModalDrag(modal, isBlocked = null) {
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    
    const modalHeader = modal.querySelector('.modal-header');
    if (!modalHeader) return;
    
    modalHeader.addEventListener('mousedown', (e) => {
        // 检查是否阻止拖动
        if (isBlocked && isBlocked()) return;
        
        isDragging = true;
        const rect = modal.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        modal.style.cursor = 'grabbing';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        if (isBlocked && isBlocked()) return;
        
        const boardCanvas = document.getElementById('board-canvas');
        const boardRect = boardCanvas.getBoundingClientRect();
        
        let newX = e.clientX - boardRect.left - dragOffsetX;
        let newY = e.clientY - boardRect.top - dragOffsetY;
        
        // 限制在画布范围内
        newX = Math.max(0, Math.min(newX, boardRect.width - modal.offsetWidth));
        newY = Math.max(0, Math.min(newY, boardRect.height - modal.offsetHeight));
        
        modal.style.left = newX + 'px';
        modal.style.top = newY + 'px';
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            modal.style.cursor = 'move';
        }
    });
}

/**
 * 检查卡牌类型是否匹配
 * @param {string} templateId - 卡牌模板 ID
 * @param {string} expectedType - 期望的类型
 * @returns {boolean}
 */
export function isCardType(templateId, expectedType) {
    const template = CARD_TEMPLATES[templateId];
    return template && template.type === expectedType;
}

/**
 * 显示/隐藏弹窗
 * @param {HTMLElement} modal - 弹窗元素
 * @param {boolean} show - 是否显示
 */
export function toggleModal(modal, show) {
    if (modal) {
        modal.style.display = show ? 'flex' : 'none';
    }
}

/**
 * 重置槽位显示
 * @param {HTMLElement} slotElement - 槽位元素
 * @param {string} placeholderText - 占位符文本
 */
export function resetSlotDisplay(slotElement, placeholderText = '将卡牌拖入此处') {
    if (!slotElement) return;
    slotElement.innerHTML = `<div class="slot-placeholder">${placeholderText}</div>`;
    slotElement.classList.remove('drag-over');
}
