import { world } from '@minecraft/server';
import { debug } from './mathAndCalculations.js';
import { WeaponStatsSerializer } from '../IPC/weapon_stats.ipc.js';
import { IPC, PROTO } from 'mcbe-ipc';
import { importStats, WeaponStats } from '../importStats.js';

export const weaponStats: WeaponStats[] = [];

// Imports stats from files.

world.afterEvents.worldLoad.subscribe(async () => {
    let logMessages = []; // Stores logs to print once at the end

    for (const stat of importStats) {
        try {
            stat.items.forEach((item) => {
                const index = weaponStats.findIndex((weapon) => weapon.id === item.id);
                if (index > -1) weaponStats[index] = item;
                else weaponStats.push(item);
            });
            logMessages.push(`- "${stat.moduleName}" loaded`);
        } catch (e) {
            logMessages.push(
                `- Failed to load "${stat.moduleName}": ${e instanceof Error ? e.message : e}`
            );
        }
    }

    // Print all logs in one debug call
    if (logMessages.length > 0) {
        const debugMode = world.getDynamicProperty('debug_mode');
        if (debugMode) debug(`Stats File Load:\n${logMessages.join('\n')}`);
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
