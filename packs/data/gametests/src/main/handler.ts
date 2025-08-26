// This file is used to handle crucial functions.
const version = '2.2.0';
const configCommand = 'sns:config';

import {
    world,
    system,
    Player,
    Entity,
    CustomCommandStatus,
    CustomCommandSource,
    EntityDamageCause,
    GameMode,
    PlayerPermissionLevel
} from '@minecraft/server';
import { ModalFormData } from '@minecraft/server-ui';
import { CombatManager } from './class.js';
import {
    Check,
    getCooldownTime,
    healthParticle,
    inventoryAddLore,
} from './mathAndCalculations.js';
import { clampNumber } from './minecraft-math.js';

// Gametest module import
let SimulatedPlayer;
let gametest = true;
import('@minecraft/server-gametest')
    .then((module) => {
        SimulatedPlayer = module.SimulatedPlayer;
    })
    .catch((err) => {
        gametest = false;
        //console.error(err);
    });

// If it's the first time running the add-on, set up the world
world.afterEvents.worldLoad.subscribe(() => {
    system.run(() =>
        console.log(
            `\n§3Sweep §f'N §6Slash §fhas been loaded!\nVersion: v${version}${
                gametest ? '-gametest' : ''
            }`
        )
    );

    if (world.getDynamicProperty('addon_toggle') == undefined) {
        world.setDynamicProperty('addon_toggle', true);
    }

    if (world.getDynamicProperty('shieldBreakSpecial') == undefined) {
        world.setDynamicProperty('shieldBreakSpecial', false);
    }

    if (world.getDynamicProperty('saturationHealing') == undefined) {
        world.setDynamicProperty('saturationHealing', true);
    }
});

// Initialize dynamic properties
function initialize(player: Player, dynamicProperty: string) {
    if (player.getDynamicProperty(dynamicProperty) == undefined) {
        player.setDynamicProperty(dynamicProperty, true);
    }
}

// Set up the dynamic properties when the player is spawned for the first time
world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    const dpArray = [
        'excludePetFromSweep',
        'tipMessage',
        'enchantedHit',
        'damageIndicator',
        'criticalHit',
        'sweep',
        'critSound',
        'bowHitSound',
    ];
    if (initialSpawn) {
        // Here is a friendly tip for opening config menu!
        if (
            player.getDynamicProperty('tipMessage') === undefined ||
            player.getDynamicProperty('tipMessage')
        )
            player.sendMessage({
                rawtext: [
                    {
                        translate: 'sweepnslash.tipmessage',
                        with: ['/' + configCommand],
                    },
                    { text: '\n' },
                    {
                        translate: 'sweepnslash.currentversion',
                        with: [`v${version}${gametest ? '-gametest' : ''}`],
                    },
                ],
            });

        for (const dp of dpArray) initialize(player, dp);
    }
});

// Config form

// This one is for custom commands.
function configFormOpener({ sourceEntity: player, sourceType }) {
    if (!(player instanceof Player && sourceType === CustomCommandSource.Entity)) {
        return {
            status: CustomCommandStatus.Failure,
            message: 'Target must be player-type and command executor must be entity',
        };
    }
    system.run(() => configForm(player));
    return {
        status: CustomCommandStatus.Success,
        //message: "Successfully opened Sweep 'N Slash configuration menu for " + player.name
    };
}

