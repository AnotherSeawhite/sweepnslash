import { PROTO } from 'mcbe-ipc';
import { FunctionSerializer } from './function.ipc';

export const WeaponStatsSerializer = PROTO.Object({
    id: PROTO.String,
    attackSpeed: PROTO.Optional(PROTO.Float64),
    damage: PROTO.Optional(PROTO.Float64),
    isWeapon: PROTO.Optional(PROTO.Boolean),
    sweep: PROTO.Optional(PROTO.Boolean),
    disableShield: PROTO.Optional(PROTO.Boolean),
    skipLore: PROTO.Optional(PROTO.Boolean),
    regularKnockback: PROTO.Optional(PROTO.Float64),
    enchantedKnockback: PROTO.Optional(PROTO.Float64),
    regularVerticalKnockback: PROTO.Optional(PROTO.Float64),
    enchantedVerticalKnockback: PROTO.Optional(PROTO.Float64),
    noInherit: PROTO.Optional(PROTO.Boolean),
    beforeEffect: PROTO.Optional(FunctionSerializer),
    script: PROTO.Optional(FunctionSerializer),
});

interface StatsData {
    formatVersion: string;
    id: string;
    attackSpeed: number;
    damage: number;
    isWeapon: boolean;
    sweep: boolean;
    disableShield: boolean;
    skipLore: boolean;
    regularKnockback: number;
    enchantedKnockback: number;
    regularVerticalKnockback: number;
    enchantedVerticalKnockback: number;
    noInherit: boolean;
    reach: number;
    flags: string[];
    beforeEffect: Function;
    script: Function;
}

export const WeaponStatsSerializerVersioned: PROTO.Serializable<StatsData> = {
    *serialize(value, stream) {
        // versioning
        yield* PROTO.Optional(PROTO.String).serialize(value.formatVersion, stream);

        yield* PROTO.String.serialize(value.id, stream);
        yield* PROTO.Optional(PROTO.Float64).serialize(value.attackSpeed, stream);
        yield* PROTO.Optional(PROTO.Float64).serialize(value.damage, stream);
        yield* PROTO.Optional(PROTO.Boolean).serialize(value.isWeapon, stream);
        yield* PROTO.Optional(PROTO.Boolean).serialize(value.sweep, stream);
        yield* PROTO.Optional(PROTO.Boolean).serialize(value.disableShield, stream);
        yield* PROTO.Optional(PROTO.Boolean).serialize(value.skipLore, stream);
        yield* PROTO.Optional(PROTO.Float64).serialize(value.regularKnockback, stream);
        yield* PROTO.Optional(PROTO.Float64).serialize(value.enchantedKnockback, stream);
        yield* PROTO.Optional(PROTO.Float64).serialize(value.regularVerticalKnockback, stream);
        yield* PROTO.Optional(PROTO.Float64).serialize(
            value.enchantedVerticalKnockback,
            stream
        );
        yield* PROTO.Optional(PROTO.Boolean).serialize(value.noInherit, stream);

        if (value.formatVersion === '2.4.0') {
            yield* PROTO.Optional(PROTO.Float64).serialize(value.reach, stream);
            const flags: Set<string> = new Set();
            for (const flag of value.flags || []) {
                flags.add(flag);
            }
            yield* PROTO.Optional(PROTO.Set(PROTO.String)).serialize(flags, stream);
        }
        yield* PROTO.Optional(FunctionSerializer).serialize(value.beforeEffect, stream);
        yield* PROTO.Optional(FunctionSerializer).serialize(value.script, stream);

        // const flags: Set<string> = new Set();
        // if (value.isWeapon) flags.add("is_weapon")
        // if (value.sweep) flags.add("sweep")

        //yield* PROTO.Set(PROTO.String).serialize(flags, stream)
    },
    *deserialize(stream) {
        const formatVersion = yield* PROTO.Optional(PROTO.String).deserialize(stream);

        const id = yield* PROTO.String.deserialize(stream);
        const attackSpeed = yield* PROTO.Optional(PROTO.Float64).deserialize(stream);
        const damage = yield* PROTO.Optional(PROTO.Float64).deserialize(stream);
        const isWeapon = yield* PROTO.Optional(PROTO.Boolean).deserialize(stream);
        const sweep = yield* PROTO.Optional(PROTO.Boolean).deserialize(stream);
        const disableShield = yield* PROTO.Optional(PROTO.Boolean).deserialize(stream);
        const skipLore = yield* PROTO.Optional(PROTO.Boolean).deserialize(stream);
        const regularKnockback = yield* PROTO.Optional(PROTO.Float64).deserialize(stream);
        const enchantedKnockback = yield* PROTO.Optional(PROTO.Float64).deserialize(stream);
        const regularVerticalKnockback = yield* PROTO.Optional(PROTO.Float64).deserialize(
            stream
        );
        const enchantedVerticalKnockback = yield* PROTO.Optional(PROTO.Float64).deserialize(
            stream
        );
        const noInherit = yield* PROTO.Optional(PROTO.Boolean).deserialize(stream);

        let flags: string[] = [];
        if (formatVersion === '2.4.0') {
            const reach = yield* PROTO.Optional(PROTO.Float64).deserialize(stream);
            const flagsSet = yield* PROTO.Optional(PROTO.Set(PROTO.String)).deserialize(stream);
            flags = Array.from(flags || []);
        }

        const beforeEffect = yield* PROTO.Optional(FunctionSerializer).deserialize(stream);
        const script = yield* PROTO.Optional(FunctionSerializer).deserialize(stream);

        return {
            id,
            attackSpeed,
            damage,
            isWeapon,
            sweep,
            disableShield,
            skipLore,
            regularKnockback,
            enchantedKnockback,
            regularVerticalKnockback,
            enchantedVerticalKnockback,
            noInherit,
            flags: [],
            beforeEffect,
            script,
        };
    },
};
