# Adding Custom Weapon Stats

## 0. Information

Sweep 'N Slash completely disables the vanilla damage mechanics. Because of this, it is necessary to pre-define stats for the weapons to function correctly. This also means you can define any stats for any item, even if the item is not intended to be used as a weapon.

Existing stats can be defined internally and/or by sending items data from external addons.

Overwrite orders work the same as how you order RP/BP in the game. The topmost addon will have the final stats.

## 1. Adding stats by modifying the add-on

In weaponStats folder, you can simply add entries in the existing files. Or if you want to import it from separate files, create a file in the 'weaponStats' folder and add an entry in the 'importStats' array inside the 'importStats.ts'. After that, compile the pack and the stats will be added in the pack.
You can also manually add stats inside the already compiled pack, but it's not recommended.

## 2. Adding stats with item custom components

You can add stats by using custom components for your items. This is useful for basic work if using script and/or IPC is not preferred.
Note that stats added via IPC has higher priority and can be overwritten.

### sweepnslash:stats

Object for defining stats. Refer to 'Format' section in the the repo's wiki. Below are possible parameters:

- "damage": number
- "attack_speed": number
- "reach": number
- "regular_knockback": number
- "enchanted_knockback": number
- "regular_vertical_knockback": number
- "enchanted_vertical_knockback": number

### sweepnslash:flags

Array of strings, used for defining specific behavior of items. Below are possible flags:

- "is_weapon": Whether the item should be treated as a weapon. If not set, attacking with this item will deplete durability by 2.
- "sweep": Whether the item should have sweeping attack behavior.
- "disable_shield": Whether the item should disable shields when hit.
- "skip_lore": Whether to skip adding lore to the item.
- "no_inherit": Whether the item should not inherit the shooter's velocity when thrown/shot.
- "hide_indicator": Whether to hide the attack indicator when using this item.
- "kinetic_weapon": Whether the item has kinetic weapon component. When set, holding interact will disable custom damage behavior and use vanilla mechanics. This is *required* for kinetic weapons to work properly.
- "custom_cooldown": Whether the item uses vanilla item cooldown. When set, attack indicator will show the item cooldown instead.
- "mace": Whether the item has mace behavior. When set, falling for more than 1.5 blocks while holding the item will disable custom damage behavior and use vanilla mechanics. This is *not recommended* for custom items, as it is only a requirement for changing vanilla mace.

## 3. Adding stats from other behavior packs (after compiling)

First, install IPC for your addon from this website:
https://github.com/OmniacDev/MCBE-IPC

Or you can use the IPC built for Sweep 'N Slash if you don't know what you're doing. (IPC.zip)
You can also use a complete IPC pack for better understanding. (IPC_example_pack.zip)

Extract the zip file into scripts folder. After that, make a file or use an already existing file to define your stats on.

Following instructions assume that `WeaponStatsSerializerV3` channel will be used. You can change the IPC channel if needed.
In your stats file, import these:

```javascript
import { WeaponStatsSerializerV3 } from './IPC/weapon_stats.ipc';
import { IPC, PROTO } from './IPC/ipc';
import { world } from '@minecraft/server';
```

And then, paste this into the stats file:

- Script v1

```javascript
world.afterEvents.worldInitialize.subscribe((event) => {
    IPC.send(
        'sweep-and-slash:register-weapons@3',
        PROTO.Array(WeaponStatsSerializerV3),
        weaponStats,
    );
});
```

- Script v2

```javascript
world.afterEvents.worldLoad.subscribe((event) => {
    IPC.send(
        'sweep-and-slash:register-weapons@3',
        PROTO.Array(WeaponStatsSerializerV3),
        weaponStats,
    );
});
```

The 'weaponStats' will be the name of the stats array:

```javascript
const weaponStats = [
    {
        id: 'namespace:example_item',
        damage: 6,
        attackSpeed: 1.6,
        // ...
    },
];
```

If the stats are not importing, turn on Debug Mode and reload the world to see if the stats are importing correctly.

**NOTE:** It is *not* recommended to set IPC pack's script version higher than the main add-on's script version.

(Credits to Hog554, OmniacDev and theaddon for the help!)

## IPC Channels

### `sweep-and-slash:register-weapons`

Uses `WeaponStatsSerializer`. Supports basic fields only (no `reach`, no `flags`). Unchanged.