function configForm(player) {
    const tag = player.hasTag('sweepnslash.config');
    const op = player.playerPermissionLevel == PlayerPermissionLevel.Operator;
    let formValuesPush = 0;

    let form = new ModalFormData().title({
        translate: 'sweepnslash.configmenutitle',
    });

    function dp(object, { id, value } = {}) {
        if (value !== undefined) object.setDynamicProperty(id, value);
        return object.getDynamicProperty(id);
    }

    if (tag == true) {
        form.label({ translate: 'sweepnslash.operatortoggleheader' });
        if (!world.isHardcore)
        form.toggle(
            { translate: 'sweepnslash.toggleaddon' },
            { defaultValue: dp(world, { id: 'addon_toggle' }) }
        );
        form.toggle(
            { translate: 'sweepnslash.toggledebugmode' },
            {
                defaultValue: dp(world, { id: 'debug_mode' }),
                tooltip: { translate: 'sweepnslash.toggledebugmode.tooltip' },
            }
        );
        form.divider();
    }

    if (op == true) {
        form.label({ translate: 'sweepnslash.servertoggleheader' });
        form.toggle(
            { translate: 'sweepnslash.shieldbreakspecial' },
            {
                defaultValue: dp(world, { id: 'shieldBreakSpecial' }),
                tooltip: { translate: 'sweepnslash.shieldbreakspecial.tooltip' },
            }
        );
        form.toggle(
            { translate: 'sweepnslash.saturationhealing' },
            {
                defaultValue: dp(world, { id: 'saturationHealing' }),
                tooltip: {
                    rawtext: [
                        { translate: "sweepnslash.saturationhealing.tooltip" },
                        { text: "\n\n" },
                        { translate: "createWorldScreen.naturalregeneration" },
                        { text: ": " },
                        { text: world.gameRules.naturalRegeneration ? "§aON" : "§cOFF"}
                    ]
                }
            }
        );
        form.divider();
    }

    form.label({ translate: 'sweepnslash.generaltoggleheader' });
    form.toggle(
        { translate: 'sweepnslash.excludepetfromsweep' },
        {
            defaultValue: dp(player, { id: 'excludePetFromSweep' }) ?? false,
            tooltip: { translate: 'sweepnslash.excludepetfromsweep.tooltip' },
        }
    );
    form.toggle(
        { translate: 'sweepnslash.tipmessagetoggle' },
        { defaultValue: dp(player, { id: 'tipMessage' }) ?? false }
    );
    form.divider();
    form.label({ translate: 'sweepnslash.personaltoggleheader' });
    form.dropdown(
        { translate: 'sweepnslash.indicatorstyle' },
        [
            { translate: 'sweepnslash.crosshair' },
            { translate: 'sweepnslash.hotbar' },
            { translate: 'sweepnslash.geyser' },
            { translate: 'sweepnslash.none' },
        ],
        {
            defaultValueIndex: dp(player, { id: 'cooldownStyle' }),
            tooltip: { translate: 'sweepnslash.indicatorstyle.tooltip' },
        }
    );
    form.toggle(
        { translate: 'sweepnslash.bowhitsound' },
        { defaultValue: dp(player, { id: 'bowHitSound' }) ?? false }
    );
    form.toggle(
        { translate: 'sweepnslash.sweepparticles' },
        { defaultValue: dp(player, { id: 'sweep' }) ?? false }
    );
    form.toggle(
        { translate: 'sweepnslash.enchantedhitparticles' },
        { defaultValue: dp(player, { id: 'enchantedHit' }) ?? false }
    );
    form.toggle(
        { translate: 'sweepnslash.damageindicatorparticles' },
        { defaultValue: dp(player, { id: 'damageIndicator' }) ?? false }
    );
    form.toggle(
        { translate: 'sweepnslash.critparticles' },
        { defaultValue: dp(player, { id: 'criticalHit' }) ?? false }
    );
    form.toggle(
        { translate: 'sweepnslash.critsounds' },
        { defaultValue: dp(player, { id: 'critSound' }) ?? false }
    );
    form.divider();
    form.label({ translate: 'sweepnslash.sweepRGBtitle' });
    form.slider('§cR', 0, 255, {
        defaultValue: dp(player, { id: 'sweepR' }) ?? 255,
    });
    form.slider('§aG', 0, 255, {
        defaultValue: dp(player, { id: 'sweepG' }) ?? 255,
    });
    form.slider('§9B', 0, 255, {
        defaultValue: dp(player, { id: 'sweepB' }) ?? 255,
    });

    form.submitButton({ translate: 'sweepnslash.saveconfig' });

    form.show(player).then((response) => {
        const { canceled, formValues, cancelationReason } = response;

        function n(value) {
            const num = Number(value);
            if (isNaN(value)) player.sendMessage({ translate: 'sweepnslash.nan' });
            return isNaN(num) ? 0 : num;
        }

        if (response && canceled && cancelationReason === 'UserBusy') {
            configForm(player);
            return;
        }

        if (canceled) {
            player.sendMessage({ translate: 'sweepnslash.canceled' });
            return;
        } else if (!canceled) {
            player.sendMessage({ translate: 'sweepnslash.saved' });
        }

        const rgbProps = ['sweepR', 'sweepG', 'sweepB'];

        function valuePush({ object, dynamicProperty, condition = true }) {
            if (!condition) return;

            // Skip undefined values
            while (formValues[formValuesPush] === undefined) {
                formValuesPush++;
            }

            const isRgb = rgbProps.includes(dynamicProperty);
            const value = isRgb
                ? clampNumber(n(formValues[formValuesPush]), 0, 255)
                : formValues[formValuesPush];

            object.setDynamicProperty(dynamicProperty, value);
            formValuesPush++;
        }

        const properties = [
            {
                object: world,
                dynamicProperty: 'addon_toggle',
                condition: tag && !world.isHardcore,
            },
            { object: world, dynamicProperty: 'debug_mode', condition: tag },
            { object: world, dynamicProperty: 'shieldBreakSpecial', condition: op },
            { object: world, dynamicProperty: 'saturationHealing', condition: op },
            { object: player, dynamicProperty: 'excludePetFromSweep' },
            { object: player, dynamicProperty: 'tipMessage' },
            { object: player, dynamicProperty: 'cooldownStyle' },
            { object: player, dynamicProperty: 'bowHitSound' },
            { object: player, dynamicProperty: 'sweep' },
            { object: player, dynamicProperty: 'enchantedHit' },
            { object: player, dynamicProperty: 'damageIndicator' },
            { object: player, dynamicProperty: 'criticalHit' },
            { object: player, dynamicProperty: 'critSound' },
            { object: player, dynamicProperty: 'sweepR' },
            { object: player, dynamicProperty: 'sweepG' },
            { object: player, dynamicProperty: 'sweepB' },
        ];

        properties.forEach(valuePush);
    });
}

