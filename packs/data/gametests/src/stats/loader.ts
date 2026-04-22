import { world } from '@minecraft/server';
import { debug } from '../shared/math.ts';
import {
    WeaponStatsSerializer,
    WeaponStatsSerializerVersioned,
    WeaponStatsSerializerV3,
} from '../ipc/weapon_stats.ts';
import { IPC, PROTO } from 'mcbe-ipc';
import { importStats, importEntityStats, WeaponStats, EntityStats } from '../importStats.ts';

export const weaponStats: WeaponStats[] = [];
export const entityStats: EntityStats[] = [];

world.afterEvents.worldLoad.subscribe(async () => {
    let wepLogMessages: string[] = [];
    let entLogMessages: string[] = [];

    for (const stat of importStats) {
        try {
            stat.items.forEach((item) => {
                const index = weaponStats.findIndex((weapon) => weapon.id === item.id);
                if (index > -1) weaponStats[index] = item;
                else weaponStats.push(item);
            });
            wepLogMessages.push(`- "${stat.moduleName}" loaded`);
        } catch (e) {
            wepLogMessages.push(
                `- Failed to load "${stat.moduleName}": ${e instanceof Error ? e.message : e}`,
            );
        }
    }

    for (const stat of importEntityStats) {
        try {
            stat.items.forEach((item) => {
                const index = entityStats.findIndex((entity) => entity.id === item.id);
                if (index > -1) entityStats[index] = item;
                else entityStats.push(item);
            });
            entLogMessages.push(`- "${stat.moduleName}" loaded`);
        } catch (e) {
            entLogMessages.push(
                `- Failed to load "${stat.moduleName}": ${e instanceof Error ? e.message : e}`,
            );
        }
    }

    const combinedLogMessages = [
        'Weapon Stats Load:',
        ...wepLogMessages,
        '',
        'Entity Stats Load:',
        ...entLogMessages,
    ];

    const debugMode = world.getDynamicProperty('debug_mode');
    if (debugMode) debug(`Stats File Load:\n${combinedLogMessages.join('\n')}`);
});

function registerWeaponStats(weaponStat: WeaponStats) {
    const fixedWeaponStat = {
        ...weaponStat,
        beforeEffect: weaponStat.beforeEffect as WeaponStats['beforeEffect'],
        script: weaponStat.script as WeaponStats['script'],
    };
    const debugMode = world.getDynamicProperty('debug_mode');
    const existingIndex = weaponStats.findIndex((weapon) => weapon.id === weaponStat.id);
    if (existingIndex !== -1) {
        weaponStats[existingIndex] = fixedWeaponStat;
        if (debugMode)
            debug(`IPC Receiver:\n${weaponStats[existingIndex].id} has been overwritten`);
    } else {
        weaponStats.push(fixedWeaponStat);
        if (debugMode) debug(`IPC Receiver:\n${weaponStat.id} has been added in the stats`);
    }
}

IPC.on('sweep-and-slash:register-weapons', PROTO.Array(WeaponStatsSerializer), (data) => {
    for (const weaponStat of data) registerWeaponStats(weaponStat as WeaponStats);
});

IPC.on(
    'sweep-and-slash:register-weapons-versioned',
    PROTO.Array(WeaponStatsSerializerVersioned),
    (data) => {
        for (const weaponStat of data) registerWeaponStats(weaponStat as WeaponStats);
    },
);

IPC.on('sweep-and-slash:register-weapons@3', PROTO.Array(WeaponStatsSerializerV3), (data) => {
    for (const weaponStat of data) registerWeaponStats(weaponStat as WeaponStats);
});
