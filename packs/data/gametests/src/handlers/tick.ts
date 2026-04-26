import { Difficulty, system, world } from '@minecraft/server';
import { tickIndicator } from '../ui/indicator.ts';
import { tickFood } from '../food/index.ts';

export function registerTickHandlers(): void {
    system.runInterval(() => {
        const addonToggle = world.getDynamicProperty('addon_toggle') as boolean;
        const saturationHealing = world.getDynamicProperty('saturationHealing') as boolean;
        const isPeaceful = world.getDifficulty() === Difficulty.Peaceful;
        const currentTick = system.currentTick;

        if (saturationHealing && world.gameRules.naturalRegeneration == true)
            world.gameRules.naturalRegeneration = false;

        for (const player of world.getAllPlayers()) {
            tickIndicator(player, currentTick, addonToggle);
            tickFood(player, currentTick, saturationHealing, isPeaceful);
        }
    });
}
