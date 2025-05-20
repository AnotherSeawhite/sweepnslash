// https://www.curseforge.com/minecraft-bedrock/addons/flint-tools

export const flintTools = [
    {
        id: 'tcc_flint_tools:flint_sword',
        attackSpeed: 1.6,
        damage: 6,
        isWeapon: true,
        sweep: true,
    },
    {
        id: 'tcc_flint_tools:flint_pickaxe',
        attackSpeed: 1.2,
        damage: 4,
    },
    {
        id: 'tcc_flint_tools:flint_shovel',
        attackSpeed: 1,
        damage: 4.5,
    },
    {
        id: 'tcc_flint_tools:flint_axe',
        attackSpeed: 0.9,
        damage: 9,
        disableShield: true,
    },
    {
        id: 'tcc_flint_tools:flint_hoe',
        attackSpeed: 3,
        damage: 1,
    },
    {
        id: 'tcc_flint_tools:flint_knife',
        attackSpeed: 1.8,
        damage: 5,
        isWeapon: true,
    },
    {
        id: 'tcc_flint_tools:flint_battle_axe',
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
];
