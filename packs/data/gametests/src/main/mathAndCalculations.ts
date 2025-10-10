// This file is used to store most of the math and calculation functions for the Add-On to run.

import {
    system,
    world,
    MolangVariableMap,
    Entity,
    Player,
    EquipmentSlot,
    EntityDamageCause,
    GameMode,
	PlayerSoundOptions
} from '@minecraft/server';
import { weaponStats } from './weaponStatsHandler.js';
import { lambertW0, lambertWm1 } from './lambertw.js';
import { Vector3Utils, clampNumber } from './minecraft-math.js';

const biomeArray = [
    'minecraft:frozen_ocean',
    'minecraft:deep_frozen_ocean',
    'minecraft:frozen_river',
    'minecraft:cold_beach',
    'minecraft:cold_taiga',
    'minecraft:cold_taiga_hills',
    'minecraft:cold_taiga_mutated',
    'minecraft:savanna',
    'minecraft:savanna_plateau',
    'minecraft:savanna_mutated',
    'minecraft:savanna_plateau_mutated',
    'minecraft:desert',
    'minecraft:desert_hills',
    'minecraft:desert_mutated',
    'minecraft:ice_plains',
    'minecraft:ice_mountains',
    'minecraft:ice_plains_spikes',
    'minecraft:mesa',
    'minecraft:mesa_plateau',
    'minecraft:mesa_plateau_mutated',
    'minecraft:mesa_plateau_stone_mutated',
    'minecraft:mesa_bryce',
    'minecraft:grove',
    'minecraft:snowy_slopes',
    'minecraft:jagged_peaks',
    'minecraft:frozen_peaks',
];

// This is used to check for debug mode, which is accessible in configuration menu.
export function debug(message) {
    // Calling getDynamicProperty here caused a massive performance issue.
    if (message) console.log(`\n§3Sweep §f'N §6Slash §fDebug Info\n${message}`);
}

// This is used to check player's status.
const playerStatus = new WeakMap();

function initializePlayerStatus(player) {
    const status = {
        sprintKnockbackHitUsed: false,
        sprintKnockbackValid: false,
        critSweepValid: true,
        shieldValid: false,
        mace: false,
        attackReady: false,
        showBar: true,
        holdInteract: false,
		leftClick: false,
    	rightClick: false,
        lastSelectedItem: undefined,
        lastSelectedSlot: undefined,
        cooldown: 0,
        lastAttackTime: 0,
        lastShieldTime: 0,
        foodTickTimer: 0,
        fallDistance: 0,
    };
    playerStatus.set(player, status);
}

Entity.prototype.getStatus = function () {
    if (!playerStatus.has(this)) initializePlayerStatus(this);
    return playerStatus.get(this);
};

function dotProduct(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}
function magnitude(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}
function calculateAngle(v1, v2) {
    const dot = dotProduct(v1, v2);
    const mag1 = magnitude(v1);
    const mag2 = magnitude(v2);
    return Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
}

/**
 * Chance dice roll
 * @param {number} num / Represents the chance%
 * @returns {boolean} If the roll is larger than the number specified, return true
 */
export function rng(num) {
    let min = 0;
    let max = 100;
    const math = Math.floor(Math.random() * (max - min) + min);
    return math < clampNumber(num, min, max);
}

/**
 * Pick number between specified numbers
 * @param {number} min / Minimum number possible
 * @param {number} max / Maximum number possible
 * @returns {number} Get the number between min and max
 */
