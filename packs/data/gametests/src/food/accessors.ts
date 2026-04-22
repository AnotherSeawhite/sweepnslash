// packs/data/gametests/src/food/accessors.ts
import { Player } from '@minecraft/server';

export function getHunger(player: Player): number | undefined {
    return player.getComponent('player.hunger')?.currentValue;
}

export function setHunger(player: Player, value: number): void {
    player.getComponent('player.hunger')?.setCurrentValue(value);
}

export function getSaturation(player: Player): number | undefined {
    return player.getComponent('player.saturation')?.currentValue;
}

export function setSaturation(player: Player, value: number): void {
    player.getComponent('player.saturation')?.setCurrentValue(value);
}

export function getExhaustion(player: Player): number | undefined {
    return player.getComponent('player.exhaustion')?.currentValue;
}

export function setExhaustion(player: Player, value: number): void {
    player.getComponent('player.exhaustion')?.setCurrentValue(value);
}
