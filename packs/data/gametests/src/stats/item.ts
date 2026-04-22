// packs/data/gametests/src/stats/item.ts
import { Entity, EquipmentSlot, ItemStack } from '@minecraft/server';
import { WeaponStats } from '../importStats.js';
import { weaponStats } from './loader.js';

const keyMap: Record<string, keyof WeaponStats> = {
    damage: 'damage',
    attack_speed: 'attackSpeed',
    is_weapon: 'isWeapon',
    sweep: 'sweep',
    disable_shield: 'disableShield',
    skip_lore: 'skipLore',
    no_inherit: 'noInherit',
    regular_knockback: 'regularKnockback',
    enchanted_knockback: 'enchantedKnockback',
    regular_vertical_knockback: 'regularVerticalKnockback',
    enchanted_vertical_knockback: 'enchantedVerticalKnockback',
} as any;

export function getItemStats(
    entity: Entity,
    itemStack?: ItemStack,
): { equippableComp: any; item: ItemStack | undefined; stats: WeaponStats | undefined } {
    const equippableComp = entity.getComponent('equippable');
    const item = itemStack ?? equippableComp?.getEquipment(EquipmentSlot.Mainhand);

    const jsStats = weaponStats.find((wep) => wep.id === item?.typeId);

    const jsonParams =
        item?.getComponent('sweepnslash:stats')?.customComponentParameters?.params;

    const jsonStats: Partial<WeaponStats> = {};
    if (jsonParams && typeof jsonParams === 'object') {
        for (const [jsonKey, statKey] of Object.entries(keyMap)) {
            if ((jsonParams as any)[jsonKey] !== undefined) {
                (jsonStats as any)[statKey] = (jsonParams as any)[jsonKey];
            }
        }
    }

    const mergedStats: Partial<WeaponStats> = { ...jsonStats };
    if (jsStats) {
        for (const k in jsStats) {
            if ((jsStats as any)[k] !== undefined) {
                (mergedStats as any)[k] = (jsStats as any)[k];
            }
        }
    }

    const statsToReturn =
        Object.keys(mergedStats).length ? (mergedStats as WeaponStats)
        : jsStats && Object.keys(jsStats).length ? jsStats
        : Object.keys(jsonStats).length ? (jsonStats as WeaponStats)
        : undefined;

    return { equippableComp, item, stats: statsToReturn };
}

export function hasItemFlag(entity: Entity, flag: string): boolean {
    const { item, stats } = getItemStats(entity);
    const customComponentParameters =
        item?.getComponent('sweepnslash:flags')?.customComponentParameters?.params;
    let flags = (customComponentParameters as any)?.flags;
    flags = stats?.flags || flags;
    return Array.isArray(flags) && flags.includes(flag);
}

export function itemHasFlag(item: ItemStack, flag: string): boolean {
    const stats = weaponStats.find((wep) => wep.id === item?.typeId);
    const customComponentParameters =
        item?.getComponent('sweepnslash:flags')?.customComponentParameters?.params;
    let flags = (customComponentParameters as any)?.flags;
    flags = stats?.flags || flags;
    return Array.isArray(flags) && flags.includes(flag);
}
