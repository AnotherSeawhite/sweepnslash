// https://www.curseforge.com/minecraft-bedrock/addons/vanilla-battle-axes

export const vanillaBattleAxes = [
    {
        id: 'tcc_battle_axes:wooden_battle_axe',
        attackSpeed: 0.9,
        damage: 8,
        isWeapon: true,
        sweep: true,
        disableShield: true,
        beforeEffect: () => {
            return {
                sweepPitch: 0.9,
            };
        },
    },
    {
        id: 'tcc_battle_axes:golden_battle_axe',
        attackSpeed: 1.1,
        damage: 8,
        isWeapon: true,
        sweep: true,
        disableShield: true,
        beforeEffect: () => {
            return {
                sweepPitch: 0.9,
            };
        },
    },
    {
        id: 'tcc_battle_axes:stone_battle_axe',
        attackSpeed: 0.9,
        damage: 9,
        isWeapon: true,
        sweep: true,
        disableShield: true,
        beforeEffect: () => {
            return {
                sweepPitch: 0.9,
            };
        },
    },
    {
        id: 'tcc_battle_axes:iron_battle_axe',
        attackSpeed: 0.9,
        damage: 10,
        isWeapon: true,
        sweep: true,
        disableShield: true,
        beforeEffect: () => {
            return {
                sweepPitch: 0.9,
            };
        },
    },
    {
        id: 'tcc_battle_axes:diamond_battle_axe',
        attackSpeed: 1,
        damage: 11,
        isWeapon: true,
        sweep: true,
        disableShield: true,
        beforeEffect: () => {
            return {
                sweepPitch: 0.9,
            };
        },
    },
    {
        id: 'tcc_battle_axes:netherite_battle_axe',
        attackSpeed: 1.1,
        damage: 11,
        isWeapon: true,
        sweep: true,
        disableShield: true,
        beforeEffect: () => {
            return {
                sweepPitch: 0.9,
            };
        },
    },
];
