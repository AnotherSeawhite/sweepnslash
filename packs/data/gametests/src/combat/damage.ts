// packs/data/gametests/src/combat/damage.ts
import { Entity, ItemStack, Player } from '@minecraft/server';
import { getStatus } from '../shared/status.js';
import { getEntityStats } from '../stats/entity.js';
import { itemHasFlag } from '../stats/item.js';
// circular with checks.ts — fine in ESM, all cross-boundary references are inside function bodies
import { effect, criticalHit, inanimate, enchantLevel } from './checks.js';

export const biomeArray = [
    'minecraft:frozen_ocean',
    'minecraft:deep_frozen_ocean',
    'minecraft:frozen_river',
    'minecraft:cold_beach',
    'minecraft:cold_taiga',
    'minecraft:cold_taiga_hills',
    'minecraft:cold_taiga_mutated',
    'minecraft:savanna',
    'minecraft:savanna_plateau',
    'minecraft:savanna_mutated',
    'minecraft:savanna_plateau_mutated',
    'minecraft:desert',
    'minecraft:desert_hills',
    'minecraft:desert_mutated',
    'minecraft:ice_plains',
    'minecraft:ice_mountains',
    'minecraft:ice_plains_spikes',
    'minecraft:mesa',
    'minecraft:mesa_plateau',
    'minecraft:mesa_plateau_mutated',
    'minecraft:mesa_plateau_stone_mutated',
    'minecraft:mesa_bryce',
    'minecraft:grove',
    'minecraft:snowy_slopes',
    'minecraft:jagged_peaks',
    'minecraft:frozen_peaks',
];

export function getCooldownTime(
    player: Player,
    baseAttackSpeed = 4,
): { ticks: number; baseSpeed: number } {
    const haste = effect(player, 'haste');
    const miningFatigue = effect(player, 'mining_fatigue');
    const hasteMultiplier = 1 + haste * 0.1;
    const miningFatigueMultiplier = 1 - miningFatigue * 0.1;
    const adjustedSpeed = Math.max(
        baseAttackSpeed * hasteMultiplier * miningFatigueMultiplier,
        0.000005,
    );
    const ticks = 20 / adjustedSpeed;
    const baseSpeed = 20 / baseAttackSpeed;
    return { ticks, baseSpeed };
}

export function calculateDamage(
    player: Player,
    target: Entity,
    item: ItemStack | undefined,
    stats: any,
    currentTick: number,
    timeSinceLastAttack: number,
    baseDamage: number,
    attackSpeed: number,
    {
        damageTest = false,
        critAttack,
        critMul,
        cancel,
        attackSpeedTicks,
    }: {
        damageTest?: boolean;
        critAttack?: boolean;
        critMul?: number;
        cancel?: boolean;
        attackSpeedTicks?: number;
    } = {},
): { damage: number; rawDamage: number; enchantedHit: boolean } {
    let T = getCooldownTime(player, attackSpeed).ticks;
    if (damageTest && attackSpeedTicks) T = attackSpeedTicks;
    const t = Math.min(timeSinceLastAttack, T);
    const canTakeCrits = getEntityStats(target)?.canTakeCrits ?? true;
    const crit =
        criticalHit(currentTick, player, target, stats, { forced: critAttack }) && canTakeCrits
            ? (critMul ?? 1.5)
            : 1;

    const isCustomCooldown = itemHasFlag(item as ItemStack, 'custom_cooldown');
    let multiplier = isCustomCooldown ? 1 : 0.2 + Math.pow((t + 0.5) / T, 2) * 0.8;
    multiplier = Math.max(0.2, Math.min(1, multiplier));

    const familyArray = ['undead', 'arthropod'];
    const enchantArray = ['smite', 'bane_of_arthropods'];
    const targetFamily = target.getComponent('type_family');

    let enchantBonus = 0;
    let enchantDamage = 0;
    let enchantedHit = false;

    familyArray.forEach((family, index) => {
        if (targetFamily?.hasTypeFamily(family)) {
            const level = enchantLevel(item, enchantArray[index]);
            if (level > 0) enchantBonus += level * 2.5;
        }
    });

    let sharpnessLevel = enchantLevel(item, 'sharpness');
    let impalingLevel = enchantLevel(item, 'impaling');
    const strengthModifier = effect(player, 'strength') * 3;
    const weaknessModifier = effect(player, 'weakness') * 4;

    if (sharpnessLevel > 0) {
        if (sharpnessLevel !== 1) sharpnessLevel = 0.5 * sharpnessLevel + 0.5;
        enchantBonus += sharpnessLevel;
    }

    const isInRain =
        target.dimension.getWeather() !== 'Clear' &&
        !biomeArray.includes(target.dimension.getBiome(target.location)?.id ?? '') &&
        target.dimension
            .getBlockAbove(target.location, { includePassableBlocks: false })
            ?.getComponent('precipitation_interactions')
            ?.obstructsRain() === (false || undefined);

    if (impalingLevel > 0 && (target.isInWater || isInRain)) {
        impalingLevel = impalingLevel * 2.5;
        enchantBonus += impalingLevel;
    }

    if (cancel) return { damage: 0, rawDamage: 0, enchantedHit: false };

    if (
        enchantBonus > 0 &&
        !inanimate(target, {
            excludeTypes: [
                'minecraft:armor_stand', 'minecraft:boat', 'minecraft:chest_boat',
                'minecraft:minecart', 'minecraft:command_block_minecart',
                'minecraft:hopper_minecart', 'minecraft:tnt_minecart',
            ],
        })
    ) {
        if (!damageTest) enchantedHit = true;
    }

    if (enchantBonus > 0) enchantDamage = enchantBonus * Math.min((t + 0.5) / T, 1);

    const damage =
        Math.max(0, (baseDamage + (strengthModifier - weaknessModifier)) * crit * multiplier) +
        enchantDamage;
    const rawDamage = baseDamage * crit;

    return { damage, rawDamage, enchantedHit };
}

export function finalDamageCalculation(
    currentTick: number,
    player: Player,
    target: Entity,
    item: ItemStack | undefined,
    stats: any,
    {
        damage,
        critAttack,
        critMul,
        cancel,
    }: { damage?: number; critAttack?: boolean; critMul?: number; cancel?: boolean },
): { final: number; raw: number; enchantedHit: boolean } {
    const status = getStatus(player);
    const attackSpeed = stats?.attackSpeed || 4;
    const baseDamage = damage ?? (stats?.damage || 1);
    const timeSinceLastAttack = currentTick - status.lastAttackTime;

    const result = calculateDamage(
        player, target, item, stats, currentTick, timeSinceLastAttack,
        baseDamage, attackSpeed, { critAttack, critMul, cancel },
    );

    return {
        final: Math.max(0, result.damage),
        raw: Math.max(0, result.rawDamage),
        enchantedHit: result.enchantedHit,
    };
}
