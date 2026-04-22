// packs/data/gametests/src/food/index.ts
import { GameMode, Player } from '@minecraft/server';
import { clampNumber } from '../minecraft-math.js';
import { getStatus } from '../shared/status.js';
import { getHunger, getSaturation, getExhaustion, setSaturation, setExhaustion } from './accessors.js';

export function tickFood(
    player: Player,
    currentTick: number,
    saturationHealing: boolean,
    isPeaceful: boolean,
): void {
    const status = getStatus(player);
    const health = player.getComponent('health')!;
    const saturationComp = player.getComponent('player.saturation');
    const hunger = getHunger(player);
    const saturation = getSaturation(player);
    const exhaustion = getExhaustion(player);

    // Saturation effect
    const saturationEffect = player.getEffect('saturation');
    if (saturationEffect?.isValid && health.currentValue > 0) {
        setSaturation(
            player,
            clampNumber(
                saturation! + (saturationEffect.amplifier + 1) * 2,
                saturationComp!.effectiveMin,
                saturationComp!.effectiveMax,
            ),
        );
    }

    // Peaceful mode regen
    if (saturationHealing && isPeaceful && currentTick % 20 === 0) {
        setSaturation(
            player,
            clampNumber(saturation! + 1, saturationComp!.effectiveMin, saturationComp!.effectiveMax),
        );
        health.setCurrentValue(
            clampNumber(health.currentValue + 1, health.effectiveMin, health.effectiveMax),
        );
    }

    const canHeal =
        saturationHealing &&
        hunger! >= 18 &&
        health.currentValue > 0 &&
        health.currentValue < health.effectiveMax &&
        player.getGameMode() !== GameMode.Creative;

    if (canHeal) {
        status.foodTickTimer += 1;

        const usingSaturation = saturation! > 0 && hunger! >= 20;
        const foodTick = usingSaturation ? 10 : 80;

        if (status.foodTickTimer >= foodTick) {
            let healAmount: number;
            let exhaustionToAdd: number;

            if (usingSaturation) {
                healAmount = Math.min(1.0, saturation! / 6.0);
                exhaustionToAdd = healAmount * 6.0;
            } else {
                healAmount = 1.0;
                exhaustionToAdd = 6.0;
            }

            setExhaustion(player, (exhaustion ?? 0) + exhaustionToAdd);
            health.setCurrentValue(
                clampNumber(health.currentValue + healAmount, health.effectiveMin, health.effectiveMax),
            );
            status.foodTickTimer = 0;
        }
    } else {
        status.foodTickTimer = 0;
    }
}
