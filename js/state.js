// ⚙️ 核心全局状态管理
export const gameState = {
    hasSanityPollution: false,
    sceneSynced: false,
    isGameOver: false,
    lastTriggeredClueId: null, // 记录促成结局的线索实例ID，以便回溯时定向弹开
    dialogueFlags: {} // 对话分支选项记录
};

export function setDialogueFlag(flag) {
    if (flag) gameState.dialogueFlags[flag] = true;
}

export function getDialogueFlag(flag) {
    return !!gameState.dialogueFlags[flag];
}

export function resetDialogueFlags() {
    gameState.dialogueFlags = {};
}

export function updateState(key, value) {
    if (gameState.hasOwnProperty(key)) {
        gameState[key] = value;
    } else {
        console.warn(`[State Manager] Unknown state key: ${key}`);
    }
}
