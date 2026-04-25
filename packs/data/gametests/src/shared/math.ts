export function clampNumber(val: number, min: number, max: number): number {
    return Math.max(Math.min(val, Math.max(min, max)), Math.min(min, max));
}
