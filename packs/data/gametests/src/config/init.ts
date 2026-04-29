import { DimensionTypes, Player, WeatherType, world } from '@minecraft/server';
import { OverlayMode } from '../ui/overlay_mode';

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
    for (const dimensionType of DimensionTypes.getAll()) {
        const key = `sns:weather:${dimensionType.typeId}`;
        if (world.getDynamicProperty(key) === undefined) {
            world.setDynamicProperty(key, WeatherType.Clear);
        }
    }
}

export function initPlayerProperties(player: Player): void {
    // Bool defaults (true)
    const dpArray = [
        'excludePetFromSweep',
        'tipMessage',
        'enchantedHit',
        'damageIndicator',
        'criticalHit',
        'sweep',
        'bowHitSound',
        'hungerOverlay',
        'foodPreview',
        'projectileWarnings',
    ];
    for (const dp of dpArray) {
        if (player.getDynamicProperty(dp) == undefined) {
            player.setDynamicProperty(dp, true);
        }
    }

    // Number defaults
    if (player.getDynamicProperty('cooldownStyle') == undefined) {
        player.setDynamicProperty('cooldownStyle', 0);
    }
    if (player.getDynamicProperty('foodPreviewMaxAlpha') == undefined) {
        player.setDynamicProperty('foodPreviewMaxAlpha', 1.0);
    }
    if (player.getDynamicProperty('equipWarnThreshold') == undefined) {
        player.setDynamicProperty('equipWarnThreshold', 10);
    }
    if (player.getDynamicProperty('ammoWarnThreshold') == undefined) {
        player.setDynamicProperty('ammoWarnThreshold', 16);
    }

    // OverlayMode string defaults
    if (player.getDynamicProperty('armorMode') == undefined) {
        player.setDynamicProperty('armorMode', OverlayMode.Auto);
    }
    if (player.getDynamicProperty('offhandMode') == undefined) {
        player.setDynamicProperty('offhandMode', OverlayMode.Always);
    }
    if (player.getDynamicProperty('arrowMode') == undefined) {
        player.setDynamicProperty('arrowMode', OverlayMode.Auto);
    }
}
