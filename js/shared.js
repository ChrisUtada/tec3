// 🔧 共享工具函数 - 消除重复代码
import { CARD_TEMPLATES } from './config.js';
import { log } from './ui.js';
import { CARD } from './consts.js';
import { dragEventManager } from './core/drag-event-manager.js';

/**
 * 创建惰性初始化的 DOM 元素获取函数
 * @param {Object} elementDefs - 元素定义，key 为变量名，value 为元素 ID
 * @returns {Function} 初始化函数，调用时获取所有元素
 * 
 * @example
 * const { modal, title, closeBtn } = createLazyElements({
 *     modal: 'dialogue-modal',
 *     title: 'dialogue-title',
 *     closeBtn: 'dialogue-close-btn'
 * });
 * // 之后调用 init() 来获取元素
 */
export function createLazyInitializer(elementDefs) {
    let initialized = false;
    const elements = {};
    
    return function init() {
        if (initialized) return elements;
        
        for (const [key, id] of Object.entries(elementDefs)) {
            elements[key] = document.getElementById(id);
        }
        initialized = true;
        return elements;
    };
}

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
    cardEl.style.zIndex = '10';
    cardEl.style.transform = ''; // 清除可能存在的缩放
    
    // 添加嵌入效果
    cardEl.classList.add(embeddedClass);
    
    // 标记卡牌在槽位中，禁用双击事件
    cardEl.dataset.embedded = 'true';
    
    // 清空槽位并放入卡牌
    slotElement.innerHTML = '';
    slotElement.appendChild(cardEl);
    slotElement.classList.add('drag-over');
}

/**
 * 将卡牌恢复到桌面画布
 * @param {Object} cardData - 卡牌数据
 * @param {string} containerId - 容器 ID（默认为 board-canvas）
 * @param {boolean} forceRandom - 是否强制随机位置（用于从槽位恢复的卡牌）
 */
export function restoreCardToBoard(cardData, containerId = 'board-canvas', forceRandom = false) {
    const cardEl = document.getElementById(cardData.instanceId);
    if (!cardEl) return;
    
    const boardCanvas = document.getElementById(containerId);
    boardCanvas.appendChild(cardEl);
    
    // 计算可见区域边界（右侧面板宽度为420px）
    const panelWidth = 420;
    const visibleRightBound = window.innerWidth - panelWidth - CARD.WIDTH - 20;
    const visibleBottomBound = window.innerHeight - CARD.HEIGHT - 20;
    
    // 如果强制随机位置，或者卡牌位置在面板区域内，调整到可见区域的随机位置
    if (forceRandom || cardData.x > visibleRightBound || cardData.y > visibleBottomBound) {
        // 在面板左侧可见区域内随机放置（靠近面板）
        const padding = 40;
        const maxX = visibleRightBound - padding;
        const maxY = visibleBottomBound - padding;
        
        // 优先放置在面板左侧附近（x 在 maxX*0.6 到 maxX 之间）
        const minX = maxX * 0.6;
        cardData.x = minX + Math.random() * (maxX - minX);
        cardData.y = padding + Math.random() * maxY;
    }
    
    // 完全重置卡牌样式
    cardEl.style.position = 'absolute';
    cardEl.style.left = cardData.x + 'px';
    cardEl.style.top = cardData.y + 'px';
    cardEl.style.display = 'flex';
    cardEl.style.width = '';  // 移除内联宽度，使用CSS变量
    cardEl.style.height = ''; // 移除内联高度，使用CSS变量
    cardEl.style.transform = ''; // 移除可能的缩放变换
    cardEl.classList.remove('embedded');
    
    // 移除槽位标记，恢复双击事件
    cardEl.dataset.embedded = 'false';
}

/**
 * 设置卡牌拖出功能（通用版）
 * @param {HTMLElement} cardEl - 卡牌元素
 * @param {Object} cardData - 卡牌数据
 * @param {Object} options - 配置选项
 * @param {number} options.slotIndex - 槽位索引
 * @param {Array} options.slotsArray - 槽位数据数组（用于清空槽位）
 * @param {HTMLElement} options.slotElement - 槽位元素（用于重置显示）
 * @param {string} options.placeholderText - 槽位占位符文本（默认：'槽位 N'）
 * @param {string} options.placeholderClass - 槽位占位符类名（默认：'slot-placeholder'）
 * @param {Function} options.onRemove - 移除后的回调函数
 * @param {Function} options.shouldBlock - 是否阻止拖出的条件函数（返回 true 则阻止）
 * @param {string} options.logMessage - 日志消息
 */
