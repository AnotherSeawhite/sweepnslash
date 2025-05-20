import { world } from '@minecraft/server';
import { debug } from './mathAndCalculations.js';
import { WeaponStatsSerializer } from '../IPC/weapon_stats.ipc.js';
import { IPC, PROTO } from 'mcbe-ipc';
import { importStats } from '../importStats.js';

export const weaponStats = [];

// Imports stats from files.

world.afterEvents.worldLoad.subscribe(() => {
    (async function () {
        let logMessages = []; // Stores logs to print once at the end

        for (const yeet of importStats) {
            try {
                const module = await import(`../weaponStats/${yeet.fileName}`);
                const newItems = module[yeet.arrayName];

                if (newItems) {
                    const weaponStatsMap = new Map(weaponStats.map((item) => [item.id, item]));

                    newItems.forEach((newItem) => {
                        if (weaponStatsMap.has(newItem.id)) {
                            Object.assign(weaponStatsMap.get(newItem.id), newItem);
                        } else {
                            weaponStats.push(newItem);
                        }
                    });
                    logMessages.push(`- "${yeet.arrayName}" loaded from "${yeet.fileName}"`);
                } else {
                    logMessages.push(`- "${yeet.arrayName}" not found in "${yeet.fileName}"`);
                }
            } catch (e) {
                logMessages.push(`- Failed to load "${yeet.fileName}": ${e.message}`);
            }
        }

        // Print all logs in one debug call
        if (logMessages.length > 0) {
            const debugMode = world.getDynamicProperty('debug_mode');
            if (debugMode) debug(`Stats File Load:\n${logMessages.join('\n')}`);
        }
    })();
});

// Imports stats from other addons through Inter-Pack Communication.
IPC.on('sweep-and-slash:register-weapons', PROTO.Array(WeaponStatsSerializer), (data) => {
    const debugMode = world.getDynamicProperty('debug_mode');
    for (const weaponStat of data) {
        const existingIndex = weaponStats.findIndex((weapon) => weapon.id === weaponStat.id);
        if (existingIndex != -1) {
            weaponStats[existingIndex] = weaponStat;
            if (debugMode)
                debug(`IPC Receiver:\n${weaponStats[existingIndex].id} has been overwritten`);
        } else {
            weaponStats.push(weaponStat);
            if (debugMode) debug(`IPC Receiver:\n${weaponStat.id} has been added in the stats`);
        }
    }
});
