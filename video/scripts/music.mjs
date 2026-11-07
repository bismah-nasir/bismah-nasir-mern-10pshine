// Generates the original background track, so the video has no licensing concerns.
// Soft piano-like notes over warm chords, at 88 BPM. Run with: npm run music
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VIDEO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(VIDEO_ROOT, "public", "music", "background.wav");

const RATE = 44100;
const SECONDS = 95;
const BEAT = 60 / 88;
const BAR = BEAT * 4;
const left = new Float32Array(RATE * SECONDS);
const right = new Float32Array(RATE * SECONDS);

const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

const CHORDS = {
    C: { root: 36, notes: [60, 64, 67, 71] },
    G: { root: 43, notes: [59, 62, 67, 69] },
    Am: { root: 45, notes: [60, 64, 67, 69] },
    F: { root: 41, notes: [60, 65, 69, 72] },
};
const PROGRESSION = ["C", "G", "Am", "F", "C", "G", "Am", "F", "Am", "F", "C", "G"];
const ARPEGGIO = [0, 2, 1, 3, 2, 1, 3, 2];

const addSample = (index, l, r) => {
    if (index >= 0 && index < left.length) {
        left[index] += l;
        right[index] += r;
    }
};

// Plucked, piano-like note: a few harmonics that fade at different speeds
const pluck = (time, midi, velocity, pan) => {
    const start = Math.floor(time * RATE);
    const length = Math.floor(1.6 * RATE);
    const f = hz(midi);
    const gainL = velocity * Math.cos(((pan + 1) * Math.PI) / 4);
    const gainR = velocity * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = 0; i < length; i++) {
        const t = i / RATE;
        const attack = Math.min(1, t / 0.006);
        const value =
            attack *
            (Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 2.6) +
                0.32 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t * 5) +
                0.1 * Math.sin(6 * Math.PI * f * t) * Math.exp(-t * 9));
        addSample(start + i, value * gainL, value * gainR);
    }
};

// Warm, slowly swelling chord that sits behind the notes
const pad = (time, duration, midi, velocity) => {
    const start = Math.floor(time * RATE);
    const length = Math.floor((duration + 0.8) * RATE);
    const f = hz(midi);
    for (let i = 0; i < length; i++) {
        const t = i / RATE;
        const envelope =
            Math.min(1, t / 0.8) * Math.min(1, Math.max(0, (duration + 0.8 - t) / 0.8));
        const a = Math.sin(2 * Math.PI * f * 0.998 * t);
        const b = Math.sin(2 * Math.PI * f * 1.002 * t);
        addSample(start + i, a * envelope * velocity, b * envelope * velocity);
    }
};

const bass = (time, midi, velocity) => {
    const start = Math.floor(time * RATE);
    const length = Math.floor(BEAT * 1.8 * RATE);
    const f = hz(midi);
    for (let i = 0; i < length; i++) {
        const t = i / RATE;
        const envelope = Math.min(1, t / 0.015) * Math.exp(-t * 1.5);
        const value =
            envelope * (Math.sin(2 * Math.PI * f * t) + 0.2 * Math.sin(4 * Math.PI * f * t)) * velocity;
        addSample(start + i, value, value);
    }
};

const totalBars = Math.ceil(SECONDS / BAR);
for (let bar = 0; bar < totalBars; bar++) {
    const chord = CHORDS[PROGRESSION[bar % PROGRESSION.length]];
    const time = bar * BAR;
    chord.notes.forEach((note) => pad(time, BAR, note - 12, 0.035));
    // Starts sparse, then the bass joins after the opening
    if (bar >= 2) {
        bass(time, chord.root, 0.2);
        bass(time + BEAT * 2, chord.root, 0.15);
    }
    ARPEGGIO.forEach((step, i) => {
        // Every fourth bar leaves a gap, so the pattern doesn't feel mechanical
        if (bar % 4 === 3 && i >= 6) return;
        const accent = i % 4 === 0 ? 0.17 : 0.11;
        const note = chord.notes[step] + (bar >= 4 && i === 7 ? 12 : 0);
        pluck(time + (i * BEAT) / 2, note, accent, i % 2 === 0 ? -0.3 : 0.3);
    });
}

// Light stereo echo for a sense of space
const delay = Math.floor(BEAT * 0.75 * RATE);
for (let i = delay; i < left.length; i++) {
    const fromLeft = left[i - delay];
    left[i] += right[i - delay] * 0.22;
    right[i] += fromLeft * 0.22;
}

// Remove any DC offset, then set the peak level with headroom
for (const channel of [left, right]) {
    const mean = channel.reduce((sum, value) => sum + value, 0) / channel.length;
    for (let i = 0; i < channel.length; i++) channel[i] -= mean;
}
let peak = 0;
for (let i = 0; i < left.length; i++) {
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
}
const gain = 0.7 / peak;

const data = Buffer.alloc(left.length * 4);
for (let i = 0; i < left.length; i++) {
    data.writeInt16LE(Math.round(left[i] * gain * 32767), i * 4);
    data.writeInt16LE(Math.round(right[i] * gain * 32767), i * 4 + 2);
}
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVEfmt ", 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(RATE, 24);
header.writeUInt32LE(RATE * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(data.length, 40);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, Buffer.concat([header, data]));
console.log(`music written: ${(data.length / 1e6).toFixed(1)} MB, ${SECONDS}s`);
