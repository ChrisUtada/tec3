// ⏳ 腐化倒计时系统
import { CARD_TEMPLATES } from '../config/cards.js';

class CorruptionSystem {
    constructor() {
        this.timers = {};
        this.tickId = null;
        this.api = null;
    }

    init(api) {
        this.api = api;
    }

    startTimer(cardId, durationMs) {
        this.stopTimer(cardId);
        this.timers[cardId] = {
            remaining: durationMs,
            duration: durationMs,
            lastTick: Date.now()
        };
        this._ensureTick();
    }

    stopTimer(cardId) {
        const timer = this.timers[cardId];
        if (timer) {
            delete this.timers[cardId];
            this._removeBar(cardId);
        }
        if (Object.keys(this.timers).length === 0 && this.tickId) {
            clearInterval(this.tickId);
            this.tickId = null;
        }
    }

    getRemaining(cardId) {
        return this.timers[cardId]?.remaining ?? null;
    }

    _ensureTick() {
        if (this.tickId) return;
        this.tickId = setInterval(() => this._tick(), 1000);
    }

    updateAllBars() {
        Object.entries(this.timers).forEach(([cardId, timer]) => {
            this._updateBar(cardId, timer);
        });
    }

    _tick() {
        const now = Date.now();
        const toRemove = [];

        Object.entries(this.timers).forEach(([cardId, timer]) => {
            const elapsed = now - timer.lastTick;
            timer.lastTick = now;
            timer.remaining = Math.max(0, timer.remaining - elapsed);

            const card = this.api.findCardData(cardId);
            if (card) {
                this._updateBar(cardId, timer);
                card.corruptionRemaining = timer.remaining;
            }

            if (timer.remaining <= 0) {
                toRemove.push(cardId);
            }
        });

        toRemove.forEach(cardId => {
            this.stopTimer(cardId);
            const card = this.api.findCardData(cardId);
            if (card) {
                const name = CARD_TEMPLATES[card.templateId]?.name || card.templateId;
                this.api.log(`💀 [腐化] 卡牌「${name}」在黑暗中消散...`, "normal");
                // 在消散位置偏移处掉落疲劳卡
                console.log(`[腐化] 尝试掉落疲劳卡, directSpawnCard=${typeof this.api.directSpawnCard}, x=${card.x}, y=${card.y}`);
                if (this.api.directSpawnCard) {
                    const result = this.api.directSpawnCard('DEBUFF_fatigue', card.x + 30, card.y + 30);
                    console.log(`[腐化] directSpawnCard 返回:`, result);
                    if (result) {
                        this.api.log(`💫 [腐化] 疲劳积累 —— 桌面疲劳卡 +1`, "normal");
                    } else {
                        this.api.log(`⚠️ [腐化] 疲劳卡生成失败`, "normal");
                    }
                } else {
                    console.warn(`[腐化] directSpawnCard 不可用`);
                }
                this.api.destroyCard(cardId);
            }
        });

        if (Object.keys(this.timers).length === 0) {
            clearInterval(this.tickId);
            this.tickId = null;
        }
    }

    _updateBar(cardId, timer) {
        const cardEl = document.getElementById(cardId);
        if (!cardEl) return;

        let bar = document.getElementById(`corrupt-${cardId}`);
        if (!bar) {
            bar = document.createElement('div');
            bar.id = `corrupt-${cardId}`;
            bar.className = 'corruption-container';
            bar.innerHTML = `
                <div class="corruption-bar">
                    <div class="corruption-fill"></div>
                </div>
                <div class="corruption-label"></div>
            `;
            cardEl.parentNode.appendChild(bar);
        }

        const pct = (timer.remaining / timer.duration) * 100;
        const seconds = Math.ceil(timer.remaining / 1000);
        const label = `腐化 ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

        bar.querySelector('.corruption-fill').style.width = `${pct}%`;
        bar.querySelector('.corruption-label').textContent = label;

        const left = parseInt(cardEl.style.left) || 0;
        const top = parseInt(cardEl.style.top) || 0;
        bar.style.left = `${left}px`;
        bar.style.top = `${top + 152}px`;

        cardEl.classList.toggle('corruption-critical', seconds <= 30);
    }

    _removeBar(cardId) {
        const bar = document.getElementById(`corrupt-${cardId}`);
        if (bar) bar.remove();
        const cardEl = document.getElementById(cardId);
        if (cardEl) cardEl.classList.remove('corruption-critical');
    }
}

export const corruptionSystem = new CorruptionSystem();
