let ctx = null;

function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

function playClick(volume = 0.12) {
    try {
        const c = getCtx();
        // 短促噪声 — 模拟按键物理撞击
        const bufSize = Math.floor(c.sampleRate * 0.015);
        const buf = c.createBuffer(1, bufSize, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            const t = 1 - i / bufSize;
            data[i] = (Math.random() * 2 - 1) * t * t * t;
        }
        const noise = c.createBufferSource();
        noise.buffer = buf;
        const ng = c.createGain();
        ng.gain.setValueAtTime(volume * 1.2, c.currentTime);
        ng.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.012);
        noise.connect(ng);
        ng.connect(c.destination);
        noise.start(c.currentTime);

        // 高频清脆 ping
        const osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(4000, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.008);
        const og = c.createGain();
        og.gain.setValueAtTime(volume, c.currentTime);
        og.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.015);
        osc.connect(og);
        og.connect(c.destination);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 0.02);
    } catch (e) {}
}

function playTone(freq, duration, type = 'sine', volume = 0.15) {
    try {
        const c = getCtx();
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + duration);
    } catch (e) {}
}

function playNoise(duration, volume = 0.08) {
    try {
        const c = getCtx();
        const bufferSize = Math.floor(c.sampleRate * duration);
        const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        const src = c.createBufferSource();
        src.buffer = buffer;
        const gain = c.createGain();
        gain.gain.setValueAtTime(volume, c.currentTime);
        src.connect(gain);
        gain.connect(c.destination);
        src.start(c.currentTime);
    } catch (e) {}
}

export function initSoundManager() {}

export function playSound(name) {
    switch (name) {
        case 'click':
            playClick(0.12);
            break;
        case 'slot':
            playClick(0.08);
            break;
        case 'drop':
            playClick(0.1);
            break;
        case 'panelOpen':
            playTone(600, 0.08, 'sine', 0.1);
            setTimeout(() => playTone(900, 0.1, 'sine', 0.1), 80);
            break;
        case 'error':
            playTone(200, 0.25, 'sawtooth', 0.06);
            break;
        case 'complete':
            playTone(800, 0.1, 'sine', 0.12);
            setTimeout(() => playTone(1000, 0.1, 'sine', 0.12), 100);
            setTimeout(() => playTone(1200, 0.15, 'sine', 0.12), 200);
            break;
    }
}
