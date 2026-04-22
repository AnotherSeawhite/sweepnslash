# Adding Custom Weapon Stats from Other Addons

## 0. Information

Sweep 'N Slash completely disables the vanilla damage mechanics. Because of this, it is necessary to pre-define stats for the weapons to function correctly. This also means you can define any stats for any item, even if the item is not intended to be used as a weapon.

Existing stats can be defined internally and/or by sending items data from external addons.

Overwrite orders work the same as how you order RP/BP in the game. The topmost addon will have the final stats.

## 1. Adding stats in Sweep 'N Slash files

In weaponStats folder, you can simply add entries in the existing files. Or if you want to import it from separate files, create a file in the 'weaponStats' folder and add an entry in the 'importStats' array inside the 'importStats.ts'. After that, compile the pack and the stats will be added in the pack.
You can also manually add stats inside the already compiled pack, but it's not recommended.

## 2. Adding stats from other behavior packs (after compiling)

First, install IPC for your addon from this website:
https://github.com/OmniacDev/MCBE-IPC

Or you can use the IPC built for Sweep 'N Slash if you don't know what you're doing. (IPC.zip)
You can also use a complete IPC pack for better understanding. (IPC_example_pack.zip)

Extract the zip file into scripts folder. After that, make a file or use an already existing file to define your stats on.

In your stats file, import these:

```javascript
import { WeaponStatsSerializer } from './IPC/weapon_stats.ipc';
import { IPC, PROTO } from './IPC/ipc';
import { world } from '@minecraft/server';
```

And then, paste this into the stats file:

- Script v1
```javascript
world.afterEvents.worldInitialize.subscribe((event) => {
    IPC.send(
        'sweep-and-slash:register-weapons',
        PROTO.Array(WeaponStatsSerializer),
        weaponStats
    );
});
```

- Script v2
```javascript
world.afterEvents.worldLoad.subscribe((event) => {
    IPC.send(
        'sweep-and-slash:register-weapons',
        PROTO.Array(WeaponStatsSerializer),
        weaponStats
    );
});
```

The 'weaponStats' will be the name of the stats array:

```javascript
const weaponStats = [
    {
        id: 'namespace:example1',
        attackSpeed: 1.6,
        // ...
    },
];
```

If the stats are not importing, turn on Debug Mode and reload the world to see if the stats are importing correctly.

**NOTE:** Sweep 'N Slash uses 2.1.0-beta module for @minecraft/server. This means IPC exported functions are required to follow 2.1.0-beta formats.

(Credits to Hog554 and OmniacDev for the help!)

## IPC Channels

### `sweep-and-slash:register-weapons`
Uses `WeaponStatsSerializer`. Supports basic fields only (no `reach`, no `flags`, no functions). Unchanged.

### `sweep-and-slash:register-weapons-versioned`
Uses `WeaponStatsSerializerVersioned`. **Frozen** — bugs are preserved to avoid breaking existing callers:
- `reach` is parsed from the stream but **not included** in the returned object.
- `flags` is **always returned as `[]`** regardless of what was serialized.

Use the V3 channel if you need `reach` or `flags` to work correctly.

### `sweep-and-slash:register-weapons@3` *(new in 2.8.0)*
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
    getItemStats(entity: Entity, itemStack?: ItemStack): { equippableComp: any; item: ItemStack | undefined; stats: WeaponStats | undefined };
    hasItemFlag(entity: Entity, flag: string): boolean;
    getEntityStats(entity: Entity): EntityStats | undefined;
    isTeam(a: Entity, b: Entity): boolean;
    getHunger(player: Player): number | undefined;
    getSaturation(player: Player): number | undefined;
    getExhaustion(player: Player): number | undefined;
};
```

Existing callbacks that do not destructure `utils` are **unaffected** — this is a purely additive change.

---

## Prototype Extensions Removed

As of 2.8.0, Sweep 'N Slash **no longer mutates `@minecraft/server` prototypes**. The following prototype extensions no longer exist:

| Removed extension | Replacement |
|---|---|
| `entity.getStatus()` | `utils.getStatus(entity)` in callbacks; `getStatus(entity)` internally |
| `player.setAttackCooldown(tick)` | Internal only |
| `player.setLastShieldTime(tick)` | Internal only |
| `entity.getItemStats(item?)` | `utils.getItemStats(entity, item?)` in callbacks |
| `entity.hasItemFlag(flag)` | `utils.hasItemFlag(entity, flag)` in callbacks |
| `ItemStack.hasFlag(flag)` | Internal only |
| `entity.getStats()` | `utils.getEntityStats(entity)` in callbacks |
| `entity.applyAttackKnockback(loc, h)` | Internal only |
| `entity.applyImpulseAsKnockback(vec)` | Internal only |
| `entity.spawnSelectiveParticle(...)` | Internal only |
| `entity.playSelectiveSound(...)` | Internal only |
| `entity.healthParticle(dmg)` | Internal only |
| `entity.isFasterThanWalk` | Internal only |
| `player.getHunger/setHunger` etc. | `utils.getHunger(player)` etc. in callbacks |
| `entity.center(offset?)` | Inlined at call sites |
| `entity.viewRotation(dist, height)` | Inlined at call sites |
| `entity.isTamed(opts)` | `entity.getComponent('is_tamed')?.isValid` |
| `entity.getRidingOn()` | `entity.getComponent('riding')?.entityRidingOn` |
| `entity.getRiders()` | `entity.getComponent('rideable')?.getRiders()` |
| `entity.isRiding` | `entity.getComponent('riding')?.isValid ?? false` |
