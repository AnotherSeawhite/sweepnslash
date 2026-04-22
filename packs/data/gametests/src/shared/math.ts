// packs/data/gametests/src/shared/math.ts
import { clampNumber } from '../minecraft-math.js';

export function debug(message: string) {
    if (message) console.log(`\n§3Sweep §f'N §6Slash §fDebug Info\n${message}`);
}

export function rng(num: number): boolean {
    const math = Math.floor(Math.random() * 100);
    return math < clampNumber(num, 0, 100);
}

export function random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export function sub(
    v1: { x: number; y: number; z: number },
    v2: { x: number; y: number; z: number },
) {
    return { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z };
}

export function dotProduct(
    v1: { x: number; y: number; z: number },
    v2: { x: number; y: number; z: number },
): number {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

export function magnitude(v: { x: number; y: number; z: number }): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function calculateAngle(
    v1: { x: number; y: number; z: number },
    v2: { x: number; y: number; z: number },
): number {
    const dot = dotProduct(v1, v2);
    const mag1 = magnitude(v1);
    const mag2 = magnitude(v2);
    return Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
}