export function setupCardDragOut(cardEl, cardData, options = {}) {
    const {
        slotIndex = 0,
        slotsArray = null,
        slotElement = null,
        placeholderText = null,
        placeholderClass = 'slot-placeholder',
        onRemove = null,
        shouldBlock = null,
        onPlaceCard = null,
        logMessage = '卡牌已从槽位取出'
    } = options;
    
    cardEl.dataset.dragSlotIndex = slotIndex;
    if (slotElement && slotElement.parentElement) {
        cardEl.dataset.dragContainerId = slotElement.parentElement.id;
    }
    
    /**
     * 根据卡牌的 dataset 获取当前槽位元素
     */
    function getCurrentSlotEl() {
        const containerId = cardEl.dataset.dragContainerId;
        const dragIdx = parseInt(cardEl.dataset.dragSlotIndex) || 0;
        const container = containerId ? document.getElementById(containerId) : null;
        return container ? container.querySelector(`[data-slot-index="${dragIdx}"]`) : slotElement;
    }
    
    let isDragging = false;
    let isDraggedOut = false;
    let startX, startY;
    let cardOffsetX, cardOffsetY;
    
    cardEl.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        // 不在槽位中则跳过（防止与画布拖拽系统冲突）
        if (cardEl.dataset.embedded !== 'true') return;
        // CSS 级防护：探索面板活跃时禁止拖出
        if (cardEl.closest('#exploration-panel.exploration-active')) return;
        // 检查是否阻止拖出
        if (shouldBlock && shouldBlock()) return;
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        // 计算鼠标相对于卡牌左上角的偏移
        const cardRect = cardEl.getBoundingClientRect();
        cardOffsetX = e.clientX - cardRect.left;
        cardOffsetY = e.clientY - cardRect.top;
        
        // 不要立即移除embedded类，等到真正拖出时再移除
        // 这样可以避免点击时卡牌突然变大
        cardEl.style.cursor = 'grabbing';
        
        e.preventDefault();
        e.stopPropagation();
        
        // 通过统一管理器接管拖拽
        dragEventManager.startDrag(cardData.instanceId, {
            onDrag: moveHandler,
            onDragEnd: upHandler
        });
    });
    
    const moveHandler = (e) => {
        if (!isDragging) return;
        
        const diffX = e.clientX - startX;
        const diffY = e.clientY - startY;
        
        if (!isDraggedOut && (Math.abs(diffX) > 5 || Math.abs(diffY) > 5)) {
            // 第一次拖出超过5像素，初始化拖出状态
            isDraggedOut = true;
            
            // 将卡牌从槽位中移出，设置为绝对定位
            cardEl.style.position = 'absolute';
            cardEl.style.width = '';
            cardEl.style.height = '';
            cardEl.style.transform = '';
            cardEl.style.zIndex = '200001';  // 高于面板的100000，确保拖动时显示在最上层
            cardEl.classList.remove('embedded');
            cardEl.dataset.embedded = 'false';
            
            // 将卡牌添加到board-canvas
            const boardCanvas = document.getElementById('board-canvas');
            if (boardCanvas) {
                boardCanvas.appendChild(cardEl);
                
                // 用 canvas 相对坐标定位，消除视口偏移
                const canvasRect = boardCanvas.getBoundingClientRect();
                const canvasX = e.clientX - canvasRect.left - cardOffsetX;
                const canvasY = e.clientY - canvasRect.top - cardOffsetY;
                cardEl.style.left = canvasX + 'px';
                cardEl.style.top = canvasY + 'px';
                cardData.x = canvasX;
                cardData.y = canvasY;
            }
            
            // 用动态槽位索引清除槽位数据和显示
            const dragIdx = parseInt(cardEl.dataset.dragSlotIndex) || 0;
            if (slotsArray && dragIdx !== undefined) {
                slotsArray[dragIdx] = null;
            }
            
            const currentSlotEl = getCurrentSlotEl();
            if (currentSlotEl) {
                const isDialogue = placeholderClass && placeholderClass.startsWith('dialogue');
                const isExploration = placeholderClass && placeholderClass.startsWith('exploration');
                const placeText = isDialogue ? '将卡牌拖入此处' : (isExploration ? `槽位 ${dragIdx + 1}` : (placeholderText || `线索槽位 ${dragIdx + 1}`));
                currentSlotEl.innerHTML = `<div class="${placeholderClass}">${placeText}</div>`;
                currentSlotEl.classList.remove('drag-over');
            }
            
            // 执行移除回调
            if (onRemove) onRemove();
            
            log(`🔄 [系统] ${logMessage}`, "normal");
        } else if (isDraggedOut) {
            // 已经拖出，继续跟随鼠标移动
            const boardCanvas = document.getElementById('board-canvas');
            if (boardCanvas) {
                const canvasRect = boardCanvas.getBoundingClientRect();
                const canvasX = e.clientX - canvasRect.left - cardOffsetX;
                const canvasY = e.clientY - canvasRect.top - cardOffsetY;
                cardEl.style.left = canvasX + 'px';
                cardEl.style.top = canvasY + 'px';
                cardData.x = canvasX;
                cardData.y = canvasY;
            }
        }
    };
    
    const upHandler = (e) => {
        if (isDragging) {
            isDragging = false;
            isDraggedOut = false;
            
            // 如果已经拖出
            if (cardEl.dataset.embedded === 'false') {
                cardEl.style.cursor = 'grab';
                cardEl.style.zIndex = '';  // 恢复默认层级
                
                // 用动态槽位元素查找目标槽位
                const currentSlotEl = getCurrentSlotEl();
                const targetSlotIndex = findSlotAtPosition(e.clientX, e.clientY, currentSlotEl);
                
                if (targetSlotIndex !== null) {
                    let success;
                    if (onPlaceCard) {
                        success = onPlaceCard(cardData, targetSlotIndex);
                    } else {
                        success = tryPlaceCardInSlot(cardEl, cardData, targetSlotIndex, slotsArray, currentSlotEl, placeholderText, placeholderClass, onRemove, logMessage);
                    }
                    
                    if (success) {
                        return;
                    }
                }
                
                // 没有放入槽位，确保卡牌在可见区域内
                const boardCanvas = document.getElementById('board-canvas');
                if (boardCanvas) {
                    const canvasRect = boardCanvas.getBoundingClientRect();
                    const maxX = canvasRect.width - CARD.WIDTH;
                    const maxY = canvasRect.height - CARD.HEIGHT;
                    
                    cardData.x = Math.max(0, Math.min(cardData.x, maxX));
                    cardData.y = Math.max(0, Math.min(cardData.y, maxY));
                    
                    cardEl.style.left = cardData.x + 'px';
                    cardEl.style.top = cardData.y + 'px';
                }
            } else {
                // 没拖出，保持embedded类不变
                cardEl.style.cursor = 'grab';
            }
        }
    };
}