// // Config menu opener
// world.beforeEvents.chatSend.subscribe((event) => {
//     const { message, sender } = event;
//     if (sender instanceof Player && message == '!' + configCommand) {
//         event.cancel = true;
//         system.run(() => {
//             sender.sendMessage({ translate: 'sweepnslash.configopened' });
//             sender.runCommand('sns:config');
//             //configForm(sender)
//         });
//     }
// });

// Config menu opener, with custom commands
system.beforeEvents.startup.subscribe((init) => {
    const configMenuCommand = {
        name: configCommand,
        description: "Opens up configuration menu for Sweep 'N Slash.",
        permissionLevel: 0,
        cheatsRequired: false,
    };
    init.customCommandRegistry.registerCommand(configMenuCommand, configFormOpener);
});

// Constantly checks status, also sends data to UI
system.runInterval(() => {
    const debugMode = world.getDynamicProperty('debug_mode');
    const addonToggle = world.getDynamicProperty('addon_toggle');
    const saturationHealing = world.getDynamicProperty('saturationHealing');
    const currentTick = system.currentTick;

    if (saturationHealing && world.gameRules.naturalRegeneration == true) world.gameRules.naturalRegeneration = false;

    for (const player of world.getAllPlayers()) {
        const status = player.getStatus();
        const { item, stats } = player.getItemStats();

        // If the player has shield up, run delay check
        // Crucial for making sure the attacker does not get knocked back
        if (!(Check.shield(player) && !status.holdInteract)) {
            status.lastShieldTime = currentTick;
        }
        const shieldTime = currentTick - status.lastShieldTime;
        status.shieldValid = shieldTime >= 5 || shieldTime == 1;

        // If the player changes the slot, run cooldown
        if (
            (player.selectedSlotIndex !== status.lastSelectedSlot &&
                status.lastSelectedItem !== item?.typeId) ||
            (status.lastSelectedItem !== item?.typeId &&
                !(status.lastSelectedItem === undefined && item?.typeId === undefined))
        ) {
            status.lastAttackTime = currentTick;
        }

        status.lastSelectedSlot = player.selectedSlotIndex;
        status.lastSelectedItem = item?.typeId;

        status.lastSelectedItem = item?.typeId;

        // Sprint check
        const isSprinting = player.isSprinting;

        if (!isSprinting) {
            status.sprintKnockbackHitUsed = false;
            status.sprintKnockbackValid = false;
            status.critSweepValid = true;
        } else if (isSprinting && !status.sprintKnockbackHitUsed) {
            status.sprintKnockbackValid = true;
        } else if (isSprinting && status.sprintKnockbackHitUsed) {
            status.sprintKnockbackValid = false;
        }
        status.critSweepValid = !player.isSprinting || status.sprintKnockbackHitUsed;

        // Fall distance code by Jayly
        // For mace smash attack
        const fallDist = status.fallDistance;
        if (
            player.isFalling &&
            !player.isGliding &&
            !player.isOnGround &&
            !player.isInWater &&
            !player.isFlying &&
            !player.isClimbing &&
            !Check.effect(player, 'slow_falling') &&
            !Check.effect(player, 'levitation')
        ) {
            status.fallDistance = fallDist + player.getVelocity().y;
        } else {
            system.run(() => (status.fallDistance = 0));
        }

        // If the player falls more than 1.5 blocks, trigger damage event so that mace smash can work properly
        if (addonToggle == true) {
            if (Math.abs(fallDist) >= 1.5 && item?.typeId === 'minecraft:mace') {
                player.triggerEvent('sweepnslash:mace');
                status.mace = true;
            } else {
                player.triggerEvent('sweepnslash:not_mace');
                status.mace = false;
            }
        } else {
            player.triggerEvent('sweepnslash:mace');
        }

        // Saturation healing
        
        const health = player.getComponent("health");
        const hunger = player.getHunger();
        const saturation = player.getSaturation();
        const exhaustion = player.getExhaustion();

        const saturationEffect = player.getEffect("saturation");
        if (saturationEffect?.isValid && health.currentValue > 0) {
            const saturationComp = player.getComponent("player.saturation");
            player.setSaturation(clampNumber(saturation + ((saturationEffect.amplifier + 1) * 2), saturationComp?.effectiveMin, saturationComp?.effectiveMax));
        }

        const canHeal =
            saturationHealing &&
            hunger >= 18 &&
            health.currentValue > 0 &&
            health.currentValue < health.effectiveMax &&
            player.getGameMode() !== GameMode.Creative;
            
        if (canHeal) {
            status.foodTickTimer += 1;

            const usingSaturation = saturation > 0 && hunger >= 20;
            const foodTick = usingSaturation ? 10 : 80;

            if (status.foodTickTimer >= foodTick) {
                let healAmount = 0;
                let exhaustionToAdd = 0;

                if (usingSaturation) {
                    healAmount = Math.min(1.0, saturation / 6.0);
                    exhaustionToAdd = healAmount * 6.0;
                } else {
                    healAmount = 1.0;
                    exhaustionToAdd = 6.0;
                }

                // Apply healing and exhaustion
                player.setExhaustion(exhaustion + exhaustionToAdd);
                health.setCurrentValue(
                    clampNumber(health.currentValue + healAmount, health.effectiveMin, health.effectiveMax)
                );
                status.foodTickTimer = 0;
            }
        } else {
            status.foodTickTimer = 0;
        }

        // For UI
        const maxCD = getCooldownTime(player, stats?.attackSpeed).ticks;
        status.cooldown = Math.max(0, status.lastAttackTime + maxCD - currentTick);

        const curCD = status.cooldown;
        const pixelValue = Math.min(16, Math.floor(((Math.round(maxCD) - curCD) / maxCD) * 17));
        const uiPixelValue = clampNumber(pixelValue, 0, 16);

        const subGrey = Math.round(uiPixelValue / 1.6);
        const subDarkGrey = 10 - subGrey;
        let cooldownSubtitle = '§7˙'.repeat(Math.max(0, subGrey));
        cooldownSubtitle += '§8˙'.repeat(subDarkGrey);

        const inRange = Check.view(player);
        const targetValid = !(inRange?.getComponent('health')?.currentValue <= 0);
        const specialCheck = Check.specialValid(currentTick, player, stats);

        const riders = player.getRiders() || [];
        const riderCheck = riders.some((rider) => rider === inRange);
        const ridingCheck = player.getRidingOn() !== inRange;

        const viewCheck = inRange && targetValid && !riderCheck && ridingCheck;

        // Handles indicators
        // If the player has indicator disabled, the title will show up once to clean up the UI and never appear
        const barStyle = player.getDynamicProperty('cooldownStyle') ?? 0;
        const barArray = ['crs', 'htb', 'sub', 'non'][barStyle];

        const bonkReady = specialCheck && viewCheck && curCD <= 0;

        if (!addonToggle || barStyle === 3) {
            if (status.showBar) {
                player.onScreenDisplay.setTitle('_sweepnslash:non', {
                    fadeInDuration: 0,
                    fadeOutDuration: 0,
                    stayDuration: 0,
                });
                status.showBar = false;
            }
        } else {
            status.showBar = true;
            if (curCD > 0 || (viewCheck && stats && stats?.damage && barStyle === 0)) {
                barStyle !== 2
                    ? player.onScreenDisplay.setTitle(
                          `_sweepnslash:${barArray}:${bonkReady ? 't' : 'f'}:${uiPixelValue}`,
                          {
                              fadeInDuration: 0,
                              fadeOutDuration: 0,
                              stayDuration: 0,
                          }
                      )
                    : player.onScreenDisplay.setTitle(' ', {
                          fadeInDuration: 0,
                          fadeOutDuration: 0,
                          stayDuration: 10,
                          subtitle: `${cooldownSubtitle}`,
                      });
                status.attackReady = false;
            } else if (curCD <= 0 && status.attackReady == false) {
                player.onScreenDisplay.setTitle('_sweepnslash:non', {
                    fadeInDuration: 0,
                    fadeOutDuration: 0,
                    stayDuration: 0,
                });
                status.attackReady = true;
            }
        }

        // Debug function for developing
        if (addonToggle && debugMode) {
            const cooldownPercentage = Math.floor(((maxCD - curCD) / maxCD) * 100);
            const actionBarDisplay = `${Math.trunc(curCD)} (${
                specialCheck ? '§a' : ''
            }${cooldownPercentage}%§f)`;
            player.onScreenDisplay.setActionBar(actionBarDisplay);
        }
    }
});

