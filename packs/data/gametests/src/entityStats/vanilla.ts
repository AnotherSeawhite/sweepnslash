import { EntityStats } from '../importStats.js';

export const vanillaEntities: EntityStats[] = [
    {
        id: 'minecraft:creaking',
        regularKnockbackTakeMultiplier: 0,
        enchantedKnockbackTakeMultiplier: 0.75,
    },
    {
        id: 'minecraft:ender_dragon',
        canTakeCrits: false,
        centerOffset: { x: 0, y: 3, z: 0 },
    },
    {
        id: 'minecraft:shulker_bullet',
        canTakeCrits: false,
        damageItem: false,
    },
];
