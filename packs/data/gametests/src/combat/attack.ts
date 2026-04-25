import { EntityDamageCause, GameMode, Player, world } from '@minecraft/server';
import * as mc from '@minecraft/server';
import { system } from '@minecraft/server';
import { Debug } from '../shared/debug.ts';
import { getStatus, setAttackCooldown, setLastShieldTime } from '../shared/status.ts';
import { isTeam } from '../shared/team.ts';
import { getItemStats, hasItemFlag } from '../stats/item.ts';
import { getEntityStats } from '../stats/entity.ts';
import { getHunger, getSaturation, getExhaustion, setExhaustion } from '../food/accessors.ts';
import { spawnSelectiveParticle } from '../ui/particles.ts';
import { applyAttackKnockback } from './knockback.ts';
import {
    criticalHit,
    sprintKnockback as sprintKnockbackCheck,
    specialValid,
    inanimate,
    enchantLevel,
    durability,
} from './checks.ts';
import { finalDamageCalculation, getCooldownTime } from './damage.ts';
import { sweep } from './sweep.ts';
import { shieldBlock } from './shields.ts';
import { Sounds } from '../Files.ts';
import { lastAttackMap, playerHitMap, rawDamageMap } from '../shared/entityState.ts';

export class CombatManager {
    static attack(eventData: { player: Player; target: mc.Entity; currentTick: number }) {
        const { player, target, currentTick } = eventData;

        const status = getStatus(player);
        const targetStats = getEntityStats(target);
        let loc = player.location;
        let targetLoc = target.location;

        const { equippableComp, item, stats } = getItemStats(player);
        const baseDamage = stats?.damage || 1;
        let regularKBDistance = stats?.regularKnockback ?? 1.552;
        let enchantedKBDistance = stats?.enchantedKnockback ?? 2.586;
        let regularVerticalKBHeight = stats?.regularVerticalKnockback ?? 0.7955;
        let enchantedVerticalKBHeight = stats?.enchantedVerticalKnockback ?? 1;
        const maxCD = Math.round(getCooldownTime(player, stats?.attackSpeed).ticks);
        const curCD = status.cooldown;
        let cooldown = isNaN((maxCD - curCD) / maxCD) ? 1 : (maxCD - curCD) / maxCD;

        let hit = false;
        let dmg = baseDamage;
        let crit = criticalHit(currentTick, player, target, stats);
        let sprintKB = sprintKnockbackCheck(currentTick, player, target, stats, {
            noEffect: true,
        });
        let swp = sweep(currentTick, player, target, stats);
        const specialCheck = specialValid(currentTick, player, stats);

        const lastAttack = lastAttackMap.get(target.id) ?? { rawDamage: 0, damage: 0, time: 0 };
        const timeElapsed = currentTick - lastAttack.time;
        const timeValid = timeElapsed >= 10;

        // Build utils object for beforeEffect/script callbacks
        const utils = {
            getStatus,
            getItemStats,
            hasItemFlag,
            getEntityStats,
            isTeam,
            getHunger,
            getSaturation,
            getExhaustion,
            getLastAttack: (entity: mc.Entity) => lastAttackMap.get(entity.id),
        };

        const beforeEffect =
            stats?.beforeEffect?.({
                mc,
                system,
                world,
                player,
                target,
                item: item!,
                dmg,
                specialCheck,
                sweptEntities: swp?.commonEntities,
                crit,
                sprintKnockback: sprintKB,
                cooldown,
                iframes: !timeValid,
                utils,
            }) || {};

        regularKBDistance = (beforeEffect as any)?.regularKnockback ?? regularKBDistance;
        enchantedKBDistance = (beforeEffect as any)?.enchantedKnockback ?? enchantedKBDistance;
        regularVerticalKBHeight =
            (beforeEffect as any)?.regularVerticalKnockback ?? regularVerticalKBHeight;
        enchantedVerticalKBHeight =
            (beforeEffect as any)?.enchantedVerticalKnockback ?? enchantedVerticalKBHeight;

        const dmgResult = finalDamageCalculation(currentTick, player, target, item, stats, {
            damage: (beforeEffect as any)?.dmg,
            critAttack: (beforeEffect as any)?.critAttack,
            critMul: (beforeEffect as any)?.critMultiplier,
            cancel: (beforeEffect as any)?.cancel,
        });

        crit = criticalHit(currentTick, player, target, stats, {
            damage: dmgResult.final,
            forced:
                (beforeEffect as any)?.critAttack === true
                    ? true
                    : targetStats?.canTakeCrits !== false
                      ? (beforeEffect as any)?.critAttack
                      : false,
        });

        sprintKB = sprintKnockbackCheck(currentTick, player, target, stats, {
            damage: dmgResult.final,
            forced: (beforeEffect as any)?.sprintKnockback,
        });

        const fireAspect = enchantLevel(item, 'fire_aspect');
        const inanimateTarget = inanimate(target, { excludeTypes: ['minecraft:armor_stand'] });
        const knockback = (enchantLevel(item, 'knockback') ?? 0) + (sprintKB ? 1 : 0);

        setLastShieldTime(player, currentTick);
        player.startItemCooldown(
            'minecraft:shield',
            player.getItemCooldown('minecraft:shield') || 1,
        );
        const shieldBlocked = shieldBlock(currentTick, player, target, stats, {
            disable: true,
        });
        const dmgType = shieldBlocked
            ? EntityDamageCause.entityExplosion
            : EntityDamageCause.entityAttack;

        const applyKnockback = (knockbackLevel: number, pLoc: any, tLoc: any, rot: any) => {
            const knockbackValid = knockbackLevel > 0;
            const knockbackX = knockbackValid
                ? Math.max(
                      (0.552 + enchantedKBDistance * knockbackLevel) *
                          (targetStats?.enchantedKnockbackTakeMultiplier ?? 1),
                      0,
                  )
                : Math.max(
                      regularKBDistance * (targetStats?.regularKnockbackTakeMultiplier ?? 1),
                      0,
                  );
            const dirX = knockbackValid ? -Math.sin(rot.y * (Math.PI / 180)) : tLoc.x - pLoc.x;
            const dirZ = knockbackValid ? Math.cos(rot.y * (Math.PI / 180)) : tLoc.z - pLoc.z;
            const length = Math.sqrt(dirX ** 2 + dirZ ** 2) || 1;
            const knockbackY = target.isOnGround
                ? knockbackValid
                    ? enchantedVerticalKBHeight *
                      (targetStats?.enchantedKnockbackTakeMultiplier ?? 1)
                    : regularVerticalKBHeight *
                      (targetStats?.regularKnockbackTakeMultiplier ?? 1)
                : 0;
            applyAttackKnockback(
                target,
                {
                    x: tLoc.x + (dirX / length) * knockbackX,
                    y: tLoc.y,
                    z: tLoc.z + (dirZ / length) * knockbackX,
                },
                knockbackY,
            );
        };

        const hitSound = (strong: boolean, swept: boolean, critHit: boolean, loc2: any) => {
            const sounds: { id: string; soundOptions?: any }[] = [];
            if (!critHit && !swept) {
                const id = strong
                    ? ((beforeEffect as any)?.strongHitSound ?? Sounds.GamePlayerAttackStrongSe)
                    : ((beforeEffect as any)?.weakHitSound ?? Sounds.GamePlayerAttackWeakSe);
                sounds.push({ id });
            }
            if (swept) {
                sounds.push({
                    id: (beforeEffect as any)?.sweepSound ?? Sounds.EntityPlayerAttackSweep,
                    soundOptions: {
                        pitch: (beforeEffect as any)?.sweepPitch,
                        volume: (beforeEffect as any)?.sweepVolume,
                    },
                });
            }
            if (critHit) {
                sounds.push({
                    id: (beforeEffect as any)?.critSound ?? Sounds.EntityPlayerAttackCrit,
                });
            }
            for (const s of sounds) {
                player.dimension.playSound(s.id, loc2, s.soundOptions);
            }
            if (sprintKB) {
                player.dimension.playSound(Sounds.EntityPlayerAttackKnockback, loc2, {
                    volume: 0.7,
                });
            }
        };

        rawDamageMap.set(player.id, dmgResult.raw);
        playerHitMap.set(target.id, true);

        const iframes =
            (timeValid ||
                (dmgResult.raw > lastAttack.rawDamage &&
                    dmgResult.final > lastAttack.damage)) &&
            !(target instanceof Player && target.getGameMode() == GameMode.Creative);

        if (iframes) {
            swp = sweep(
                currentTick,
                player,
                target,
                stats,
                {
                    fireAspect,
                    damage: dmgResult.final,
                    level: (beforeEffect as any)?.sweepLevel,
                    forced: (beforeEffect as any)?.sweep,
                    location: (beforeEffect as any)?.sweepLocation,
                    scale: (beforeEffect as any)?.sweepRadius,
                },
                {
                    particle: (beforeEffect as any)?.sweepParticle,
                    offset: (beforeEffect as any)?.sweepOffset,
                    map: (beforeEffect as any)?.sweepMap,
                },
            );

            if (dmgResult.final > 0) {
                if (crit) {
                    const tHead = target.getHeadLocation();
                    const tLoc2 = target.location;
                    const entityOffset = getEntityStats(target)?.centerOffset ?? {
                        x: 0,
                        y: 0,
                        z: 0,
                    };
                    const center = {
                        x: tLoc2.x + entityOffset.x,
                        y: (tLoc2.y + tHead.y) / 2 + 1 + entityOffset.y,
                        z: tLoc2.z + entityOffset.z,
                    };
                    spawnSelectiveParticle(
                        target,
                        (beforeEffect as any)?.critParticle ?? 'minecraft:critical_hit_emitter',
                        center,
                        'criticalHit',
                        (beforeEffect as any)?.critOffset ?? { x: 0, y: 0, z: 0 },
                        (beforeEffect as any)?.critMap,
                    );
                }
                if (dmgResult.enchantedHit) {
                    const tHead = target.getHeadLocation();
                    const tLoc2 = target.location;
                    const entityOffset = getEntityStats(target)?.centerOffset ?? {
                        x: 0,
                        y: 0,
                        z: 0,
                    };
                    const center = {
                        x: tLoc2.x + entityOffset.x,
                        y: (tLoc2.y + tHead.y) / 2 + 1 + entityOffset.y,
                        z: tLoc2.z + entityOffset.z,
                    };
                    spawnSelectiveParticle(
                        target,
                        'sweepnslash:magic_critical_hit_emitter',
                        center,
                        'enchantedHit',
                    );
                }
                hitSound(specialCheck, swp?.swept, crit, loc);
            }

            const damageValid =
                status.mace === true && player.isFalling
                    ? false
                    : target.applyDamage(dmgResult.final, {
                          cause: dmgType,
                          damagingEntity: player,
                      });
            hit = damageValid;

            loc = player.location;
            if (target.isValid) targetLoc = target.location;

            if (status.mace === false && !inanimateTarget && dmgResult.final > 0) {
                if (player.getGameMode() !== GameMode.Creative) {
                    const exhaustion = getExhaustion(player) ?? 0;
                    setExhaustion(player, exhaustion + 0.1);
                }
                if (
                    !(beforeEffect as any)?.cancelDurability &&
                    targetStats?.damageItem !== false
                )
                    durability(player, equippableComp, item!, stats);
            }

            if (damageValid && !shieldBlocked) {
                try {
                    if (timeValid || knockback) {
                        applyKnockback(knockback, loc, targetLoc, player.getRotation());
                    } else {
                        const vel = target.getVelocity();
                        target.applyKnockback({ x: vel.x, z: vel.z }, vel.y);
                    }
                } catch (e) {
                    Debug.error('Error during knockback:', e);
                }
            }
        } else {
            if (dmgResult.final > 0) hitSound(false, false, false, loc);
        }

        Debug.ifEnabled(() =>
            Debug.info(
                `${player.name}'s §pDamage result:\n§f- Attacked with:§e ${item?.typeId ?? 'hand'} ${stats || item == undefined ? '' : '§c(Weapon stats not found)'}\n§f- Attempted damage: §e${dmgResult.final.toFixed(2)} (${(cooldown * 100).toFixed(0)}%) ${specialCheck ? '§a+' : ''} ${iframes ? '' : '(iframes immunity)'}\n§f- Ticks since last attack: §e${currentTick - status.lastAttackTime}`,
            )
        );

        if (dmgResult.final >= 0) setAttackCooldown(player, currentTick);

        if (stats?.script) {
            system.run(() => {
                stats!.script!({
                    mc,
                    system,
                    world,
                    player,
                    target,
                    item: item!,
                    sweptEntities: swp?.commonEntities,
                    dmg: dmgResult.final,
                    hit,
                    shieldBlock: shieldBlocked,
                    specialCheck,
                    crit,
                    sprintKnockback: sprintKB,
                    inanimate: inanimateTarget,
                    cooldown,
                    utils,
                });
            });
        }
    }
}
