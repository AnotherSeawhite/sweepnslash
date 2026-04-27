import { Player } from '@minecraft/server';
import { getSaturation, getExhaustion } from '../food/accessors.ts';

export function getHungerData(player: Player): { sat: number; exh: number } {
    if (!player.getDynamicProperty('hungerOverlay')) return { sat: 0, exh: 0 };
    const sat = Math.round(getSaturation(player) ?? 0);
    const exh = Math.round((getExhaustion(player) ?? 0) * 10);
    return { sat, exh };
}