/**
 * 查找指定位置的槽位索引
 * @param {number} clientX - 鼠标X坐标
 * @param {number} clientY - 鼠标Y坐标
 * @param {HTMLElement} currentSlot - 当前槽位元素（用于获取父容器）
 * @returns {number|null} - 槽位索引，如果没找到返回null
 */
function findSlotAtPosition(clientX, clientY, currentSlot) {
    if (!currentSlot) return null;
    
    const parentContainer = currentSlot.parentElement;
    if (!parentContainer) return null;
    
    const slots = parentContainer.querySelectorAll('[data-slot-index]');
    for (let i = 0; i < slots.length; i++) {
        const slotRect = slots[i].getBoundingClientRect();
        if (clientX >= slotRect.left && clientX <= slotRect.right &&
            clientY >= slotRect.top && clientY <= slotRect.bottom) {
            return parseInt(slots[i].dataset.slotIndex);
        }
    }
    
    return null;
}

/**
 * 尝试将卡牌放入目标槽位
 * @param {HTMLElement} cardEl - 卡牌元素
 * @param {Object} cardData - 卡牌数据
 * @param {number} targetSlotIndex - 目标槽位索引
 * @param {Array} slotsArray - 槽位数组
 * @param {HTMLElement} currentSlot - 当前槽位元素
 * @param {string} placeholderText - 占位符文本
 * @param {string} placeholderClass - 占位符类名
 * @param {Function} onRemove - 移除回调
 * @param {string} logMessage - 日志消息
 * @returns {boolean} - 是否成功放入
 */
