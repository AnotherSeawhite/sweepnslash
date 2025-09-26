import { WeaponStats } from '../importStats';

export const vanilla: WeaponStats[] = [
    {
        id: 'minecraft:wooden_sword',
        attackSpeed: 1.6,
        damage: 4,
        isWeapon: true,
        sweep: true,
    },
    {
        id: 'minecraft:golden_sword',
        attackSpeed: 1.6,
        damage: 4,
        isWeapon: true,
        sweep: true,
    },
    {
        id: 'minecraft:stone_sword',
        attackSpeed: 1.6,
        damage: 5,
        isWeapon: true,
        sweep: true,
    },
    {
        id: 'minecraft:copper_sword',
        attackSpeed: 1.6,
        damage: 5,
        isWeapon: true,
        sweep: true,
    },
    {
        id: 'minecraft:iron_sword',
        attackSpeed: 1.6,
        damage: 6,
        isWeapon: true,
        sweep: true,
    },
    {
        id: 'minecraft:diamond_sword',
        attackSpeed: 1.6,
        damage: 7,
        isWeapon: true,
        sweep: true,
    },
    {
        id: 'minecraft:netherite_sword',
        attackSpeed: 1.6,
        damage: 8,
        isWeapon: true,
        sweep: true,
    },
    {
        id: 'minecraft:trident',
        attackSpeed: 1.1,
        damage: 9,
        isWeapon: true,
    },
    {
        id: 'minecraft:mace',
        attackSpeed: 0.6,
        damage: 6,
        isWeapon: true,
    },
    {
        id: "minecraft:crossbow",
        skipLore: true,
        noInherit: true,
        beforeEffect: () => {
            return {
                cancelDurability: true
            }
        }
    },
    {
        id: 'minecraft:wooden_shovel',
        attackSpeed: 1,
        damage: 2.5,
    },
    {
        id: 'minecraft:golden_shovel',
        attackSpeed: 1,
        damage: 2.5,
    },
    {
        id: 'minecraft:stone_shovel',
        attackSpeed: 1,
        damage: 3.5,
    },
    {
        id: 'minecraft:copper_shovel',
        attackSpeed: 1,
        damage: 3.5,
    },
    {
        id: 'minecraft:iron_shovel',
        attackSpeed: 1,
        damage: 4.5,
    },
    {
        id: 'minecraft:diamond_shovel',
        attackSpeed: 1,
        damage: 5.5,
    },
    {
        id: 'minecraft:netherite_shovel',
        attackSpeed: 1,
        damage: 6.5,
    },
    {
        id: 'minecraft:wooden_pickaxe',
        attackSpeed: 1.2,
        damage: 2,
    },
    {
        id: 'minecraft:golden_pickaxe',
        attackSpeed: 1.2,
        damage: 2,
    },
    {
        id: 'minecraft:stone_pickaxe',
        attackSpeed: 1.2,
        damage: 3,
    },
    {
        id: 'minecraft:copper_pickaxe',
        attackSpeed: 1.2,
        damage: 3,
    },
    {
        id: 'minecraft:iron_pickaxe',
        attackSpeed: 1.2,
        damage: 4,
    },
    {
        id: 'minecraft:diamond_pickaxe',
        attackSpeed: 1.2,
        damage: 5,
    },
    {
        id: 'minecraft:netherite_pickaxe',
        attackSpeed: 1.2,
        damage: 6,
    },
    {
        id: 'minecraft:wooden_axe',
        attackSpeed: 0.8,
        damage: 7,
        disableShield: true,
    },
    {
        id: 'minecraft:golden_axe',
        attackSpeed: 1,
        damage: 7,
        disableShield: true,
    },
    {
        id: 'minecraft:stone_axe',
        attackSpeed: 0.8,
        damage: 9,
        disableShield: true,
    },
    {
        id: 'minecraft:copper_axe',
        attackSpeed: 0.8,
        damage: 9,
        disableShield: true,
    },
    {
        id: 'minecraft:iron_axe',
        attackSpeed: 0.9,
        damage: 9,
        disableShield: true,
    },
    {
        id: 'minecraft:diamond_axe',
        attackSpeed: 1,
        damage: 9,
        disableShield: true,
    },
    {
        id: 'minecraft:netherite_axe',
        attackSpeed: 1,
        damage: 10,
        disableShield: true,
    },
    {
        id: 'minecraft:wooden_hoe',
        attackSpeed: 1,
        damage: 1,
    },
    {
        id: 'minecraft:golden_hoe',
        attackSpeed: 1,
        damage: 1,
    },
    {
        id: 'minecraft:stone_hoe',
        attackSpeed: 2,
        damage: 1,
    },
    {
        id: 'minecraft:copper_hoe',
        attackSpeed: 2,
        damage: 1,
    },
    {
        id: 'minecraft:iron_hoe',
        attackSpeed: 3,
        damage: 1,
    },
    {
        id: 'minecraft:diamond_hoe',
        attackSpeed: 4,
        damage: 1,
    },
    {
        id: 'minecraft:netherite_hoe',
        attackSpeed: 4,
        damage: 1,
    },
];
