import { PROTO } from './ipc'
import { FunctionSerializer } from './function.ipc'

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
  beforeEffect: PROTO.Optional(FunctionSerializer),
  script: PROTO.Optional(FunctionSerializer)
})