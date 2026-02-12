// ============================================================
// TOU - Audio System (Procedural Sound Effects)
// ============================================================

class AudioSystem {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.enabled = true;
        this.musicPlaying = false;
        this.volume = 0.3;
        this.musicVolume = 0.15;
        this.musicGain = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.ctx.destination);
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = this.musicVolume;
            this.musicGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            this.enabled = false;
        }
    }

    play(soundName, x, y, listenerX, listenerY) {
        if (!this.enabled || !this.initialized) return;

        // Distance-based volume
        let vol = 1.0;
        if (x !== undefined && listenerX !== undefined) {
            const d = dist(x, y, listenerX, listenerY);
            vol = clamp(1 - d / 800, 0, 1);
            if (vol <= 0) return;
        }

        // Pan based on position
        let pan = 0;
        if (x !== undefined && listenerX !== undefined) {
            pan = clamp((x - listenerX) / 400, -1, 1);
        }

        try {
            this._synthesize(soundName, vol, pan);
        } catch (e) {}
    }

    _synthesize(name, vol, pan) {
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const g = ctx.createGain();
        const panner = ctx.createStereoPanner();
        panner.pan.value = pan;
        g.connect(panner);
        panner.connect(this.masterGain);

        switch (name) {
            case 'laser1': {
                const o = ctx.createOscillator();
                o.type = 'square';
                o.frequency.setValueAtTime(800, now);
                o.frequency.exponentialRampToValueAtTime(200, now + 0.1);
                g.gain.setValueAtTime(vol * 0.15, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                o.connect(g);
                o.start(now);
                o.stop(now + 0.1);
                break;
            }
            case 'laser2': {
                const o = ctx.createOscillator();
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(600, now);
                o.frequency.exponentialRampToValueAtTime(100, now + 0.15);
                g.gain.setValueAtTime(vol * 0.15, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                o.connect(g);
                o.start(now);
                o.stop(now + 0.15);
                break;
            }
            case 'plasma': case 'ion': case 'disruptor': {
                const o = ctx.createOscillator();
                o.type = 'sine';
                o.frequency.setValueAtTime(400, now);
                o.frequency.exponentialRampToValueAtTime(80, now + 0.2);
                g.gain.setValueAtTime(vol * 0.2, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                o.connect(g);
                o.start(now);
                o.stop(now + 0.2);
                break;
            }
            case 'beam': {
                const o = ctx.createOscillator();
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(300 + Math.random() * 50, now);
                g.gain.setValueAtTime(vol * 0.08, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                o.connect(g);
                o.start(now);
                o.stop(now + 0.05);
                break;
            }
            case 'vulcan': case 'autocannon': case 'needle': {
                const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
                const data = buf.getChannelData(0);
                for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
                const src = ctx.createBufferSource();
                src.buffer = buf;
                g.gain.setValueAtTime(vol * 0.12, now);
                src.connect(g);
                src.start(now);
                break;
            }
            case 'shotgun': case 'slug': {
                const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
                const data = buf.getChannelData(0);
                for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.2));
                const src = ctx.createBufferSource();
                src.buffer = buf;
                g.gain.setValueAtTime(vol * 0.2, now);
                src.connect(g);
                src.start(now);
                break;
            }
            case 'railgun': case 'sniper': {
                const o = ctx.createOscillator();
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(1200, now);
                o.frequency.exponentialRampToValueAtTime(50, now + 0.3);
                g.gain.setValueAtTime(vol * 0.2, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                o.connect(g);
                o.start(now);
                o.stop(now + 0.3);
                break;
            }
            case 'rocket': case 'missile': case 'swarm': case 'cruise': case 'napalm': case 'cluster': {
                const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
                const data = buf.getChannelData(0);
                for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5 * Math.exp(-i / (data.length * 0.5));
                const src = ctx.createBufferSource();
                src.buffer = buf;
                const o = ctx.createOscillator();
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(200, now);
                o.frequency.exponentialRampToValueAtTime(80, now + 0.2);
                const og = ctx.createGain();
                og.gain.setValueAtTime(vol * 0.1, now);
                og.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                o.connect(og);
                og.connect(panner);
                o.start(now);
                o.stop(now + 0.2);
                g.gain.setValueAtTime(vol * 0.15, now);
                src.connect(g);
                src.start(now);
                break;
            }
            case 'torpedo': {
                const o = ctx.createOscillator();
                o.type = 'sine';
                o.frequency.setValueAtTime(100, now);
                o.frequency.exponentialRampToValueAtTime(40, now + 0.4);
                g.gain.setValueAtTime(vol * 0.2, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                o.connect(g);
                o.start(now);
                o.stop(now + 0.4);
                break;
            }
            case 'explosion': {
                const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
                const data = buf.getChannelData(0);
                for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.15));
                const src = ctx.createBufferSource();
                src.buffer = buf;
                g.gain.setValueAtTime(vol * 0.25, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                src.connect(g);
                src.start(now);
                break;
            }
            case 'bigexplosion': case 'megabomb': {
                const buf = ctx.createBuffer(1, ctx.sampleRate * 0.7, ctx.sampleRate);
                const data = buf.getChannelData(0);
                for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.2));
                const src = ctx.createBufferSource();
                src.buffer = buf;
                g.gain.setValueAtTime(vol * 0.3, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
                src.connect(g);
                src.start(now);
                break;
            }
            case 'nuke': {
                const buf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
                const data = buf.getChannelData(0);
                for (let i = 0; i < data.length; i++) {
                    const t = i / ctx.sampleRate;
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 2) * (1 + Math.sin(t * 20) * 0.5);
                }
                const src = ctx.createBufferSource();
                src.buffer = buf;
                g.gain.setValueAtTime(vol * 0.4, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
                src.connect(g);
                src.start(now);
                break;
            }
            case 'mine': case 'grenade': case 'bomb': case 'carpet': case 'acid': case 'gravity': {
                const o = ctx.createOscillator();
                o.type = 'triangle';
                o.frequency.setValueAtTime(300, now);
                o.frequency.exponentialRampToValueAtTime(60, now + 0.15);
                g.gain.setValueAtTime(vol * 0.12, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                o.connect(g);
                o.start(now);
                o.stop(now + 0.15);
                break;
            }
            case 'lightning': case 'emp': {
                const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
                const data = buf.getChannelData(0);
                for (let i = 0; i < data.length; i++) {
                    data[i] = (Math.random() * 2 - 1) * (Math.random() < 0.3 ? 1 : 0.1) * Math.exp(-i / (data.length * 0.3));
                }
                const src = ctx.createBufferSource();
                src.buffer = buf;
                g.gain.setValueAtTime(vol * 0.15, now);
                src.connect(g);
                src.start(now);
                break;
            }
            case 'bouncer': case 'ricochet': {
                const o = ctx.createOscillator();
                o.type = 'square';
                o.frequency.setValueAtTime(1500, now);
                o.frequency.exponentialRampToValueAtTime(500, now + 0.05);
                g.gain.setValueAtTime(vol * 0.08, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                o.connect(g);
                o.start(now);
                o.stop(now + 0.05);
                break;
            }
            case 'spiral': case 'flak': case 'cannon': case 'firewall': {
                const o = ctx.createOscillator();
                o.type = 'triangle';
                o.frequency.setValueAtTime(500, now);
                o.frequency.exponentialRampToValueAtTime(150, now + 0.1);
                g.gain.setValueAtTime(vol * 0.12, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                o.connect(g);
                o.start(now);
                o.stop(now + 0.1);
                break;
            }
            case 'shockwave': {
                const o = ctx.createOscillator();
                o.type = 'sine';
                o.frequency.setValueAtTime(150, now);
                o.frequency.exponentialRampToValueAtTime(30, now + 0.5);
                g.gain.setValueAtTime(vol * 0.3, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                o.connect(g);
                o.start(now);
                o.stop(now + 0.5);
                break;
            }
            case 'blackhole': case 'teleport': case 'shield': {
                const o = ctx.createOscillator();
                o.type = 'sine';
                o.frequency.setValueAtTime(200, now);
                o.frequency.linearRampToValueAtTime(800, now + 0.3);
                g.gain.setValueAtTime(vol * 0.15, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                o.connect(g);
                o.start(now);
                o.stop(now + 0.3);
                break;
            }
            case 'pickup': {
                const o = ctx.createOscillator();
                o.type = 'sine';
                o.frequency.setValueAtTime(400, now);
                o.frequency.linearRampToValueAtTime(800, now + 0.1);
                g.gain.setValueAtTime(vol * 0.15, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                o.connect(g);
                o.start(now);
                o.stop(now + 0.15);
                break;
            }
            case 'death': {
                const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
                const data = buf.getChannelData(0);
                for (let i = 0; i < data.length; i++) {
                    const t = i / ctx.sampleRate;
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 3) * 0.8;
                }
                const src = ctx.createBufferSource();
                src.buffer = buf;
                g.gain.setValueAtTime(vol * 0.3, now);
                src.connect(g);
                src.start(now);
                break;
            }
            default: {
                const o = ctx.createOscillator();
                o.type = 'square';
                o.frequency.setValueAtTime(600, now);
                o.frequency.exponentialRampToValueAtTime(100, now + 0.08);
                g.gain.setValueAtTime(vol * 0.1, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                o.connect(g);
                o.start(now);
                o.stop(now + 0.08);
            }
        }
    }

    startMusic() {
        if (!this.enabled || !this.initialized || this.musicPlaying) return;
        this.musicPlaying = true;
        this._playMusicLoop();
    }

    _playMusicLoop() {
        if (!this.musicPlaying || !this.initialized) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const bpm = 140;
        const beatLen = 60 / bpm;
        const barLen = beatLen * 4;

        // Bass sequence
        const bassNotes = [55, 55, 65, 55, 73, 55, 65, 82];
        for (let i = 0; i < 8; i++) {
            const t = now + i * beatLen;
            const o = ctx.createOscillator();
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(bassNotes[i], t);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.08, t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.001, t + beatLen * 0.8);
            o.connect(g);
            g.connect(this.musicGain);
            o.start(t);
            o.stop(t + beatLen);
        }

        // Kick drum
        for (let i = 0; i < 8; i++) {
            const t = now + i * beatLen;
            const o = ctx.createOscillator();
            o.type = 'sine';
            o.frequency.setValueAtTime(150, t);
            o.frequency.exponentialRampToValueAtTime(30, t + 0.1);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.15, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            o.connect(g);
            g.connect(this.musicGain);
            o.start(t);
            o.stop(t + 0.2);
        }

        // Hi-hat
        for (let i = 0; i < 16; i++) {
            const t = now + i * beatLen * 0.5;
            const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let j = 0; j < data.length; j++) data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (data.length * 0.1));
            const src = ctx.createBufferSource();
            src.buffer = buf;
            const g = ctx.createGain();
            g.gain.setValueAtTime(i % 2 === 0 ? 0.04 : 0.02, t);
            src.connect(g);
            g.connect(this.musicGain);
            src.start(t);
        }

        // Schedule next bar
        setTimeout(() => this._playMusicLoop(), barLen * 1000 * 0.9);
    }

    stopMusic() {
        this.musicPlaying = false;
    }
}
