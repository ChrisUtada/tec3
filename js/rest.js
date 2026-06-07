// 🛌 休息面板系统
// 将调查员 + 疲劳卡放入面板，点击"开始休息"消耗 1 张疲劳卡
import { CARD_TEMPLATES } from './config.js';
import { log } from './ui.js';
import { embedCardInSlot, restoreCardToBoard, setupCardDragOut, closeOtherPanels, clearSlotCards, closePanelForReopen } from './shared.js';
import { playSound } from './sound.js';

let destroyCard = null;

export function initRestModule(destroyFn) {
    destroyCard = destroyFn;
}

let restSlots = [null, null];
let isResting = false;
let restTimeoutId = null;

let restPanel, restTitle, restText, restInvestigatorSlot, restFatigueSlot, restStartBtn, restProgress, restProgressFill;

function initRestElements() {
    if (!restPanel) {
        restPanel = document.getElementById('rest-panel');
        restTitle = document.getElementById('rest-title');
        restText = document.getElementById('rest-text');
        restInvestigatorSlot = document.getElementById('rest-investigator-slot');
        restFatigueSlot = document.getElementById('rest-fatigue-slot');
        restStartBtn = document.getElementById('rest-start-btn');
        restProgress = document.getElementById('rest-progress');
        restProgressFill = document.getElementById('rest-progress-fill');
    }
    if (!restPanel._cleanupAttached) {
        restPanel.addEventListener('panelclosed', () => {
            if (restTimeoutId) {
                clearTimeout(restTimeoutId);
                restTimeoutId = null;
            }
            isResting = false;
            if (restProgress) restProgress.style.display = 'none';
            if (restStartBtn) restStartBtn.disabled = true;
            clearSlotCards(restSlots);
            restSlots = [null, null];
        });
        restPanel._cleanupAttached = true;
    }
}

export function openRestPanel() {
    initRestElements();

    closePanelForReopen(restPanel, () => {
        restSlots = [null, null];
        isResting = false;

        closeOtherPanels('rest-panel');

        restTitle.innerText = '休息处';
        if (restText) restText.innerText = '将初级调查员和疲劳卡拖入下方槽位后，点击开始休息来消耗疲劳。';
        restInvestigatorSlot.innerHTML = '<div class="rest-slot-placeholder">拖入调查员卡</div>';
        restFatigueSlot.innerHTML = '<div class="rest-slot-placeholder">拖入疲劳卡</div>';

        restProgress.style.display = 'none';
        restProgressFill.style.width = '0%';
        restStartBtn.disabled = true;

        restPanel.classList.add('show');
        playSound('panelOpen');
        log(`🛌 [休息] 打开了休息处`, "success");
    });
}

export function placeCardInRestSlot(cardData, slotIndex) {
    initRestElements();
    if (isResting) return false;

    // 每次放入先清除所有槽位的错误状态
    [restInvestigatorSlot, restFatigueSlot].forEach(slot => {
        if (slot) slot.classList.remove('shake-error');
    });

    const template = CARD_TEMPLATES[cardData.templateId];
    if (!template) return false;

    if (slotIndex === 0) {
        if (cardData.templateId !== 'CHAR_investigator') {
            log(`❌ [休息] 只有初级调查员可以放入此槽位`, "normal");
            if (restInvestigatorSlot) {
                void restInvestigatorSlot.offsetWidth;
                restInvestigatorSlot.classList.add('shake-error');
            }
            restoreCardToBoard(cardData, 'board-canvas', true);
            return false;
        }
        if (restSlots[0]) restoreCardToBoard(restSlots[0], 'board-canvas', true);
        restSlots[0] = cardData;
    } else if (slotIndex === 1) {
        if (cardData.templateId !== 'DEBUFF_fatigue') {
            log(`❌ [休息] 只有疲劳卡可以放入此槽位`, "normal");
            if (restFatigueSlot) {
                void restFatigueSlot.offsetWidth;
                restFatigueSlot.classList.add('shake-error');
            }
            restoreCardToBoard(cardData, 'board-canvas', true);
            return false;
        }
        if (restSlots[1]) {
            const old = restSlots[1];
            const oldEl = document.getElementById(old.instanceId);
            if (oldEl) restoreCardToBoard(old, 'board-canvas', true);
        }
        restSlots[1] = cardData;
    }

    const cardEl = document.getElementById(cardData.instanceId);
    if (cardEl) {
        const slotElement = slotIndex === 0 ? restInvestigatorSlot : restFatigueSlot;
        embedCardInSlot(cardEl, cardData, slotElement, 'embedded');
        setupCardDragOut(cardEl, cardData, {
            slotIndex,
            slotsArray: restSlots,
            slotElement,
            placeholderText: slotIndex === 0 ? '拖入调查员卡' : '拖入疲劳卡',
            placeholderClass: 'rest-slot-placeholder',
            shouldBlock: () => isResting,
            onRemove: () => {},
            onPlaceCard: (data, idx) => placeCardInRestSlot(data, idx),
            logMessage: '休息处：卡牌已从槽位取出'
        });
    }

    restStartBtn.disabled = !(restSlots[0] && restSlots[1]);
    return true;
}

export function startRest() {
    initRestElements();
    if (isResting || !restSlots[0] || !restSlots[1]) return;

    const fatigueCard = restSlots[1];
    if (fatigueCard.templateId !== 'DEBUFF_fatigue') return;

    isResting = true;
    restStartBtn.disabled = true;
    if (restText) restText.innerText = '正在休息……调查员正在恢复体力。';

    restProgress.style.display = 'flex';
    restProgressFill.style.width = '0%';
    restProgressFill.style.transition = 'width 5000ms linear';
    setTimeout(() => { restProgressFill.style.width = '100%'; }, 50);

    log(`🛌 [休息] 开始休息，5秒后恢复...`, "success");

    restTimeoutId = setTimeout(() => {
        if (destroyCard) destroyCard(fatigueCard.instanceId);
        const idx = restSlots.indexOf(fatigueCard);
        if (idx !== -1) restSlots[idx] = null;
        restFatigueSlot.innerHTML = '<div class="rest-slot-placeholder">拖入疲劳卡</div>';

        playSound('complete');
        isResting = false;
        restTimeoutId = null;
        restProgress.style.display = 'none';
        restStartBtn.disabled = !(restSlots[0] && restSlots[1]);
        if (restText) restText.innerText = '休息完成，疲劳已恢复。可再次放入卡牌继续休息。';

        log(`✅ [休息] 疲劳已恢复`, "success");
    }, 5000);
}

export function closeRestModal(keepCards = false) {
    initRestElements();
    if (restTimeoutId) {
        clearTimeout(restTimeoutId);
        restTimeoutId = null;
    }
    isResting = false;
    if (restProgress) restProgress.style.display = 'none';
    if (restStartBtn) restStartBtn.disabled = true;
    if (!keepCards) {
        clearSlotCards(restSlots);
    }
    restSlots = [null, null];
    restPanel.classList.remove('show');
}