// For air swinging and parsing item stats from other addons
system.afterEvents.scriptEventReceive.subscribe(({ id, sourceEntity: player }) => {
    if (
        world.getDynamicProperty('addon_toggle') == false ||
        !(player instanceof Player) ||
        !player
    )
        return;

    const status = player.getStatus();

    if (id === 'sns:testdamage') {
        Check.damageTest(player);
    }

    if (id === 'se:attack') {
        const shieldCooldown = player.getItemCooldown('minecraft:shield');
        player.startItemCooldown('minecraft:shield', shieldCooldown ? shieldCooldown : 5);
        if (player.__leftClick == true) {
            player.__leftClick = false;
            return;
        }

        if (player.__rightClick == true) {
            player.__rightClick = false;
            status.lastShieldTime = system.currentTick;
            return;
        }

        if (Check.block(player) && !Check.view(player)) return;

        status.lastAttackTime = system.currentTick;

        //const debugMode = world.getDynamicProperty("debug_mode");
        //if (debugMode) debug(`${Math.random().toFixed(2)} attack event by ${player.name}`);
    }
});

world.afterEvents.playerInventoryItemChange.subscribe(({ player: source, slot }) => {
  inventoryAddLore({ source, slot });
})

world.afterEvents.itemStartUse.subscribe(({ source: player }) => {
    const status = player.getStatus();
    status.holdInteract = true;
});