### `sweep-and-slash:register-weapons-versioned`

Uses `WeaponStatsSerializerVersioned`. **Frozen** — bugs are preserved to avoid breaking existing callers:

- `reach` is parsed from the stream but **not included** in the returned object.
- `flags` is **always returned as `[]`** regardless of what was serialized.

Use the V3 channel if you need `reach` or `flags` to work correctly.

### `sweep-and-slash:register-weapons@3` _(new in 2.8.0)_

Uses `WeaponStatsSerializerV3`. Fixes the bugs in the versioned channel:

- `reach` is correctly stored in the deserialized return object.
- `flags` is correctly deserialized from the serialized `flagsSet`.
- No `formatVersion` branching — always serializes all fields.

**Recommended for new integrations.**

---

## `utils` Argument in `beforeEffect` and `script`

Both callback types now receive a `utils` field. This gives callbacks clean access to the add-on's internal API without importing modules directly (which is not allowed in serialized function strings).

```ts
type SnsUtils = {
    getStatus(entity: Entity): PlayerStatus;
    getItemStats(
        entity: Entity,
        itemStack?: ItemStack,
    ): { equippableComp: any; item: ItemStack | undefined; stats: WeaponStats | undefined };
    hasItemFlag(entity: Entity, flag: string): boolean;
    getEntityStats(entity: Entity): EntityStats | undefined;
    isTeam(a: Entity, b: Entity): boolean;
    getHunger(player: Player): number | undefined;
    getSaturation(player: Player): number | undefined;
    getExhaustion(player: Player): number | undefined;
    getLastAttack(
        entity: Entity,
    ): { rawDamage: number; damage: number; time: number } | undefined;
};
```

Existing callbacks that do not destructure `utils` are **unaffected** — this is a purely additive change.

---

## Prototype Extensions Removed

As of 2.8.0, Sweep 'N Slash **no longer mutates `@minecraft/server` prototypes**. The following prototype extensions no longer exist:

| Removed extension                     | Replacement                                                            |
| ------------------------------------- | ---------------------------------------------------------------------- |
| `entity.getStatus()`                  | `utils.getStatus(entity)` in callbacks; `getStatus(entity)` internally |
| `player.setAttackCooldown(tick)`      | Internal only                                                          |
| `player.setLastShieldTime(tick)`      | Internal only                                                          |
| `entity.getItemStats(item?)`          | `utils.getItemStats(entity, item?)` in callbacks                       |
| `entity.hasItemFlag(flag)`            | `utils.hasItemFlag(entity, flag)` in callbacks                         |
| `ItemStack.hasFlag(flag)`             | Internal only                                                          |
| `entity.getStats()`                   | `utils.getEntityStats(entity)` in callbacks                            |
| `entity.applyAttackKnockback(loc, h)` | Internal only                                                          |
| `entity.applyImpulseAsKnockback(vec)` | Internal only                                                          |
| `entity.spawnSelectiveParticle(...)`  | Internal only                                                          |
| `entity.playSelectiveSound(...)`      | Internal only                                                          |
| `entity.healthParticle(dmg)`          | Internal only                                                          |
| `entity.isFasterThanWalk`             | Internal only                                                          |
| `player.getHunger/setHunger` etc.     | `utils.getHunger(player)` etc. in callbacks                            |
| `entity.center(offset?)`              | Inlined at call sites                                                  |
| `entity.viewRotation(dist, height)`   | Inlined at call sites                                                  |
| `entity.isTamed(opts)`                | `entity.getComponent('is_tamed')?.isValid`                             |
| `entity.getRidingOn()`                | `entity.getComponent('riding')?.entityRidingOn`                        |
| `entity.getRiders()`                  | `entity.getComponent('rideable')?.getRiders()`                         |
| `entity.isRiding`                     | `entity.getComponent('riding')?.isValid ?? false`                      |
| `entity.__playerHit`                  | Internal only (`playerHitMap`)                                         |
| `entity.__lastAttack`                 | `utils.getLastAttack(entity)` in callbacks                             |
| `player.__rawDamage`                  | Internal only (`rawDamageMap`)                                         |
| `entity.__daggerSecondHit`            | Internal only (`daggerSecondHitMap`)                                   |
| `player.__configLastClosed`           | Internal only (`configLastClosedMap`)                                  |
