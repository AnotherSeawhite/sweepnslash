const VERSION = '2.7.0';

import {
    Difficulty,
    EntityDamageCause,
    GameMode,
    Player,
    system,
    world,
} from '@minecraft/server';
import { initWorldProperties, initPlayerProperties } from './config/init.ts';
import { registerConfigCommand } from './config/form.ts';
import { inventoryAddLore } from './shared/lore.ts';
import { isTeam } from './shared/team.ts';
import { getStatus, setAttackCooldown, setLastShieldTime } from './shared/status.ts';
import { getItemStats, itemHasFlag } from './stats/item.ts';
import { debug } from './shared/math.ts';
import { damageTest } from './combat/checks.ts';
import { healthParticle } from './ui/particles.ts';
import { tickIndicator } from './ui/indicator.ts';
import { tickFood } from './food/index.ts';
import { AttackCooldownManager } from './combat/cooldown.ts';
import { shieldBlock } from './combat/shields.ts';
import { applyImpulseAsKnockback } from './combat/knockback.ts';
import { Sounds } from './Files.ts';
import { playerHitMap, lastAttackMap, rawDamageMap } from './shared/entityState.ts';

// Gametest module import
let SimulatedPlayer: any;
let gametest = true;
import('@minecraft/server-gametest')
    .then((module) => {
        SimulatedPlayer = module.SimulatedPlayer;
    })
    .catch(() => {
        gametest = false;
    });

// Custom component registry
system.beforeEvents.startup.subscribe(({ itemComponentRegistry }) => {
    itemComponentRegistry.registerCustomComponent('sweepnslash:stats', {});
});

// Config command registration
system.beforeEvents.startup.subscribe((init) => {
    registerConfigCommand(init);
});

// World load
world.afterEvents.worldLoad.subscribe(() => {
    system.run(() =>
        console.log(
            `\n§3Sweep §f'N §6Slash §fhas been loaded!\nVersion: v${VERSION}${gametest ? '-gametest' : ''}`,
        ),
    );
    initWorldProperties();
    system.sendScriptEvent(
        'sweep-and-slash:toggle',
        `${world.getDynamicProperty('addon_toggle')}`,
    );
});

// Player first spawn
world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    if (initialSpawn) {
        if (
            player.getDynamicProperty('tipMessage') === undefined ||
            player.getDynamicProperty('tipMessage')
        )
            player.sendMessage({
                rawtext: [
                    { translate: 'sweepnslash.tip.message', with: ['/sns:config'] },
                    { text: '\n' },
                    {
                        translate: 'sweepnslash.tip.version',
                        with: [`v${VERSION}${gametest ? '-gametest' : ''}`],
                    },
                ],
            });
        initPlayerProperties(player);
    }
    // Reset attack cooldown on (re)spawn
    setAttackCooldown(player, system.currentTick);
});

// Main interval: status checks, UI, food
system.runInterval(() => {
    const addonToggle = world.getDynamicProperty('addon_toggle') as boolean;
    const saturationHealing = world.getDynamicProperty('saturationHealing') as boolean;
    const isPeaceful = world.getDifficulty() === Difficulty.Peaceful;
    const currentTick = system.currentTick;

    if (saturationHealing && world.gameRules.naturalRegeneration == true)
        world.gameRules.naturalRegeneration = false;

    for (const player of world.getAllPlayers()) {
        tickIndicator(player, currentTick, addonToggle);
        tickFood(player, currentTick, saturationHealing, isPeaceful);
    }
});

// Script event receiver
system.afterEvents.scriptEventReceive.subscribe(({ id, message, sourceEntity: player }) => {
    if (id === 'sweep-and-slash:toggle_check') {
        system.sendScriptEvent(
            'sweep-and-slash:toggle',
            `${world.getDynamicProperty('addon_toggle')}`,
        );
        return;
    }

    if (
        world.getDynamicProperty('addon_toggle') == false ||
        !(player instanceof Player) ||
        !player
    )
        return;

    if (id === 'sns:testdamage') {
        damageTest(player);
    }
});

