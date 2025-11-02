import { world } from '@minecraft/server';
import { debug } from './mathAndCalculations.js';
import { WeaponStatsSerializer } from '../IPC/weapon_stats.ipc.js';
import { IPC, PROTO } from 'mcbe-ipc';
import { importStats, importEntityStats, WeaponStats, EntityStats } from '../importStats.js';

export const weaponStats: WeaponStats[] = [];
export const entityStats: EntityStats[] = [];

// Imports stats from files.

world.afterEvents.worldLoad.subscribe(async () => {
    let wepLogMessages = [];
    let entLogMessages = []; // Stores logs to print once at the end

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
                `- Failed to load "${stat.moduleName}": ${e instanceof Error ? e.message : e}`
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
                `- Failed to load "${stat.moduleName}": ${e instanceof Error ? e.message : e}`
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

    // Print all logs in one debug call
    if (combinedLogMessages.length > 0) {
        const debugMode = world.getDynamicProperty('debug_mode');
        if (debugMode) debug(`Stats File Load:\n${combinedLogMessages.join('\n')}`);
    }
});

// Imports stats from other addons through Inter-Pack Communication.
IPC.on('sweep-and-slash:register-weapons', PROTO.Array(WeaponStatsSerializer), (data) => {
    const debugMode = world.getDynamicProperty('debug_mode');
    for (const weaponStat of data) {
        // Ensure beforeEffect and script are correctly typed
        const fixedWeaponStat = {
            ...weaponStat,
            beforeEffect: weaponStat.beforeEffect as WeaponStats['beforeEffect'],
            script: weaponStat.script as WeaponStats['script'],
        };
        const existingIndex = weaponStats.findIndex((weapon) => weapon.id === weaponStat.id);
        if (existingIndex != -1) {
            weaponStats[existingIndex] = fixedWeaponStat;
            if (debugMode)
                debug(`IPC Receiver:\n${weaponStats[existingIndex].id} has been overwritten`);
        } else {
            weaponStats.push(fixedWeaponStat);
            if (debugMode) debug(`IPC Receiver:\n${weaponStat.id} has been added in the stats`);
        }
    }
});
