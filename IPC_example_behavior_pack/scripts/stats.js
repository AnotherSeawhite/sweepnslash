import { WeaponStatsSerializerV3 } from './IPC/weapon_stats.ipc';
import { IPC, PROTO } from './IPC/ipc';
import { world } from '@minecraft/server';

// Refer to (future repo link here)

/* Possible flags:
- is_weapon: Whether the item should be treated as a weapon. If not set, attacking with this item will deplete durability by 2.
- sweep: Whether the item should have sweeping attack behavior.
- disable_shield: Whether the item should disable shields when hit.
- skip_lore: Whether to skip adding lore to the item.
- no_inherit: Whether the item should not inherit the shooter's velocity when thrown/shot.
- hide_indicator: Whether to hide the attack indicator when using this item.
- kinetic_weapon: Whether the item has kinetic weapon component. If set, holding interact will disable custom damage behavior and use vanilla mechanics. This is *required* for kinetic weapons to work properly.
- custom_cooldown: Whether the item uses vanilla item cooldown. If set, attack indicator will show the item cooldown instead.
- mace: Whether the item has mace behavior. If set, falling for more than 1.5 blocks while holding the item will disable custom damage behavior and use vanilla mechanics. This is *not recommended* for custom items, as it is only a requirement for changing vanilla mace.
*/

const weaponStats = [
    {
        id: 'minecraft:stick',
        attackSpeed: 1.6,
        damage: 8,
        flags: ['is_weapon', 'sweep'],
        beforeEffect: ({ mc, player, item }) => {
            function random(min, max) {
                return Math.random() * (max - min) + min;
            }
            const rgb = {
                red: random(0, 1),
                green: random(0, 1),
                blue: random(0, 1),
            };

            let map = new mc.MolangVariableMap();
            map.setFloat('variable.size', random(0.8, 1));
            map.setColorRGB('variable.color', rgb);

            return {
                sweepMap: map,
            };
        },
    },
    {
        id: 'minecraft:iron_sword',
        flags: ['disable_shield'],
        beforeEffect: () => {
            return {
                cancelDurability: true,
            };
        },
    },
];

world.afterEvents.worldInitialize.subscribe((event) => {
    IPC.send(
        'sweep-and-slash:register-weapons@3',
        PROTO.Array(WeaponStatsSerializerV3),
        weaponStats,
    );
});
