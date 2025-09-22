import { PROTO } from 'mcbe-ipc';
import { FunctionSerializer } from './function.ipc';

export const WeaponStatsSerializer = PROTO.Object({
    id: PROTO.String,
    attackSpeed: PROTO.Float64,
    damage: PROTO.Float64,
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
