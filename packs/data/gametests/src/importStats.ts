// Create a file in 'weaponStats' folder and add it here
// Bottommost entry will have the final stats

import { Entity, ItemStack, MolangVariableMap, Player, System, World } from '@minecraft/server';
import { alylicaDungeons } from './weaponStats/alylica_dungeons';
import { betterOnBedrock } from './weaponStats/better_on_bedrock';
import { exampleArray } from './weaponStats/example_file';
import { copperTools } from './weaponStats/tcc/copper_expansion';
import { flintTools } from './weaponStats/tcc/flint_tools';
import { vanillaBattleAxes } from './weaponStats/tcc/vanilla_battle_axes';
import { vanillaKnives } from './weaponStats/tcc/vanilla_knives';
import { vanillaThrowingKnives } from './weaponStats/tcc/vanilla_throwing_knives';
import { trueWeapons } from './weaponStats/true_wp';
import { vanilla } from './weaponStats/vanilla';
import { vanillaSpears } from './weaponStats/vanilla_spears';

export const importStats: { items: WeaponStats[]; moduleName: string }[] = [
    { items: exampleArray, moduleName: 'example_file' },
    { items: vanilla, moduleName: 'vanilla' },
    { items: betterOnBedrock, moduleName: 'better_on_bedrock' },
    { items: vanillaKnives, moduleName: 'tcc_knives' },
    { items: vanillaThrowingKnives, moduleName: 'tcc_throwing_knives' },
    { items: vanillaBattleAxes, moduleName: 'tcc_battle_axes' },
    { items: flintTools, moduleName: 'tcc_flint_tools' },
    { items: copperTools, moduleName: 'tcc_copper_expansion' },
    { items: vanillaSpears, moduleName: 'vanilla_spears' },
    //{ items: alylicaDungeons, moduleName: 'alylica_dungeons' },
    //{ items: trueWeapons, moduleName: 'true_wp' },
];

/**
 * WeaponStats defines the structure for custom weapon stat objects used in Sweep 'N Slash.
 *
 * Notes:
 * - Weapons do not follow item tags for sweeping or shield breaking; use the properties below.
 * - If both `sweep` and `disableShield` are true, sweep attacks can disable shields.
 * - If `isWeapon` is true, durability is reduced by 1 per use; otherwise, by 2.
 * - If `skipLore` is true, lore text (Attack Speed/Damage) is not added to the item.
 * - `regularKnockback` and `enchantedKnockback` control knockback distances (in blocks).
 *
 * See detailed documentation above for function argument explanations and usage tips.
 */
export type WeaponStats = {
    /** The item identifier (e.g., "minecraft:iron_sword"). */
    id: string;
    /** The attack speed of the weapon (higher = faster). */
    attackSpeed: number;
    /** The base attack damage of the weapon. */
    damage: number;
    /**
     * If true, item is treated as a weapon (durability -1 per use).
     * If false or undefined, durability is reduced by 2 per use.
     */
    isWeapon?: boolean;
    /**
     * If true, weapon can perform sweep attacks.
     * If both `sweep` and `disableShield` are true, sweep disables shields.
     */
    sweep?: boolean;
    /**
     * If true, weapon disables shields on hit (including via sweep if `sweep` is true).
     */
    disableShield?: boolean;
    /**
     * Knockback distance (in blocks) without knockback enchantment.
     */
    regularKnockback?: number;
    /**
     * Knockback distance (in blocks) with knockback enchantment and/or sprint knockback.
     */
    enchantedKnockback?: number;
    /**
     * If true, disables adding lore text (Attack Speed/Damage) to the item.
     */
    skipLore?: boolean;
    /**
     * Optional function to modify or cancel attack before it lands.
     * Use `mc` argument for Minecraft API access (do not import modules directly).
     * Return properties to override or cancel attack behavior.
     */
    noInherit?: boolean;
    /**
     * If true, projectiles shot with this item will not inherit velocity from the shooter.
     */
    beforeEffect?: (args: {
        mc: typeof import('@minecraft/server');
        world: World;
        system: System;
        player: Player;
        target: Entity;
        item: ItemStack;
        dmg: number;
        specialCheck: boolean;
        sweptEntities: Entity[];
        crit: boolean;
        sprintKnockback: boolean;
        cooldown: number; // 0~1, attack charge
        iframes: boolean;
    }) => {
        /** Cancel the attack if true. */
        cancel?: boolean;
        /** Override the weapon's attack damage (before calculation). */
        dmg?: number;
        /** Override crit damage multiplier (default 1.5). */
        critMultiplier?: number;
        /** Force crit attack if true, disable if false. */
        critAttack?: boolean;
        /** Force sweep attack if true, disable if false. */
        sweep?: boolean;
        /** Force sprint knockback if true, disable if false. */
        sprintKnockback?: boolean;
        /** Level of sweeping edge effect (default 1). */
        sweepLevel?: number;
        /** Cancel durability reduction if true. */
        cancelDurability?: boolean;
        /** Override regular attack knockback value, distance in blocks. */
        regularKnockback?: number;
        /** Override enchanted knockback value, distance in blocks. */
        enchantedKnockback?: number;
        /** Override sweep attack location (default: target's location). */
        sweepLocation?: { x: number; y: number; z: number };
        /** Override sweep attack radius (in blocks). */
        sweepRadius?: number;
        /** Custom sweep particle name. */
        sweepParticle?: string;
        /** Custom crit particle name. */
        critParticle?: string;
        /** Custom sweep sound name. */
        sweepSound?: string;
        /** Custom crit sound name. */
        critSound?: string;
        /** Sweep sound pitch. */
        sweepPitch?: number;
        /** Sweep sound volume. */
        sweepVolume?: number;
        /** MolangVariableMap for sweep particle. */
        sweepMap?: MolangVariableMap;
        /** MolangVariableMap for crit particle. */
        critMap?: MolangVariableMap;
        /** Offset for sweep particle. */
        sweepOffset?: { x: number; y: number; z: number };
        /** Offset for crit particle. */
        critOffset?: { x: number; y: number; z: number };
    } | void;
    /**
     * Optional function to run after the attack logic.
     * Receives sweptEntities (entities affected by sweep, excluding target).
     */
    script?: (args: {
        mc: typeof import('@minecraft/server');
        world: World;
        system: System;
        player: Player;
        target: Entity;
        item: ItemStack;
        sweptEntities: Entity[];
        dmg: number;
        hit: boolean;
        shieldBlock: boolean;
        specialCheck: boolean;
        crit: boolean;
        sprintKnockback: boolean;
        inanimate: boolean;
        cooldown: number; // 0~1, attack charge
    }) => void;
};