world.afterEvents.itemStopUse.subscribe(({ source: player }) => {
    const status = player.getStatus();
    status.holdInteract = false;
});

// For making sure the attack cooldown isn't triggered when the player interacts with levers or buttons.
world.afterEvents.playerInteractWithBlock.subscribe(({ player, block }) => {
    if (block) {
        player.__rightClick = true;
    }
});

// Run cooldown when the player hits block.
world.afterEvents.entityHitBlock.subscribe(({ damagingEntity: player }) => {
    if (!(player instanceof Player)) return;
    if (world.getDynamicProperty('addon_toggle') == false) return;
    if (player.getGameMode() === GameMode.Creative) return;

    const status = player.getStatus();
    status.lastShieldTime = system.currentTick;
    status.lastAttackTime = system.currentTick;
    player.__leftClick = true;
});

// Handles the entire combat.
//* Very important!

world.afterEvents.projectileHitEntity.subscribe((event) => {
    const { source: player, projectile } = event;
    const target = event.getEntityHit().entity;

    if (!player || !target) return;
    if (world.getDynamicProperty('addon_toggle') == false) return;

    const configCheck = player.getDynamicProperty('bowHitSound') == true;
    if (
        configCheck &&
        target instanceof Player &&
        player !== target &&
        projectile.typeId === 'minecraft:arrow'
    ) {
        player.playSound('game.player.bow.ding', { pitch: 0.5 });
    }
});

