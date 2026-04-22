import { Player, world } from '@minecraft/server';

export function initWorldProperties(): void {
    if (world.getDynamicProperty('addon_toggle') == undefined) {
        world.setDynamicProperty('addon_toggle', true);
    }
    if (world.getDynamicProperty('shieldBreakSpecial') == undefined) {
        world.setDynamicProperty('shieldBreakSpecial', false);
    }
    if (world.getDynamicProperty('saturationHealing') == undefined) {
        world.setDynamicProperty('saturationHealing', true);
    }
}

export function initPlayerProperties(player: Player): void {
    const dpArray = [
        'excludePetFromSweep',
        'tipMessage',
        'enchantedHit',
        'damageIndicator',
        'criticalHit',
        'sweep',
        'bowHitSound',
    ];
    for (const dp of dpArray) {
        if (player.getDynamicProperty(dp) == undefined) {
            player.setDynamicProperty(dp, true);
        }
    }
}
