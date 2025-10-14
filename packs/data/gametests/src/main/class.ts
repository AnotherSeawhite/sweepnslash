import { world, system, Player, GameMode, EntityDamageCause } from '@minecraft/server';
import * as mc from '@minecraft/server';
import { debug, Check, getCooldownTime } from './mathAndCalculations.js';

export class CombatManager {
    static attack(eventData: { player: Player; target: mc.Entity; currentTick: number }) {
        const { player, target, currentTick } = eventData;

        const debugMode = world.getDynamicProperty('debug_mode');

        const status = player.getStatus();
        let loc = player.location;
        let targetLoc = target.location;

        const { equippableComp, item, stats } = player.getItemStats() || {};
        const baseDamage = stats?.damage || 1;
        let regularKBDistance = stats?.regularKnockback ?? 1.552;
        let enchantedKBDistance = stats?.enchantedKnockback ?? 2.586;
		let regularVerticalKBHeight = stats?.regularVerticalKnockback ?? 0.7955;
		let enchantedVerticalKBHeight = stats?.enchantedVerticalKnockback ?? 1;
        const maxCD = Math.round(getCooldownTime(player, stats?.attackSpeed).ticks);
        const curCD = status.cooldown;
        let cooldown = (maxCD - curCD) / maxCD; // Attack charge (0~1)
        cooldown = isNaN(cooldown) ? 1 : cooldown;

        let hit = false;
        let dmg = baseDamage;
        let crit = Check.criticalHit(currentTick, player, target, stats, {
            noEffect: true,
        });
        let sprintKnockback = Check.sprintKnockback(currentTick, player, target, stats, {
            noEffect: true,
        });
        let sweep = Check.sweep(currentTick, player, target, stats);
        let specialCheck = Check.specialValid(currentTick, player, stats);

        // Iframes check
        const lastAttack = target.__lastAttack || {
            rawDamage: 0,
            damage: 0,
            time: 0,
        };
        const timeElapsed = currentTick - lastAttack.time;
        const timeValid = timeElapsed >= 10;

        const beforeEffect =
            stats?.beforeEffect?.({
                mc,
                system,
                world,
                player,
                target,
                item,
                dmg,
                specialCheck,
                sweptEntities: sweep?.commonEntities,
                crit,
                sprintKnockback,
                cooldown,
                iframes: !timeValid,
            }) || {};

        regularKBDistance = beforeEffect?.regularKnockback ?? regularKBDistance;
        enchantedKBDistance = beforeEffect?.enchantedKnockback ?? enchantedKBDistance;
		regularVerticalKBHeight = beforeEffect?.regularVerticalKnockback ?? regularVerticalKBHeight;
		enchantedVerticalKBHeight = beforeEffect?.enchantedVerticalKnockback ?? enchantedVerticalKBHeight;

        // Damage calculation, reapply checks with updated damage
        dmg = Check.finalDamageCalculation(currentTick, player, target, item, stats, {
            damage: beforeEffect?.dmg,
            critAttack: beforeEffect?.critAttack,
            critMul: beforeEffect?.critMultiplier,
            cancel: beforeEffect?.cancel,
        });

        crit = Check.criticalHit(
            currentTick,
            player,
            target,
            stats,
            {
                damage: dmg.final,
                forced: beforeEffect?.critAttack,
            },
            {
                particle: beforeEffect?.critParticle,
                offset: beforeEffect?.critOffset,
                map: beforeEffect?.critMap,
            }
        );

        sprintKnockback = Check.sprintKnockback(currentTick, player, target, stats, {
            damage: dmg.final,
            forced: beforeEffect?.sprintKnockback,
        });

        const fireAspect = Check.enchantLevel(item, 'fire_aspect');
        const inanimate = Check.inanimate(target, {
            excludeTypes: ['minecraft:armor_stand'],
        });
        const knockback =
            (Check.enchantLevel(item, 'knockback') ?? 0) + (sprintKnockback ? 1 : 0);

        /*
			Checks for target's shield and attacker's axe
			Fun fact: entityAttack damage cause can knockback the damagingEntity(attacker)
			if the victim is holding a shield and has their view towards the attacker.
			Also the victim's shield can be disabled if the attacker is holding an axe.
			And for some reason, entityExplosion damage cause behaves the same as entityAttack,
			except it doesn't knockback the attacker nor checks for axe and
			disable the shield.
		*/

        player.startItemCooldown(
            'minecraft:shield',
            player.getItemCooldown('minecraft:shield') || 1
        );
        status.lastShieldTime = currentTick;
        const shieldBlock = Check.shieldBlock(currentTick, player, target, stats, {
            disable: true,
        });
        const dmgType = shieldBlock ? EntityDamageCause.entityExplosion : EntityDamageCause.entityAttack;

        // Knockback calculation
        const applyKnockback = (knockbackLevel, pLoc, tLoc, rot) => {
            const knockbackValid = knockbackLevel > 0;

            const knockbackX = knockbackValid
                ? Math.max(0.552 + enchantedKBDistance * knockbackLevel, 0)
                : Math.max(regularKBDistance, 0);
            const dirX = knockbackValid ? -Math.sin(rot.y * (Math.PI / 180)) : tLoc.x - pLoc.x;
            const dirZ = knockbackValid ? Math.cos(rot.y * (Math.PI / 180)) : tLoc.z - pLoc.z;
            const length = Math.sqrt(dirX ** 2 + dirZ ** 2) || 1; // Avoid division by zero

            const knockbackY = target.isOnGround ? (knockbackValid ? enchantedVerticalKBHeight : regularVerticalKBHeight) : 0;
            target.applyAttackKnockback(
                {
                    x: tLoc.x + (dirX / length) * knockbackX,
                    y: tLoc.y,
                    z: tLoc.z + (dirZ / length) * knockbackX,
                },
                knockbackY
            );
        };

		const hitSound = (boolean, loc) => {
            const sound = () => {
                const sounds = [];

                if (!crit && !sweep?.swept) {
                    const id = boolean
                        ? 'game.player.attack.strong.se'
                        : 'game.player.attack.weak.se';

                    sounds.push({ id });
                }

                if (boolean) {
                    if (sweep?.swept) {
                        sounds.push({
                            id: beforeEffect?.sweepSound ?? 'entity.player.attack.sweep',
                            soundOptions: {
                                pitch: beforeEffect?.sweepPitch ?? undefined,
                                volume: beforeEffect?.sweepVolume ?? undefined,
                            },
                        });
                    }

                    if (crit) {
                        sounds.push({
                            id: beforeEffect?.critSound ?? 'entity.player.attack.crit',
                        });
                    }
                }

                return sounds;
            };

            for (const s of sound()) {
                player.dimension.playSound(s.id, loc, s.soundOptions);
            }

            if (sprintKnockback) {
                player.dimension.playSound('entity.player.attack.knockback', loc, {
                    volume: 0.7,
                });
            }
        };

        player.__rawDamage = dmg.raw;
        target.__playerHit = true;

        const iframes =
            (timeValid || (dmg.raw > lastAttack.rawDamage && dmg.final > lastAttack.damage)) &&
            !(target instanceof Player && target.getGameMode() == GameMode.Creative);
        if (iframes) {
            // Apply sweeping
            sweep = Check.sweep(
                currentTick,
                player,
                target,
                stats,
                {
                    fireAspect,
                    damage: dmg.final,
                    level: beforeEffect?.sweepLevel,
                    forced: beforeEffect?.sweep,
                    location: beforeEffect?.sweepLocation,
                    scale: beforeEffect?.sweepRadius,
                },
                {
                    particle: beforeEffect?.sweepParticle,
                    offset: beforeEffect?.sweepOffset,
                    map: beforeEffect?.sweepMap,
                }
            );

            // Apply damage

            const damageValid =
                status.mace === true && player.isFalling
                    ? false
                    : target.applyDamage(dmg.final, {
                          cause: dmgType,
                          damagingEntity: player,
                      });
            hit = damageValid;

            loc = player.location;
            if (target.isValid) targetLoc = target.location;

            // Durability check, reduces durability if eligible
            if (
                status.mace === false &&
                !inanimate &&
                dmg.final > 0
            ) {
                if (player.getGameMode() !== GameMode.Creative) {
                    player.setExhaustion(player.getExhaustion() + 0.1);
                }
                if (!beforeEffect?.cancelDurability && target?.typeId !== "minecraft:shulker_bullet") Check.durability(player, equippableComp, item, stats);
            }

            // Apply knockback
            if (damageValid && !shieldBlock) {
                try {
                    if (timeValid || knockback) {
                        applyKnockback(knockback, loc, targetLoc, player.getRotation());
                    } else {
                        const vel = target.getVelocity();
                        target.applyKnockback({ x: vel.x, z: vel.z }, vel.y);
                    }
                } catch (e) {
                    if (debugMode)
                        debug('Error during knockback: ' + e + ', knockback skipped');
                }
            }

            if (dmg.final > 0) {
                if (dmg.enchantedHit)
                    target?.spawnSelectiveParticle(
                      "sweepnslash:magic_critical_hit_emitter",
                      target?.center({ x: 0, y: 1, z: 0 }),
                      "enchantedHit"
                    );
				hitSound(specialCheck, loc);
            }
        } else {
            if (dmg.final > 0)
                hitSound(false, loc);
        }

        if (debugMode) {
            debug(`${player.name}'s §pDamage result:
§f- Attacked with:§e ${item?.typeId ?? 'hand'} ${
                stats || item == undefined ? '' : '§c(Weapon stats not found)'
            }
§f- Attempted damage: §e${dmg.final.toFixed(2)} (${(cooldown * 100).toFixed(0)}%) ${
                specialCheck ? '§a+' : ''
            } ${iframes ? '' : '(iframes immunity)'}
§f- Ticks since last attack: §e${currentTick - status.lastAttackTime}`);
        }

        // Update last attack time for cooldown
        if (dmg.final >= 0) status.lastAttackTime = currentTick;

        // Run script effect if exists
        if (stats?.script) {
            system.run(() => {
                stats.script({
                    mc,
                    system,
                    world,
                    player,
                    target,
                    item,
                    sweptEntities: sweep?.commonEntities,
                    dmg,
                    hit,
                    shieldBlock,
                    specialCheck,
                    crit,
                    sprintKnockback,
                    inanimate,
                    cooldown,
                });
            });
        }
    }
}
