import { WeaponStats } from '../importStats';

export const vanilla: WeaponStats[] = [
    {
        id: 'minecraft:wooden_sword',
        attackSpeed: 1.6,
        damage: 4,
        flags: ['is_weapon', 'sweep'],
    },
    {
        id: 'minecraft:golden_sword',
        attackSpeed: 1.6,
        damage: 4,
        flags: ['is_weapon', 'sweep'],
    },
    {
        id: 'minecraft:stone_sword',
        attackSpeed: 1.6,
        damage: 5,
        flags: ['is_weapon', 'sweep'],
    },
    {
        id: 'minecraft:copper_sword',
        attackSpeed: 1.6,
        damage: 5,
        flags: ['is_weapon', 'sweep'],
    },
    {
        id: 'minecraft:iron_sword',
        attackSpeed: 1.6,
        damage: 6,
        flags: ['is_weapon', 'sweep'],
    },
    {
        id: 'minecraft:diamond_sword',
        attackSpeed: 1.6,
        damage: 7,
        flags: ['is_weapon', 'sweep'],
    },
    {
        id: 'minecraft:netherite_sword',
        attackSpeed: 1.6,
        damage: 8,
        flags: ['is_weapon', 'sweep'],
    },
    {
        id: 'minecraft:wooden_spear',
        damage: 1,
        attackSpeed: 1.54,
        reach: 4.5,
        flags: ['kinetic_weapon', 'custom_cooldown', 'is_weapon'],
        beforeEffect: () => {
            return {
                strongHitSound: '',
                critAttack: false,
                sprintKnockback: false,
            };
        },
    },
    {
        id: 'minecraft:golden_spear',
        damage: 1,
        attackSpeed: 1.05,
        reach: 4.5,
        flags: ['kinetic_weapon', 'custom_cooldown', 'is_weapon'],
        beforeEffect: () => {
            return {
                strongHitSound: '',
                critAttack: false,
                sprintKnockback: false,
            };
        },
    },
    {
        id: 'minecraft:stone_spear',
        damage: 2,
        attackSpeed: 1.33,
        reach: 4.5,
        flags: ['kinetic_weapon', 'custom_cooldown', 'is_weapon'],
        beforeEffect: () => {
            return {
                strongHitSound: '',
                critAttack: false,
                sprintKnockback: false,
            };
        },
    },
    {
        id: 'minecraft:copper_spear',
        damage: 2,
        attackSpeed: 1.18,
        reach: 4.5,
        flags: ['kinetic_weapon', 'custom_cooldown', 'is_weapon'],
        beforeEffect: () => {
            return {
                strongHitSound: '',
                critAttack: false,
                sprintKnockback: false,
            };
        },
    },
    {
        id: 'minecraft:iron_spear',
        damage: 3,
        attackSpeed: 1.05,
        reach: 4.5,
        flags: ['kinetic_weapon', 'custom_cooldown', 'is_weapon'],
        beforeEffect: () => {
            return {
                strongHitSound: '',
                critAttack: false,
                sprintKnockback: false,
            };
        },
    },
    {
        id: 'minecraft:diamond_spear',
        damage: 4,
        attackSpeed: 0.95,
        reach: 4.5,
        flags: ['kinetic_weapon', 'custom_cooldown', 'is_weapon'],
        beforeEffect: () => {
            return {
                strongHitSound: '',
                critAttack: false,
                sprintKnockback: false,
            };
        },
    },
    {
        id: 'minecraft:netherite_spear',
        damage: 5,
        attackSpeed: 0.87,
        reach: 4.5,
        flags: ['kinetic_weapon', 'custom_cooldown', 'is_weapon'],
        beforeEffect: () => {
            return {
                strongHitSound: '',
                critAttack: false,
                sprintKnockback: false,
            };
        },
    },
    {
        id: 'minecraft:trident',
        attackSpeed: 1.1,
        damage: 9,
        flags: ['is_weapon'],
    },
    {
        id: 'minecraft:mace',
        attackSpeed: 0.6,
        damage: 6,
        flags: ['is_weapon', 'mace'],
    },
    {
        id: 'minecraft:crossbow',
        flags: ['skip_lore', 'no_inherit', 'hide_indicator'],
        beforeEffect: () => {
            return {
                cancelDurability: true,
            };
        },
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
        flags: ['disable_shield'],
    },
    {
        id: 'minecraft:golden_axe',
        attackSpeed: 1,
        damage: 7,
        flags: ['disable_shield'],
    },
    {
        id: 'minecraft:stone_axe',
        attackSpeed: 0.8,
        damage: 9,
        flags: ['disable_shield'],
    },
    {
        id: 'minecraft:copper_axe',
        attackSpeed: 0.8,
        damage: 9,
        flags: ['disable_shield'],
    },
    {
        id: 'minecraft:iron_axe',
        attackSpeed: 0.9,
        damage: 9,
        flags: ['disable_shield'],
    },
    {
        id: 'minecraft:diamond_axe',
        attackSpeed: 1,
        damage: 9,
        flags: ['disable_shield'],
    },
    {
        id: 'minecraft:netherite_axe',
        attackSpeed: 1,
        damage: 10,
        flags: ['disable_shield'],
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
