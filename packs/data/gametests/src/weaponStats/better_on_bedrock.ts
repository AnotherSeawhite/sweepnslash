// https://www.curseforge.com/minecraft-bedrock/addons/better-on-bedrock

import { MolangVariableMap, TicksPerSecond } from '@minecraft/server';
import { WeaponStats } from '../importStats';

export const betterOnBedrock: WeaponStats[] = [
    {
        id: 'better_on_bedrock:amethyst_sword',
        attackSpeed: 1.6,
        damage: 5,
        isWeapon: true,
        sweep: true,
    },
    {
        id: 'better_on_bedrock:copper_sword',
        attackSpeed: 1.6,
        damage: 6,
        isWeapon: true,
        sweep: true,
    },
    {
        id: 'better_on_bedrock:bane_spike',
        attackSpeed: 1.6,
        damage: 10,
        isWeapon: true,
        sweep: true,
        beforeEffect: () => {
            function random(min: number, max: number) {
                return Math.random() * (max - min) + min;
            }
            const rand = random(0.5, 1);
            const rgb = {
                red: (236 * rand) / 255,
                green: (255 * rand) / 255,
                blue: (195 * rand) / 255,
            };
            let map = new MolangVariableMap();
            map.setFloat('variable.size', 1.0);
            map.setColorRGB('variable.color', rgb);

            return {
                sweepMap: map,
            };
        },
        script: ({ world, sweptEntities }) => {
            const pvp = world.gameRules.pvp;
            sweptEntities.forEach((e) => {
                if (e instanceof Player && !pvp) return;
                try {
                    e.addEffect('poison', TicksPerSecond * 5);
                } catch (e) {
                    console.warn(e);
                }
            });
        },
    },
    {
        id: 'better_on_bedrock:blade_of_the_nether',
        attackSpeed: 1.6,
        damage: 11,
        isWeapon: true,
        sweep: true,
        beforeEffect: () => {
            function random(min: number, max: number) {
                return Math.random() * (max - min) + min;
            }
            const rand = random(0.8, 1);
            const rgb = {
                red: (255 * rand) / 255,
                green: (134 * rand) / 255,
                blue: (51 * rand) / 255,
            };
            let map = new MolangVariableMap();
            map.setFloat('variable.size', 1.0);
            map.setColorRGB('variable.color', rgb);

            return {
                sweepMap: map,
            };
        },
        script: ({ world, sweptEntities }) => {
            const pvp = world.gameRules.pvp;
            sweptEntities.forEach((e) => {
                if (e instanceof Player && !pvp) return;
                try {
                    const fireImmune = e?.getComponent('fire_immune')?.isValid;
                    if (!fireImmune) e.setOnFire(6, true);
                } catch (e) {
                    console.warn(e);
                }
            });
        },
    },
    {
        id: 'better_on_bedrock:enderite_sword',
        attackSpeed: 1.6,
        damage: 11,
        isWeapon: true,
        sweep: true,
    },
    {
        id: 'better_on_bedrock:stardust_sword',
        attackSpeed: 1.6,
        damage: 9,
        isWeapon: true,
        sweep: true,
    },
    {
        id: 'better_on_bedrock:amethyst_axe',
        attackSpeed: 0.9,
        damage: 9,
        disableShield: true,
    },
    {
        id: 'better_on_bedrock:stone_axe',
        attackSpeed: 0.8,
        damage: 9,
        disableShield: true,
    },
    {
        id: 'better_on_bedrock:copper_axe',
        attackSpeed: 0.9,
        damage: 9,
        disableShield: true,
    },
    {
        id: 'better_on_bedrock:iron_axe',
        attackSpeed: 0.9,
        damage: 9,
        disableShield: true,
    },
    {
        id: 'better_on_bedrock:diamond_axe',
        attackSpeed: 1,
        damage: 9,
        disableShield: true,
    },
    {
        id: 'better_on_bedrock:netherite_axe',
        attackSpeed: 1,
        damage: 10,
        disableShield: true,
    },
    {
        id: 'better_on_bedrock:stardust_axe',
        attackSpeed: 1,
        damage: 12,
        disableShield: true,
    },
    {
        id: 'better_on_bedrock:enderite_axe',
        attackSpeed: 1,
        damage: 14,
        disableShield: true,
    },
    {
        id: 'better_on_bedrock:amethyst_pickaxe',
        attackSpeed: 1.2,
        damage: 3,
    },
    {
        id: 'better_on_bedrock:copper_pickaxe',
        attackSpeed: 1.2,
        damage: 4,
    },
    {
        id: 'better_on_bedrock:stone_pickaxe',
        attackSpeed: 1.2,
        damage: 3,
    },
    {
        id: 'better_on_bedrock:iron_pickaxe',
        attackSpeed: 1.2,
        damage: 4,
    },
    {
        id: 'better_on_bedrock:diamond_pickaxe',
        attackSpeed: 1.2,
        damage: 5,
    },
    {
        id: 'better_on_bedrock:netherite_pickaxe',
        attackSpeed: 1.2,
        damage: 6,
    },
    {
        id: 'better_on_bedrock:stardust_pickaxe',
        attackSpeed: 1.2,
        damage: 7,
    },
    {
        id: 'better_on_bedrock:enderite_pickaxe',
        attackSpeed: 1.2,
        damage: 9,
    },
    {
        id: 'better_on_bedrock:copper_shovel',
        attackSpeed: 1,
        damage: 4.5,
    },
    {
        id: 'better_on_bedrock:stardust_shovel',
        attackSpeed: 1,
        damage: 7.5,
    },
    {
        id: 'better_on_bedrock:stardust_hoe',
        attackSpeed: 4,
        damage: 1,
    },
    {
        id: 'better_on_bedrock:wooden_spear',
        attackSpeed: 1.2,
        damage: 5,
        isWeapon: true,
    },
    {
        id: 'better_on_bedrock:golden_spear',
        attackSpeed: 1.2,
        damage: 5,
        isWeapon: true,
    },
    {
        id: 'better_on_bedrock:stone_spear',
        attackSpeed: 1.2,
        damage: 6,
        isWeapon: true,
    },
    {
        id: 'better_on_bedrock:iron_spear',
        attackSpeed: 1.2,
        damage: 7,
        isWeapon: true,
    },
    {
        id: 'better_on_bedrock:diamond_spear',
        attackSpeed: 1.2,
        damage: 8,
        isWeapon: true,
    },
    {
        id: 'better_on_bedrock:stardust_spear',
        attackSpeed: 1.2,
        damage: 9,
        isWeapon: true,
    },
    {
        id: 'better_on_bedrock:dagger',
        attackSpeed: 1.8,
        damage: 4,
        isWeapon: true,
    },
];
