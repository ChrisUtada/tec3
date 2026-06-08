// 🎯 事件绑定模块 - 统一管理所有 UI 事件
// 替代 HTML onclick 和 window.xxx 全局函数

import { closeDialogueModal, nextDialogue, confirmDialogueCard, endDialogue } from './dialogue.js';
import { closeReasoningModal, executeReasoning } from './reasoning.js';
import { closeExplorationModal, startExploration } from './exploration.js';
import { startRest, closeRestModal } from './rest.js';
import { toggleEndingPanel, closeTrueNameModal } from './ui.js';
import { syncModalAssets, resumeExploration, tidyCardsByScene } from './engine.js';
import { initModalDrag } from './shared.js';

/**
 * 初始化所有 UI 事件绑定
 * 在 DOM 加载完成后调用
 */
export function initUIEvents() {
    // === 场景弹窗 ===
    const sceneModalClose = document.getElementById('scene-modal-close');
    if (sceneModalClose) {
        sceneModalClose.addEventListener('click', () => {
            document.getElementById('scene-modal').style.display = 'none';
        });
    }
    
    const modalActionBtn = document.getElementById('modal-action-btn');
    if (modalActionBtn) {
        modalActionBtn.addEventListener('click', syncModalAssets);
    }
    
    // === 结局报告面板 ===
    const endingPanelHeader = document.getElementById('ending-panel-header');
    if (endingPanelHeader) {
        endingPanelHeader.addEventListener('click', toggleEndingPanel);
    }
    
    const endingResumeBtn = document.getElementById('ending-resume-btn');
    if (endingResumeBtn) {
        endingResumeBtn.addEventListener('click', resumeExploration);
    }
    
    const endingResetBtn = document.getElementById('ending-reset-btn');
    if (endingResetBtn) {
        endingResetBtn.addEventListener('click', () => window.location.reload());
    }
    
    // === 对话弹窗 ===
    const dialogueCloseBtn = document.getElementById('dialogue-close-btn');
    if (dialogueCloseBtn) {
        dialogueCloseBtn.addEventListener('click', closeDialogueModal);
    }
    
    const dialogueNextBtn = document.getElementById('dialogue-next-btn');
    if (dialogueNextBtn) {
        dialogueNextBtn.addEventListener('click', nextDialogue);
    }
    
    const dialogueEndBtn = document.getElementById('dialogue-end-btn');
    if (dialogueEndBtn) {
        dialogueEndBtn.addEventListener('click', endDialogue);
    }

    const dialogueConfirmBtn = document.getElementById('dialogue-confirm-btn');
    if (dialogueConfirmBtn) {
        dialogueConfirmBtn.addEventListener('click', confirmDialogueCard);
    }
    
    // === 探索弹窗 ===
    
    const explorationStartBtn = document.getElementById('exploration-start-btn');
    if (explorationStartBtn) {
        explorationStartBtn.addEventListener('click', startExploration);
    }
    
    const explorationCloseBtn = document.getElementById('exploration-close-btn');
    if (explorationCloseBtn) {
        explorationCloseBtn.addEventListener('click', closeExplorationModal);
    }
    
    // === 归因推演弹窗 ===

    const reasoningExecuteBtn = document.getElementById('reasoning-execute-btn');
    if (reasoningExecuteBtn) {
        reasoningExecuteBtn.addEventListener('click', executeReasoning);
    }
    
    const reasoningCloseBtn = document.getElementById('reasoning-close-btn');
    if (reasoningCloseBtn) {
        reasoningCloseBtn.addEventListener('click', closeReasoningModal);
    }
    
    // === 整理按钮 ===
    const tidyBtn = document.getElementById('tidy-btn');
    if (tidyBtn) {
        tidyBtn.addEventListener('click', tidyCardsByScene);
    }
    
    // === 真名揭示弹窗 ===
    const trueNameModal = document.getElementById('true-name-modal');
    if (trueNameModal) {
        // 添加拖动功能
        initModalDrag(trueNameModal);
        
        // 添加关闭按钮事件
        const trueNameModalClose = document.getElementById('true-name-modal-close');
        if (trueNameModalClose) {
            trueNameModalClose.addEventListener('click', closeTrueNameModal);
        }
        
        const trueNameCloseBtn = document.getElementById('true-name-close-btn');
        if (trueNameCloseBtn) {
            trueNameCloseBtn.addEventListener('click', closeTrueNameModal);
        }
    }

    // === 休息面板 ===
    const restStartBtn = document.getElementById('rest-start-btn');
    if (restStartBtn) {
        restStartBtn.addEventListener('click', startRest);
    }

    const restCloseBtn = document.getElementById('rest-close-btn');
    if (restCloseBtn) {
        restCloseBtn.addEventListener('click', () => closeRestModal());
    }

}