function tryPlaceCardInSlot(cardEl, cardData, targetSlotIndex, slotsArray, currentSlot, placeholderText, placeholderClass, onRemove, logMessage) {
    if (!currentSlot || !slotsArray) return false;
    
    const parentContainer = currentSlot.parentElement;
    if (!parentContainer) return false;
    
    const targetSlot = parentContainer.querySelector(`[data-slot-index="${targetSlotIndex}"]`);
    if (!targetSlot) return false;
    
    // 如果目标槽位已有卡牌，先将其移出
    if (slotsArray[targetSlotIndex]) {
        const existingCardData = slotsArray[targetSlotIndex];
        const existingCardEl = document.getElementById(existingCardData.instanceId);
        
        if (existingCardEl) {
            // 将现有卡牌移回桌面
            const boardCanvas = document.getElementById('board-canvas');
            if (boardCanvas) {
                boardCanvas.appendChild(existingCardEl);
                
                // 设置为绝对定位
                existingCardEl.style.position = 'absolute';
                existingCardEl.style.left = existingCardData.x + 'px';
                existingCardEl.style.top = existingCardData.y + 'px';
                existingCardEl.style.width = '';
                existingCardEl.style.height = '';
                existingCardEl.style.transform = '';
                existingCardEl.classList.remove('embedded');
                existingCardEl.dataset.embedded = 'false';
            }
        }
        
        // 清空目标槽位数据
        slotsArray[targetSlotIndex] = null;
    }
    
    // 更新槽位数组
    slotsArray[targetSlotIndex] = cardData;
    
    // 将卡牌嵌入目标槽位
    embedCardInSlot(cardEl, cardData, targetSlot);
    
    // 更新卡牌的拖拽上下文，确保后续拖出使用正确的槽位索引
    cardEl.dataset.dragSlotIndex = targetSlotIndex;
    
    // 重置原槽位显示（仅当来源槽位与目标槽位不同时）
    if (currentSlot !== targetSlot) {
        const idx = parseInt(currentSlot.dataset.slotIndex) || 0;
        const isDialogue = placeholderClass && placeholderClass.startsWith('dialogue');
        const isExploration = placeholderClass && placeholderClass.startsWith('exploration');
        const placeText = isDialogue ? '将卡牌拖入此处' : (isExploration ? `槽位 ${idx + 1}` : `线索槽位 ${idx + 1}`);
        currentSlot.innerHTML = `<div class="${placeholderClass}">${placeText}</div>`;
        currentSlot.classList.remove('drag-over');
    }
    
    // 执行移除回调
    if (onRemove) onRemove();
    
    log(`🔄 [系统] ${logMessage}，已移入槽位 ${targetSlotIndex + 1}`, "normal");
    
    return true;
}

/**
 * 初始化弹窗拖动功能（通用版）
 * @param {HTMLElement} modal - 弹窗元素
 * @param {Function} isBlocked - 是否阻止拖动的检查函数（可选）
 */
export function initModalDrag(modal, isBlocked = null) {
    const modalHeader = modal.querySelector('.modal-header');
    if (!modalHeader) return;
    
    modalHeader.addEventListener('mousedown', (e) => {
        if (isBlocked && isBlocked()) return;
        
        const rect = modal.getBoundingClientRect();
        const dragOffsetX = e.clientX - rect.left;
        const dragOffsetY = e.clientY - rect.top;
        
        modal.style.cursor = 'grabbing';
        e.preventDefault();
        
        dragEventManager.startDrag('modal-' + modal.id, {
            onDrag(e) {
                if (isBlocked && isBlocked()) {
                    dragEventManager.endDrag('modal-' + modal.id);
                    return;
                }
                const boardCanvas = document.getElementById('board-canvas');
                const boardRect = boardCanvas.getBoundingClientRect();
                
                let newX = e.clientX - boardRect.left - dragOffsetX;
                let newY = e.clientY - boardRect.top - dragOffsetY;
                
                newX = Math.max(0, Math.min(newX, boardRect.width - modal.offsetWidth));
                newY = Math.max(0, Math.min(newY, boardRect.height - modal.offsetHeight));
                
                modal.style.left = newX + 'px';
                modal.style.top = newY + 'px';
            },
            onDragEnd() {
                modal.style.cursor = 'move';
            }
        });
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
        modal.classList.toggle('show', show);
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

/**
 * 关闭除当前面板外的所有右侧面板（面板互斥）
 * @param {string} excludeId - 不关闭的面板 ID
 */
export function closeOtherPanels(excludeId) {
    document.querySelectorAll('.right-panel').forEach(panel => {
        if (panel.id !== excludeId && panel.classList.contains('show')) {
            panel.classList.remove('show');
            // 触发自定义事件，让对应模块清理状态
            panel.dispatchEvent(new CustomEvent('panelclosed'));
        }
    });
}

/**
 * 清空槽位卡牌数组，将所有卡牌恢复到桌面
 * @param {Array} slotArray - 槽位数组
 * @param {Object|null} draggedCard - 被拖拽的卡牌数据（可选）
 * @returns {void}
 */
export function clearSlotCards(slotArray, draggedCard = null) {
    slotArray.forEach(cd => { if (cd) restoreCardToBoard(cd, 'board-canvas', true); });
    slotArray.length = 0;
    if (draggedCard) {
        const panelWidth = 420, cardWidth = 115;
        const visibleRightBound = window.innerWidth - panelWidth - cardWidth - 20;
        if (draggedCard.x > visibleRightBound) draggedCard.x = visibleRightBound;
        restoreCardToBoard(draggedCard, 'board-canvas', true);
    }
}

/**
 * 同类型面板切换时触发滑出动画
 * @param {HTMLElement} panel - 面板 DOM 元素
 * @param {Function} onClosed - 动画完成后执行的回调
 * @returns {void}
 */
export function closePanelForReopen(panel, onClosed) {
    if (!panel.classList.contains('show')) {
        onClosed();
        return;
    }
    panel.classList.remove('show');
    panel.dispatchEvent(new CustomEvent('panelclosed'));
    setTimeout(onClosed, 300);
}