// Swing start
world.afterEvents.playerSwingStart.subscribe(({ player, swingSource }) => {
    if (world.getDynamicProperty('addon_toggle') == false) return;

    const shieldCooldown = player.getItemCooldown('minecraft:shield');
    player.startItemCooldown('minecraft:shield', shieldCooldown ? shieldCooldown : 5);
    setLastShieldTime(player, system.currentTick);

    if (swingSource !== 'Attack') return;
    AttackCooldownManager.forPlayer(player).onSwing();
});

// Inventory item change (lore)
world.afterEvents.playerInventoryItemChange.subscribe(({ player: source, slot }) => {
    inventoryAddLore({ source, slot });
});

// Item use start/stop (hold interact, charge attack)
world.afterEvents.itemStartUse.subscribe(({ source: player, itemStack }) => {
    const status = getStatus(player);
    status.holdInteract = true;
    if (itemStack && itemHasFlag(itemStack, 'kinetic_weapon')) status.chargeAttacking = true;
});

world.afterEvents.itemStopUse.subscribe(({ source: player, itemStack }) => {
    const status = getStatus(player);
    status.holdInteract = false;
    if (itemStack && itemHasFlag(itemStack, 'kinetic_weapon')) status.chargeAttacking = false;
});

// Block interaction (rightclick flag)
world.afterEvents.playerInteractWithBlock.subscribe(({ player, block }) => {
    if (block) {
        const status = getStatus(player);
        status.rightClick = true;
    }
});

// Hit block → reset cooldown
world.afterEvents.entityHitBlock.subscribe(({ damagingEntity: player }) => {
    if (!(player instanceof Player)) return;
    if (world.getDynamicProperty('addon_toggle') == false) return;
    if (player.getGameMode() === GameMode.Creative) return;

    setLastShieldTime(player, system.currentTick);
    setAttackCooldown(player, system.currentTick);
});

// Projectile hit entity
world.afterEvents.projectileHitEntity.subscribe((event) => {
    const { source: player, projectile } = event;
    const target = event.getEntityHit().entity;

    if (!player || !target) return;
    if (world.getDynamicProperty('addon_toggle') == false) return;
    if (isTeam(player, target)) return;

    const configCheck =
        player instanceof Player && player.getDynamicProperty('bowHitSound') == true;
    if (
        configCheck &&
        target instanceof Player &&
        player !== target &&
        projectile.typeId === 'minecraft:arrow'
    ) {
        (player as Player).playSound(Sounds.GamePlayerBowDing, { pitch: 0.5 });
    }
});

// Entity spawn (projectile velocity inheritance)
world.afterEvents.entitySpawn.subscribe(({ cause, entity }) => {
    if (world.getDynamicProperty('addon_toggle') == false) return;
    if (!entity?.isValid) return;

    const projectileComp = entity?.getComponent('projectile');
    const owner = projectileComp?.owner;
    if (!owner) return;

    const { item, stats } = getItemStats(owner as Player);
    if (stats?.noInherit || (item && itemHasFlag(item, 'no_inherit'))) return;

    const ownerVel = owner.getVelocity();
    entity.applyImpulse(ownerVel);
});

// Entity hit entity (main combat entry point)
world.afterEvents.entityHitEntity.subscribe(({ damagingEntity: player, hitEntity: target }) => {
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
});

// Entity hurt (iframes)
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
            const debugMode = world.getDynamicProperty('debug_mode');
            if (debugMode) debug('Error during knockback: ' + e + ', knockback skipped');
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
            lastAttackMap.set(hurtEntity.id, { rawDamage: damage, damage, time: currentTick });
        }
    } else {
        lastAttackMap.set(hurtEntity.id, { rawDamage: damage, damage, time: currentTick });
    }
});

// Before entity hurt (team cancel)
world.beforeEvents.entityHurt.subscribe((ev) => {
    if (world.getDynamicProperty('addon_toggle') == false) return;

    const { damageSource, hurtEntity } = ev;
    const damagingEntity = damageSource?.damagingEntity;

    if (!damagingEntity || !hurtEntity?.isValid) return;

    if (isTeam(damagingEntity, hurtEntity)) {
        ev.cancel = true;
    }
});