world.afterEvents.entitySpawn.subscribe(({ cause, entity }) => {
    if (world.getDynamicProperty('addon_toggle') == false) return;
    if (!entity?.isValid) return;
    
    const projectileComp = entity?.getComponent('projectile');
    const owner = projectileComp?.owner;
    if (!owner) return;
    
    const { stats } = owner.getItemStats();
    if (stats?.noInherit) return;
    
    if (owner instanceof Entity) {
        const ownerVel = owner.getVelocity();
        entity.applyImpulse(ownerVel);
    }
});

world.afterEvents.playerSpawn.subscribe(({ player }) => {
    const status = player.getStatus();
    status.lastAttackTime = system.currentTick;
});

world.afterEvents.entityHitEntity.subscribe(({ damagingEntity: player, hitEntity: target }) => {
    if (world.getDynamicProperty('addon_toggle') == false) return;
    const currentTick = system.currentTick;

    if (!(player instanceof Player)) {
        // The 'player' here is actually not a player. It's for disabling shield knockback on non-player mobs. Don't get confused!
        const { stats } = player.getItemStats();
        const shieldBlock = Check.shieldBlock(currentTick, player, target, stats);
        if (shieldBlock) player.applyKnockback({ x: 0, z: 0 }, 0);
        return;
    }

    player.__leftClick = true;
    if (target?.isValid && player?.getComponent('health')?.currentValue > 0)
        CombatManager.attack({ player, target, currentTick });
});

// For when the entity is hurt. Handles iframes.
world.afterEvents.entityHurt.subscribe(({ damageSource, hurtEntity, damage }) => {
    if (!hurtEntity?.isValid) return;
    //console.log(damageSource.cause, damage.toFixed(2))
    if (world.getDynamicProperty('addon_toggle') == false) return;

    const currentTick = system.currentTick;
    const player = damageSource.damagingEntity;
    
    if (!player && damageSource.cause !== EntityDamageCause.override && damage >= 0) {
        try {
            if (!hurtEntity.__playerHit)
                hurtEntity.applyKnockback({x: 0, z: 0}, hurtEntity.getVelocity().y);
        } catch (e) {
            const debugMode = world.getDynamicProperty('debug_mode');
            if (debugMode) debug('Error during knockback: ' + e + ', knockback skipped');
        }
    }

    hurtEntity.__playerHit = false;
    
    if (player instanceof Player) {
        if (damageSource.cause === EntityDamageCause.entityAttack) {
            //const { stats } = player.getItemStats();
            //const shieldBlock = Check.shieldBlock(currentTick, player, hurtEntity, stats);
            //if (!shieldBlock)
            hurtEntity.__lastAttack = {
                rawDamage: player.__rawDamage,
                damage: damage,
                time: currentTick,
            };
            healthParticle(hurtEntity, damage);
        } else if (damageSource.cause === EntityDamageCause.maceSmash) {
            healthParticle(hurtEntity, damage);
        } else {
            hurtEntity.__lastAttack = {
                rawDamage: damage,
                damage: damage,
                time: currentTick,
            };
        }
    } else {
        hurtEntity.__lastAttack = {
            rawDamage: damage,
            damage: damage,
            time: currentTick,
        };
    }
});
