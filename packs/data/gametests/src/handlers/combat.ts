import {
    EntityDamageCause,
    EntitySwingSource,
    GameMode,
    Player,
    system,
    world,
} from '@minecraft/server';
import { getStatus, setAttackCooldown, setLastShieldTime } from '../shared/status.ts';
import { isTeam } from '../shared/team.ts';
import { getItemStats } from '../stats/item.ts';
import { Debug } from '../shared/debug.ts';
import { shieldBlock } from '../combat/shields.ts';
import { AttackCooldownManager } from '../combat/cooldown.ts';
import { playerHitMap, lastAttackMap, rawDamageMap } from '../shared/entityState.ts';
import { healthParticle } from '../ui/particles.ts';

export function registerCombatHandlers(): void {
    world.afterEvents.playerSwingStart.subscribe(({ player, swingSource }) => {
        if (world.getDynamicProperty('addon_toggle') == false) return;

        const shieldCooldown = player.getItemCooldown('minecraft:shield');
        player.startItemCooldown('minecraft:shield', shieldCooldown ? shieldCooldown : 5);
        setLastShieldTime(player, system.currentTick);

        if (swingSource !== EntitySwingSource.Attack) return;
        AttackCooldownManager.forPlayer(player).onSwing();
    });

    world.afterEvents.entityHitEntity.subscribe(
        ({ damagingEntity: player, hitEntity: target }) => {
            if (world.getDynamicProperty('addon_toggle') == false) return;

            const currentTick = system.currentTick;
            const status = getStatus(player);

            if (!(player instanceof Player)) {
                const { stats } = getItemStats(player as any);
                const shieldBlocked = shieldBlock(currentTick, player, target, stats);
                if (shieldBlocked) player.applyKnockback({ x: 0, z: 0 }, 0);
                return;
            }

            status.leftClick = true;

            if (isTeam(player, target)) return;

            if (target?.isValid && player.getComponent('health')?.currentValue! > 0)
                AttackCooldownManager.forPlayer(player).onHit(target);
        },
    );

    world.afterEvents.entityHurt.subscribe(({ damageSource, hurtEntity, damage }) => {
        if (!hurtEntity?.isValid) return;
        if (world.getDynamicProperty('addon_toggle') == false) return;

        const currentTick = system.currentTick;
        const player = damageSource.damagingEntity;

        if (!player && damageSource.cause !== EntityDamageCause.override && damage >= 0) {
            try {
                if (!playerHitMap.get(hurtEntity.id))
                    hurtEntity.applyKnockback({ x: 0, z: 0 }, hurtEntity.getVelocity().y);
            } catch (e) {
                Debug.error('Error during knockback:', e);
            }
        }

        playerHitMap.set(hurtEntity.id, false);

        if (player instanceof Player) {
            if (damageSource.cause === EntityDamageCause.entityAttack) {
                lastAttackMap.set(hurtEntity.id, {
                    rawDamage: rawDamageMap.get(player.id) ?? damage,
                    damage,
                    time: currentTick,
                });
                healthParticle(hurtEntity, damage);
            } else if (damageSource.cause === EntityDamageCause.maceSmash) {
                healthParticle(hurtEntity, damage);
            } else {
                lastAttackMap.set(hurtEntity.id, {
                    rawDamage: damage,
                    damage,
                    time: currentTick,
                });
            }
        } else {
            lastAttackMap.set(hurtEntity.id, { rawDamage: damage, damage, time: currentTick });
        }
    });

    world.beforeEvents.entityHurt.subscribe((ev) => {
        if (world.getDynamicProperty('addon_toggle') == false) return;

        const { damageSource, hurtEntity } = ev;
        const damagingEntity = damageSource?.damagingEntity;

        if (!damagingEntity || !hurtEntity?.isValid) return;

        if (isTeam(damagingEntity, hurtEntity)) {
            ev.cancel = true;
        }
    });

    world.afterEvents.entityHitBlock.subscribe(({ damagingEntity: player }) => {
        if (!(player instanceof Player)) return;
        if (world.getDynamicProperty('addon_toggle') == false) return;
        if (player.getGameMode() === GameMode.Creative) return;

        setLastShieldTime(player, system.currentTick);
        setAttackCooldown(player, system.currentTick);
    });
}
