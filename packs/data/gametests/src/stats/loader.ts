import { world } from '@minecraft/server';
import { Debug, logger } from '../shared/debug.ts';
import {
    WeaponStatsSerializer,
    WeaponStatsSerializerVersioned,
    WeaponStatsSerializerV3,
} from '../ipc/weapon_stats.ts';
import { IPC, PROTO } from 'mcbe-ipc';
import { TypeBuilder } from '@bedrock-oss/bedrock-boost';
import { importStats, importEntityStats, WeaponStats, EntityStats } from '../importStats.ts';

const WeaponStatsSchema = TypeBuilder.object('WeaponStats')
    .property('id', TypeBuilder.string())
    .property('formatVersion', TypeBuilder.string().optional())
    .property('attackSpeed', TypeBuilder.number().optional())
    .property('damage', TypeBuilder.number().optional())
    .property('isWeapon', TypeBuilder.boolean().optional())
    .property('sweep', TypeBuilder.boolean().optional())
    .property('disableShield', TypeBuilder.boolean().optional())
    .property('skipLore', TypeBuilder.boolean().optional())
    .property('noInherit', TypeBuilder.boolean().optional())
    .property('regularKnockback', TypeBuilder.number().optional())
    .property('enchantedKnockback', TypeBuilder.number().optional())
    .property('regularVerticalKnockback', TypeBuilder.number().optional())
    .property('enchantedVerticalKnockback', TypeBuilder.number().optional())
    .property('reach', TypeBuilder.number().optional())
    .property('flags', TypeBuilder.array(TypeBuilder.string()).optional())
    .allowUnknown()
    .build();

export const weaponStats: WeaponStats[] = [];
export const entityStats: EntityStats[] = [];

world.afterEvents.worldLoad.subscribe(async () => {
    let wepLogMessages: string[] = [];
    let entLogMessages: string[] = [];

    for (const stat of importStats) {
        try {
            stat.items.forEach((item) => {
                const result = WeaponStatsSchema.safeParse(item);
                if (!result.success) {
                    const issues = result.errors
                        .map((i) => `${i.path}: ${i.message}`)
                        .join(', ');
                    logger.error(
                        `[stats/loader] Invalid stats for "${(item as any)?.id ?? 'unknown'}" in module "${stat.moduleName}": ${issues}`,
                    );
                    return;
                }
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

    Debug.info(`Stats File Load:\n${combinedLogMessages.join('\n')}`);
});

function registerWeaponStats(weaponStat: WeaponStats) {
    const result = WeaponStatsSchema.safeParse(weaponStat);
    if (!result.success) {
        const issues = result.errors.map((i) => `${i.path}: ${i.message}`).join(', ');
        logger.error(`[IPC] Invalid stats for "${weaponStat?.id ?? 'unknown'}": ${issues}`);
        return;
    }
    const fixedWeaponStat = {
        ...weaponStat,
        beforeEffect: weaponStat.beforeEffect as WeaponStats['beforeEffect'],
        script: weaponStat.script as WeaponStats['script'],
    };
    const existingIndex = weaponStats.findIndex((weapon) => weapon.id === weaponStat.id);
    if (existingIndex !== -1) {
        weaponStats[existingIndex] = fixedWeaponStat;
        Debug.info(`IPC Receiver:\n${weaponStats[existingIndex].id} has been overwritten`);
    } else {
        weaponStats.push(fixedWeaponStat);
        Debug.info(`IPC Receiver:\n${weaponStat.id} has been added in the stats`);
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
