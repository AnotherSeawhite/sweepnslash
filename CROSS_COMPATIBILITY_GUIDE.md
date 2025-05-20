# Adding Custom Weapon Stats from Other Addons

## 0. Information

Sweep 'N Slash completely disables the vanilla damage mechanics. Because of this, it is necessary to pre-define stats for the weapons to function correctly. This also means you can define any stats for any item, even if the item is not intended to be used as a weapon.

Existing stats can be defined internally and/or by sending items data from external addons.

Overwrite orders work the same as how you order RP/BP in the game. The topmost addon will have the final stats.

## 1. Adding stats in Sweep 'N Slash files

In weaponStats folder, you can simply add entries in the existing files. Or if you want to import it from separate files, create a file in the 'weaponStats' folder and add an entry in the 'importStats' array inside the 'importStats.js'.

## 2. Adding stats from other addons

First, install IPC for your addon from this website:
https://github.com/OmniacDev/MCBE-IPC

Or you can use the IPC built for Sweep 'N Slash if you don't know what you're doing. (IPC.zip)

Extract the zip file into scripts folder. After that, make a file or use an already existing file to define your stats on.

In your stats file, import these:

```javascript
import { WeaponStatsSerializer } from './IPC/weapon_stats.ipc';
import { IPC, PROTO } from './IPC/ipc';
```

And then, paste this into the stats file:

```javascript
world.afterEvents.worldInitialize.subscribe((event) => {
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

**NOTE:** Sweep 'N Slash uses 2.0.0-beta module for @minecraft/server. This means IPC exported functions are required to follow 2.0.0-beta formats.

(Credits to Hog554 and OmniacDev for the help!)