export function random(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Get the target's center
 * @param {Vector3} vector3 / Offset
 * @returns {Vector3}
 */
Entity.prototype.center = function (vector3 = { x: 0, y: 0, z: 0 }) {
    const { x, y, z } = vector3;
    const loc = this.location;
    const head = this.getHeadLocation();
    const isDragon = this.typeId == 'minecraft:ender_dragon' ? 3 : 0;
    return {
        x: loc.x + x,
        y: (loc.y + head.y) / 2 + y + isDragon,
        z: loc.z + z,
    };
};

/**
 * Get the entity's normalized view direction using rotation
 * @param {number} dist / Distance from the center
 * @param {number} height / Height from the center
 * @returns {Vector3} Player's normalized rotation
 */
Entity.prototype.viewRotation = function (dist = 1, height = 0) {
    const loc = this.location;
    const headLoc = this.getHeadLocation();
    const rot = this.getRotation();

    const viewCenter = {
        x: loc.x - Math.sin(rot.y * (Math.PI / 180)) * dist,
        y: (loc.y + headLoc.y) / 2 + height,
        z: loc.z + Math.cos(rot.y * (Math.PI / 180)) * dist,
    };

    return viewCenter;
};

// Add lore for an item in the slot.
function stringifyRawMessage(msg) {
  if (!msg) return "";
  if (msg.text) return msg.text;
  if (msg.translate) return msg.translate;
  if (msg.rawtext) return msg.rawtext.map(stringifyRawMessage).join("");
  return "";
}

// Almost had a headache trying to figure this out.
export function inventoryAddLore({ source, slot }) {
  const inv = source.getComponent('inventory').container;
  const itemSlot = inv.getSlot(slot);
  if (!itemSlot.hasItem()) return;

  const { item, stats } = source.getItemStats(itemSlot.getItem());
  if (!stats) return;

  let existingLore = item.getRawLore() ?? [];

  const damageStr = stats.damage !== undefined
    ? { rawtext: [{ text: ` §r§2${stats.damage} ` }, { translate: 'sweepnslash.attribute.name.attack_damage' }] }
    : null;

  const atkSpeedStr = stats.attackSpeed !== undefined
    ? { rawtext: [{ text: ` §r§2${stats.attackSpeed} ` }, { translate: 'sweepnslash.attribute.name.attack_speed' }] }
    : null;

  function isOurLine(raw) {
    const str = stringifyRawMessage(raw) || "";

    if (
      str.includes('sweepnslash.item.modifiers.mainhand') ||
      str.includes('sweepnslash.attribute.name.attack_damage') ||
      str.includes('sweepnslash.attribute.name.attack_speed')
    ) return true;

    const noColor = str.replace(/§./g, "");

    if (/\bDMG\b/i.test(noColor) || /\bSPD\b/i.test(noColor)) return true;

    if (/\d+(\.\d+)?\s*(DMG|SPD)/i.test(noColor)) return true;

    return false;
  }

  const itemLore = existingLore.filter((line) => !isOurLine(line));

  if (existingLore.length >= 100) return;

  if (stats.skipLore) {
    itemSlot.setLore([...itemLore]);
  } else {
    const newLore = [];

    // Add mainhand string if damage or attack speed exists
    if (damageStr || atkSpeedStr) {
      newLore.push({ rawtext: [{ text: '§r§7' }, { translate: 'sweepnslash.item.modifiers.mainhand' }] });
      if (damageStr) newLore.push(damageStr);
      if (atkSpeedStr) newLore.push(atkSpeedStr);
    }

    itemSlot.setLore([...newLore, ...itemLore]);
  }
}

/**
 * Subtract two Vector3 values
 * @param {Vector3} v1
 * @param {Vector3} v2
 * @returns {Vector3} Subtracted Vector3
 */
export function sub(v1, v2) {
    const vector3 = {
        x: v1.x - v2.x,
        y: v1.y - v2.y,
        z: v1.z - v2.z,
    };
    return vector3;
}

// This function was written by MADLAD3718.
// Attack knockback using Lambert W.
Entity.prototype.applyAttackKnockback = function (location, max_height = 1) {
    const delta = sub(location, this.location);
    const y_max = Math.max(max_height, delta.y + max_height);
    const a = 0.08;
    const d = 0.02;

    const ln = Math.log1p(-d);
    const vy =
        (a *
            (d - 1) *
            (lambertWm1(-Math.exp(-(y_max * d * ln + a * d - a) / (a * (d - 1)))) + 1)) /
        d;
    const e = Math.exp((delta.y * d * ln + a + d * (vy - a)) / (a * (d - 1)));
    const W = lambertW0((-(a * (d - 1) - vy * d) * e) / (a * (d - 1)));
    const time =
        (-a * (d - 1) * W + delta.y * d * ln + a * (1 - d) + vy * d) / (a * (d - 1) * ln);

    const m0 = 1.5;
    const muliplier = (m0 - 1) * Math.pow((66 - Math.min(time, 66)) / 66, 2) + 1;
    const vx = delta.x * 0.33 * muliplier;
    const vz = delta.z * 0.33 * muliplier;
    const v = { x: vx, y: vy, z: vz };
    this.applyImpulseAsKnockback(v);
};

Entity.prototype.applyImpulseAsKnockback = function (vector3) {
    // Extract vector components
    const { x, y, z } = vector3;

    // Calculate horizontal strength (magnitude in XZ plane)
    const horizontalStrength = Math.sqrt(x * x + z * z);
    const verticalStrength = y; // Y-axis strength remains unchanged

    // Normalize horizontal direction if there's movement
    const directionX = horizontalStrength !== 0 ? x / horizontalStrength : 0;
    const directionZ = horizontalStrength !== 0 ? z / horizontalStrength : 0;

    try {
        // Reset velocity before applying knockback
        this.applyKnockback({ x: 0, z: 0 }, 0);

        // Apply new knockback format
        const vel = this.getVelocity();
        this.applyKnockback(
            {
                x: vel.x + directionX * horizontalStrength,
                z: vel.z + directionZ * horizontalStrength,
            },
            verticalStrength + (this.isOnGround ? 0 : vel.y)
        );
    } catch (e) {
        const debugMode = world.getDynamicProperty('debug_mode');
        if (debugMode) debug('Error during knockback: ' + e + ', knockback skipped');
    }
};

// For spawning particles that's only visible to players with particle configuration.
Entity.prototype.spawnSelectiveParticle = function (effectName, location, dynamicProperty, offset = { x: 0, y: 0, z: 0 }, molangVariables: MolangVariableMap) {
    const offsetLocation = {
        x: location.x + offset.x,
        y: location.y + offset.y,
        z: location.z + offset.z,
    };
    const debugMode = world.getDynamicProperty('debug_mode');
    for (const p of world.getAllPlayers()) {
        try {
            if (
                p.getDynamicProperty(dynamicProperty) == true &&
                p.dimension.id == this.dimension.id
            )
                molangVariables
                    ? p.spawnParticle(effectName, offsetLocation, molangVariables)
                    : p.spawnParticle(effectName, offsetLocation);
        } catch (e) {
            if (debugMode) debug(e);
        }
    }
};

// For playing sounds that's only audible to players with sounds configuration.
Entity.prototype.playSelectiveSound = function (soundId, dynamicProperty, soundOptions: PlayerSoundOptions) {
    const debugMode = world.getDynamicProperty('debug_mode');
    for (const p of world.getAllPlayers()) {
        try {
            if (
                p.getDynamicProperty(dynamicProperty) == true &&
                p.dimension.id == this.dimension.id
            )
                p.playSound(soundId, soundOptions);
        } catch (e) {
            if (debugMode) debug(e);
        }
    }
};

// For damage particles, with molang variable maps.
Entity.prototype.healthParticle = function (damage) {
    const loc = this.center({ x: 0, y: 0.5, z: 0 });
    const hp = this.getComponent('health');
    const dmg = clampNumber(damage, hp.effectiveMin, hp.effectiveMax) / 2;
    const amount = Math.trunc(dmg);
    let map = new MolangVariableMap();
    map.setFloat('variable.amount', amount);
        this.spawnSelectiveParticle(
        "sweepnslash:damage_indicator_emitter",
        loc,
        "damageIndicator",
        undefined,
        map
    );
}

// Converts vector3 to RGB. Hacky.
export function toColor(vector3) {
    const { x, y, z } = vector3;
    const rand = clampNumber(random(0.5, 1), 0.5, 1);
    const rgb = {
        red: (clampNumber(x, 0, 255) / 255) * rand,
        green: (clampNumber(y, 0, 255) / 255) * rand,
        blue: (clampNumber(z, 0, 255) / 255) * rand,
    };
    return rgb;
}

// Damage Calculation
// Based on The Minecraft Wiki info
// https://minecraft.wiki/w/Damage
export function getCooldownTime(player: Player, baseAttackSpeed = 4) {
    const haste = Check.effect(player, 'haste');
    const miningFatigue = Check.effect(player, 'mining_fatigue');

    // Each haste level increases speed by 10%
    const hasteMultiplier = 1 + haste * 0.1;

    // Each fatigue level decreases speed by 10%
    const miningFatigueMultiplier = 1 - miningFatigue * 0.1;

    // Final speed, with minimum safeguard (never go below 0.000005)
    const adjustedSpeed = Math.max(
        baseAttackSpeed * hasteMultiplier * miningFatigueMultiplier,
        0.000005
    );
    const ticks = 20 / adjustedSpeed;
    const baseSpeed = 20 / baseAttackSpeed;

    return { ticks, baseSpeed };
}

// Return the stats of the weapon from player's weapon.
Entity.prototype.getItemStats = function (itemStack) {
    const equippableComp = this.getComponent('equippable');
    const item = itemStack ?? equippableComp?.getEquipment(EquipmentSlot.Mainhand);

    const jsStats = weaponStats.find((wep) => wep.id === item?.typeId);

    const jsonParams = item?.getComponent('sweepnslash:stats')?.customComponentParameters?.params;

    const keyMap = {
        damage: 'damage',
        attack_speed: 'attackSpeed',
        is_weapon: 'isWeapon',
        sweep: 'sweep',
        disable_shield: 'disableShield',
        skip_lore: 'skipLore',
        no_inherit: 'noInherit',
        regular_knockback: 'regularKnockback',
        enchanted_knockback: 'enchantedKnockback',
        regular_vertical_knockback: 'regularVerticalKnockback',
        enchanted_vertical_knockback: 'enchantedVerticalKnockback'
    };

    const jsonStats = {};
    if (jsonParams && typeof jsonParams === 'object') {
        for (const [jsonKey, statKey] of Object.entries(keyMap)) {
            if (jsonParams[jsonKey] !== undefined) {
                jsonStats[statKey] = jsonParams[jsonKey];
            }
        }
    }

    const mergedStats = {};
    for (const k in jsonStats) mergedStats[k] = jsonStats[k];

    if (jsStats && typeof jsStats === 'object') {
        for (const k in jsStats) {
            if (jsStats[k] !== undefined) {
                mergedStats[k] = jsStats[k];
            }
        }
    }

    const statsToReturn =
        Object.keys(mergedStats).length ? mergedStats
        : (jsStats && Object.keys(jsStats).length ? jsStats
        : (Object.keys(jsonStats).length ? jsonStats : undefined));

    return { equippableComp, item, stats: statsToReturn };
};

Entity.prototype.isTamed = function ({ excludeTypes = [] } = {}) {
    if (excludeTypes.includes(this.typeId)) return false;
    return this.getComponent('is_tamed')?.isValid;
};

Player.prototype.getHunger = function() {
	return this.getComponent("player.hunger")?.currentValue;
};

Player.prototype.setHunger = function(number) {
	this.getComponent("player.hunger")?.setCurrentValue(number);
};

Player.prototype.getSaturation = function() {
	return this.getComponent("player.saturation")?.currentValue;
};

Player.prototype.setSaturation = function(number) {
	this.getComponent("player.saturation")?.setCurrentValue(number);
};

Player.prototype.getExhaustion = function() {
	return this.getComponent("player.exhaustion")?.currentValue;
};

Player.prototype.setExhaustion = function(number) {
	this.getComponent("player.exhaustion")?.setCurrentValue(number);
};

// Boolean check whether the player is riding anything or not. Used for shield check.
// ex) Entity.isRiding == true
Object.defineProperty(Entity.prototype, 'isRiding', {
    get: function () {
        return this.getComponent('riding')?.isValid ?? false;
    },
});

Object.defineProperty(Entity.prototype, 'isUnderground', {
    get: function () {
        const { dimension, location } = this;
        const { min, max } = dimension.heightRange;

        if (location.y < min || location.y > max) return false;

        const blocks = dimension.getBlockFromRay(
            location,
            { x: 0, y: 1, z: 0 },
            {
                maxDistance: max - location.y,
                includeLiquidBlocks: true,
                includePassableBlocks: false,
            }
        );

        if (blocks) return true;
    },
});

Object.defineProperty(Entity.prototype, 'isFasterThanWalk', {
    get: function () {
        const movement = this.getComponent('movement');
        const speed = movement?.currentValue ?? 0;
        const walkSpeed = this.isSprinting ? speed * (10 / 13) : speed;
        const velocity = this.getVelocity();
        const hypot = Math.hypot(velocity.x, velocity.z);

        return hypot >= walkSpeed * 2.1585 && this.isSprinting;
    },
});

// Return the entity the player is riding on.
Entity.prototype.getRidingOn = function () {
    return this.getComponent('riding')?.entityRidingOn;
};
// Return an array of the entities riding on an player.
Entity.prototype.getRiders = function () {
    return this.getComponent('rideable')?.getRiders();
};

export class Check {
    static inanimate(entity, { excludeTypes = [] } = {}) {
        const inanimateArray = [
            'minecraft:ender_crystal',
            'minecraft:painting',
            'minecraft:falling_block',
            'minecraft:tnt',
            'minecraft:fishing_hook',
            'minecraft:item',
            'minecraft:xp_orb',
        ];

        if (excludeTypes.includes(entity.typeId)) return false;

        return (
            entity.getComponent('type_family')?.hasTypeFamily('inanimate') ||
            entity.getComponent('type_family')?.hasTypeFamily('ignore') ||
            inanimateArray.some((e) => e === entity.typeId)
        );
    }

    // Check enchantment level.
    static enchantLevel(item, id) {
        if (!item) return;
        const level = item.getComponent('enchantable')?.getEnchantment(id)?.level;
        return level ?? 0;
    }

    // Check player's mob effect amplifier.
    static effect(player, id) {
        const getEffect = player.getEffect(id);
        return getEffect ? getEffect.amplifier + 1 : 0;
    }

    // Durability reduction code.
    static durability(player, equippableComp, item, stats) {
        if (player.getGameMode() === GameMode.Creative) return;
        const durabilityComp = item?.getComponent('durability');
        if (!durabilityComp || !stats) return;

        const unbreakingLevel = this.enchantLevel(item, 'unbreaking');
        const breakChance = durabilityComp?.getDamageChance(unbreakingLevel);
        const randomizeChance = Math.random() * 100;
        if (breakChance < randomizeChance) return;

        let durabilityModifier = stats?.isWeapon ? 1 : 2;
        durabilityComp.damage = Math.min(
            durabilityComp.damage + durabilityModifier,
            durabilityComp.maxDurability
        );

        const maxDurability = durabilityComp.maxDurability;
        const currentDamage = durabilityComp.damage;
        if (currentDamage >= maxDurability) {
            player.dimension.playSound('random.break', player.location);
            equippableComp.setEquipment('Mainhand', undefined);
        } else if (currentDamage < maxDurability) {
            equippableComp.setEquipment('Mainhand', item);
        }
    }

    // For checking if the player's attack is a critical hit or a sprint knockback hit.
    static specialValid(currentTick, player, stats) {
        const status = player.getStatus();
        const timeSinceLastAttack = currentTick - status.lastAttackTime;
        const cooldownTime = getCooldownTime(player, stats?.attackSpeed).ticks;
        const cooldownPercent = (timeSinceLastAttack / cooldownTime) * 100;
        return cooldownPercent > 84.8;
    }

    // Duh.
    static criticalHit(
        currentTick,
        player,
        target,
        stats,
        { damage, noEffect, forced } = {},
        {
            sound = 'entity.player.attack.crit',
            particle = 'minecraft:critical_hit_emitter',
            offset = { x: 0, y: 0, z: 0 },
            map,
        } = {}
    ) {
        if (
            this.inanimate(target, {
                excludeTypes: ['minecraft:armor_stand'],
            })
        )
            return;
        if (damage <= 0) return;
        const status = player.getStatus();
        const shieldBlock = Check.shieldBlock(currentTick, player, target, stats);
        const dimension = player.dimension.id;

        const isValid =
            (player.isFalling &&
                !player.isOnGround &&
                !player.isInWater &&
                !player.isFlying &&
                !player.isClimbing &&
                !player.isRiding &&
                !this.effect(player, 'blindness') &&
                !this.effect(player, 'slow_falling') &&
                this.specialValid(currentTick, player, stats) &&
                status.critSweepValid &&
                !shieldBlock &&
                forced == undefined) ||
            forced == true;
        if (!noEffect && isValid) {
            target.spawnSelectiveParticle(
                particle,
                target.center({ x: 0, y: 1, z: 0 }),
                "criticalHit",
                offset,
                map
            );
            if (!(target instanceof Player && target.getGameMode() === GameMode.Creative))
                player.playSelectiveSound(sound, "critSound", { location: player.location });
        }
        return isValid;
    }

    // Duh 2
    static sprintKnockback(
        currentTick,
        player,
        target,
        stats,
        { damage, noEffect, forced } = {}
    ) {
        if (
            this.inanimate(target, {
                excludeTypes: [
                    'minecraft:armor_stand',
                    'minecraft:boat',
                    'minecraft:chest_boat',
                    'minecraft:minecart',
                    'minecraft:command_block_minecart',
                    'minecraft:hopper_minecart',
                    'minecraft:tnt_minecart',
                ],
            })
        )
            return;
        if (damage <= 0) return;
        const status = player.getStatus();
        const isValid =
            (this.specialValid(currentTick, player, stats) &&
                status.sprintKnockbackValid &&
                forced == undefined) ||
            forced == true;
        if (isValid && !noEffect) {
            status.sprintKnockbackHitUsed = true;
            player.dimension.playSound('entity.player.attack.knockback', player.location, {
                volume: 0.7,
            });
        }
        return isValid;
    }

    // Duh 2 Epsiode 2
    static sweep(
        currentTick,
        player,
        target,
        stats,
        { fireAspect, damage, level = 1, forced, location, scale = 3 } = {},
        {
            sound = 'entity.player.attack.sweep',
            particle = 'sweepnslash:sweep_particle',
            offset = { x: 0, y: 0, z: 0 },
            pitch,
            volume,
            map,
        } = {}
    ) {
        const debugMode = world.getDynamicProperty('debug_mode');
		const pvp = world.gameRules.pvp;
        const status = player.getStatus();

        if (
            !(
                stats?.sweep &&
                this.specialValid(currentTick, player, stats) &&
                status.critSweepValid
            ) &&
            forced == undefined
        )
            return { swept: false, commonEntities: [] };
        if (
            ((!player.isOnGround || player.isRiding || player.isFasterThanWalk) &&
                forced == undefined) ||
            forced === false
        )
            return { swept: false, commonEntities: [] };

        if (
            this.inanimate(target, {
                excludeTypes: [
                    'minecraft:ender_crystal',
                    'minecraft:armor_stand',
                    'minecraft:boat',
                    'minecraft:chest_boat',
                    'minecraft:minecart',
                    'minecraft:command_block_minecart',
                    'minecraft:hopper_minecart',
                    'minecraft:tnt_minecart',
                ],
            })
        )
            return { swept: false, commonEntities: [] };

        const dist = 1;
        const height = 0.15;

        const pLoc = player.location;
        const tLoc = location ?? target.location;
        const headLoc = player.getHeadLocation();
        const dimension = player.dimension.id;

        const playerCenter = player.dimension.getEntities({
            location: pLoc,
            maxDistance: scale,
        });
        const targetCenter = player.dimension.getEntities({
            location: { x: tLoc.x - scale / 2, y: tLoc.y, z: tLoc.z - scale / 2 },
            volume: { x: scale, y: 0.25, z: scale },
        });

        const commonEntities = playerCenter.filter(
            (entity) =>
                targetCenter.some((targetEntity) => targetEntity === entity) &&
                !this.inanimate(entity, {
                    excludeTypes: ['minecraft:armor_stand', 'minecraft:ender_crystal'],
                }) &&
                entity !== target &&
                entity !== player &&
                entity !== player.getRidingOn() &&
                (!player.getDynamicProperty('excludePetFromSweep') ||
                    (player.getDynamicProperty('excludePetFromSweep') &&
                        !entity.isTamed({ excludeTypes: ['minecraft:trader_llama'] })))
        );

        if (damage == undefined) return { swept: false, commonEntities };
        if (damage <= 0) return { swept: false, commonEntities: [] };

        const rgb = toColor({
            x: player.getDynamicProperty('sweepR') ?? 255,
            y: player.getDynamicProperty('sweepG') ?? 255,
            z: player.getDynamicProperty('sweepB') ?? 255,
        });
        if (!map) {
            map = new MolangVariableMap();
            map.setFloat('variable.size', 1.0);
            map.setColorRGB('variable.color', rgb);
        }

        let particleLocation;
        if (this.view(player) === target || player.inputInfo.lastInputModeUsed !== 'Touch') {
            particleLocation = player.viewRotation(dist, height);
        } else {
            const direction = sub(tLoc, pLoc);
            const magnitude = Math.sqrt(direction.x ** 2 + direction.z ** 2);
            const unitDirection = {
                x: direction.x / magnitude,
                z: direction.z / magnitude,
            };
            particleLocation = {
                x: pLoc.x + unitDirection.x * dist,
                y: (pLoc.y + headLoc.y) / 2 + height,
                z: pLoc.z + unitDirection.z * dist,
            };
        }
        player.spawnSelectiveParticle(particle, location || particleLocation, "sweep", offset, map);
        player.dimension.playSound(sound, pLoc, { pitch : pitch ?? undefined, volume: volume ?? undefined });

        commonEntities.forEach((e) => {
            let dmgType = this.shieldBlock(currentTick, player, e, stats, {
                disable: true,
            })
                ? EntityDamageCause.entityExplosion
                : EntityDamageCause.entityAttack;

            let formula = 1 + damage * (level / (level + 1));

            e.applyDamage(formula, { cause: dmgType, damagingEntity: player });
            try {
				if (e instanceof Player && !pvp) return;
                const fireImmune = e?.getComponent('fire_immune')?.isValid;
                if (!fireImmune) e.setOnFire(fireAspect * 4, true);
            } catch (e) {
                if (debugMode) debug(e + '\n' + 'setOnFire skipped');
            }
        });
        return { swept: true, commonEntities };
    }

    // Also shield angle check.
    static angle(player, target) {
        const viewDir = target.getViewDirection();
        viewDir.y = 0;
        const pLoc = target.location;
        const entities = target.dimension.getEntities({
            location: target.location,
        });
        const inViewEntities = entities.filter((entity) => {
            const eLoc = entity.location;
            const toEntityVec = sub(eLoc, pLoc);
            toEntityVec.y = 0;
            const angle = calculateAngle(viewDir, toEntityVec);
            return angle >= -90 && angle <= 90;
        });
        return inViewEntities.some((e) => player === e);
    }

    // Shield valid check.
    static shield(target) {
        const slot = ['Mainhand', 'Offhand'];
        const targetEquippable = target.getComponent('equippable');
        const shieldCooldown = target.getItemCooldown('minecraft:shield');

        let isBlocking = false;

        for (const s of slot) {
            const shieldItem = targetEquippable?.getEquipment(s)?.typeId === 'minecraft:shield'; // Check if the target is sneaking and shield cooldown is 0
            if (shieldItem && (target.isSneaking || target.isRiding) && shieldCooldown == 0) {
                isBlocking = true;
            }
        }

        return isBlocking;
    }

    // For handling shield block. Refer to class.js
    // Also disables the shield if the attacker has an axe
    static shieldBlock(currentTick, player, target, stats, { disable = false } = {}) {
        const status = target.getStatus();
        let angle = false;
        let specialValid = true;

        if (target instanceof Player && target.getGameMode() == GameMode.Creative) return false;

        if (world.getDynamicProperty('shieldBreakSpecial') && player instanceof Player)
            specialValid = Check.specialValid(currentTick, player, stats);

        if (status.shieldValid) {
            angle = this.angle(player, target);
            if (stats?.disableShield && angle && specialValid && disable) {
                target.startItemCooldown('minecraft:shield', 100);
                player.dimension.playSound('random.break', target.location);
            }
        }
        return angle;
    }

    // Self explanatory
    static calculateDamage(
        player,
        target,
        item,
        stats,
        currentTick,
        timeSinceLastAttack,
        baseDamage,
        attackSpeed,
        { damageTest = false, critAttack, critMul, cancel, attackSpeedTicks } = {}
    ) {
        let T = getCooldownTime(player, attackSpeed).ticks;
        if (damageTest === true && attackSpeedTicks) T = attackSpeedTicks;
        const t = Math.min(timeSinceLastAttack, T);
        const crit =
            this.criticalHit(currentTick, player, target, stats, {
                noEffect: true,
                forced: critAttack,
            }) && target.typeId != 'minecraft:ender_dragon'
                ? critMul ?? 1.5
                : 1;

        // damage multiplier = 0.2 + ((t + 0.5) / T) ^ 2 * 0.8
        let multiplier = 0.2 + Math.pow((t + 0.5) / T, 2) * 0.8;
        // clamp multiplier to the range 0.2 ~ 1
        multiplier = clampNumber(multiplier, 0.2, 1);

        const familyArray = ['undead', 'arthropod'];
        const enchantArray = ['smite', 'bane_of_arthropods'];

        const targetFamily = target.getComponent('type_family');

        let enchantBonus = 0;
        let enchantDamage = 0;
        let enchantedHit = false;

        // Enchantment damage bonus calculation, based on target's family
        familyArray.forEach((family, index) => {
            if (targetFamily?.hasTypeFamily(family)) {
                const enchantLevel = this.enchantLevel(item, enchantArray[index]);
                if (enchantLevel > 0) {
                    enchantBonus += enchantLevel * 2.5;
                }
            }
        });

        let sharpnessLevel = this.enchantLevel(item, 'sharpness');
        let impalingLevel = this.enchantLevel(item, 'impaling');
        const strengthModifier = this.effect(player, 'strength') * 3;
        const weaknessModifier = this.effect(player, 'weakness') * 4;

        if (sharpnessLevel > 0) {
            if (sharpnessLevel !== 1) sharpnessLevel = 0.5 * sharpnessLevel + 0.5;
            enchantBonus += sharpnessLevel;
            // Credits to LimonMirbon for pointing out sharpness damage!
        }

        const isInRain =
            !target.isUnderground &&
            target.dimension.getWeather() !== 'Clear' &&
            !biomeArray.includes(target.dimension.getBiome(target.location)?.id);

        if (impalingLevel > 0 && (target.isInWater || isInRain)) {
            impalingLevel = impalingLevel * 2.5;
            enchantBonus += impalingLevel;
        }

        if (cancel) return 0;

        if (
            enchantBonus > 0 &&
            !this.inanimate(target, {
                excludeTypes: [
                    'minecraft:armor_stand',
                    'minecraft:boat',
                    'minecraft:chest_boat',
                    'minecraft:minecart',
                    'minecraft:command_block_minecart',
                    'minecraft:hopper_minecart',
                    'minecraft:tnt_minecart',
                ],
            })
        ) {
            if (!damageTest) enchantedHit = true;
        }

        if (enchantBonus > 0) enchantDamage = enchantBonus * Math.min((t + 0.5) / T, 1);

        if (enchantBonus > 0 && weaknessModifier) {
            player.removeEffect('weakness');
            //player.onScreenDisplay.setActionBar("There is a bug where attacking with sharpness or any damage bonus enchantments\nweapons while having weakness effect bugs out the vanilla combat.\nThis is unfortunately not fixable. Sorry!")
        }

        const damage =
            (baseDamage + (strengthModifier - weaknessModifier)) * crit * multiplier +
            enchantDamage;
        const rawDamage = baseDamage * crit;

        return { damage, rawDamage, enchantedHit };
    }

    // Final damage calculation.
    static finalDamageCalculation(
        currentTick,
        player,
        target,
        item,
        stats,
        { damage, critAttack, critMul, cancel }
    ) {
        const status = player.getStatus();
        const attackSpeed = stats?.attackSpeed || 4;
        const baseDamage = damage ?? (stats?.damage || 1);
        const lastAttackTime = status.lastAttackTime;
        const timeSinceLastAttack = currentTick - lastAttackTime;

        const calculateDamage = this.calculateDamage(
            player,
            target,
            item,
            stats,
            currentTick,
            timeSinceLastAttack,
            baseDamage,
            attackSpeed,
            { critAttack, critMul, cancel }
        );

        const final = Math.max(0, calculateDamage.damage);
        const raw = Math.max(0, calculateDamage.rawDamage);
        const enchantedHit = calculateDamage.enchantedHit;

        return { final, raw, enchantedHit };
    }

    static view(player) {
        const targetEntity = player.getEntitiesFromViewDirection({
            maxDistance: 3,
            excludeTypes: [
                'item',
                'xp_orb',
                'arrow',
                'ender_pearl',
                'snowball',
                'egg',
                'painting',
                'tnt',
                'fishing_hook',
                'falling_block',
                'ender_crystal',
            ],
        })[0]?.entity;

        if (
            targetEntity &&
            this.inanimate(targetEntity, { excludeTypes: ['minecraft:armor_stand'] })
        ) {
            return null;
        }

        return targetEntity;
    }

    static block(player) {
        return player.getBlockFromViewDirection({
            maxDistance: 8,
            includeLiquidBlocks: false,
        });
    }

    static damageTest(player) {
        const debugMode = world.getDynamicProperty('debug_mode');
        let damageLog = [];

        const { item, stats } = player.getItemStats() || {};
        const baseDamage = stats?.damage || 1;
        const currentTick = 0;
        const attackSpeed = stats?.attackSpeed || 4;
        const attackSpeedTicks = Math.round(getCooldownTime(player, attackSpeed).baseSpeed);

        for (let t = 0; t <= attackSpeedTicks; t++) {
            const damage = this.calculateDamage(
                player,
                player,
                item,
                stats,
                currentTick,
                t,
                baseDamage,
                attackSpeed,
                { damageTest: true, attackSpeedTicks }
            ).damage;
            damageLog.push(
                `§f[ §a${t} (${Math.round(
                    (t * 100) / attackSpeedTicks
                )}%) §f| §c${damage.toFixed(2)} §f| §e${(damage / (t / 20)).toFixed(2)} (${(
                    damage / Math.max(0.5, t / 20)
                ).toFixed(2)}) §f]`
            );
        }

        if (debugMode)
            debug(
                `${item?.typeId || 'hand'} ${
                    stats || item == undefined ? '' : '§c(Weapon stats not found)§f'
                }\n[ §aTicks §f| §cDamage §f| §eDPS (with iframes) §f]\n§e${damageLog.join(
                    '\n'
                )}`
            );
    }
}
