export const alylicaDungeons = [
    {
        id: 'dungeons:sword',
        attackSpeed: 1.6,
        damage: 6,
        isWeapon: true,
        sweep: true,
    },
    {
        id: 'dungeons:diamond_sword',
        attackSpeed: 1.6,
        damage: 9,
        isWeapon: true,
        sweep: true,
        beforeEffect: ({ mc }) => {
            function random(min, max) {
                return Math.random() * (max - min) + min;
            }
            const rand = random(0.5, 1);
            const rgb = {
                red: (115 * rand) / 255,
                green: (255 * rand) / 255,
                blue: (255 * rand) / 255,
            };
            let map = new mc.MolangVariableMap();
            map.setFloat('variable.size', 1);
            map.setColorRGB('variable.color', rgb);
            return {
                sweepMap: map,
                sweepPitch: 1.1,
            };
        },
    },
    {
        id: 'dungeons:hawkbrand',
        attackSpeed: 1.6,
        damage: 7,
        isWeapon: true,
        sweep: true,
        beforeEffect: ({ player, target, crit, iframes, sweptEntities }) => {
            sweptEntities.forEach((e) => {
                e.addTag('prevent_effect');
            });

            if (target.hasTag('prevent_effect')) return;
            target.addTag('prevent_effect');

            if (iframes) return;

            function clampNumber(val, min, max) {
                return Math.max(Math.min(val, Math.max(min, max)), Math.min(min, max));
            }
            function rng(num) {
                let min = 0;
                let max = 100;
                const math = Math.floor(Math.random() * (max - min) + min);
                return math < clampNumber(num, min, max);
            }

            let doCrit = false;

            if (rng(10)) {
                player.dimension.spawnParticle('dungeons:skull_crit', target.location);
                player.dimension.spawnParticle('dungeons:skull_burst', target.location);
                player.dimension.playSound('random.anvil_land', player.location, {
                    volume: 0.2,
                    pitch: 1.5,
                });
                player.playSound('random.orb', { volume: 0.6, pitch: 1 });
                doCrit = true;
            }

            return {
                critAttack: doCrit || undefined,
                critMultiplier: doCrit ? (crit ? 2.25 : 1.5) : undefined,
            };
        },
        script: ({ system, target, sweptEntities }) => {
            system.run(() => {
                sweptEntities.forEach((e) => {
                    if (e.hasTag('prevent_effect')) e.removeTag('prevent_effect');
                });
                if (target.hasTag('prevent_effect')) target.removeTag('prevent_effect');
            });
        },
    },
    {
        id: 'dungeons:katana',
        attackSpeed: 1.4,
        damage: 7,
        isWeapon: true,
        sweep: true,
    },
    {
        id: 'dungeons:claymore',
        attackSpeed: 1.2,
        damage: 8.5,
        isWeapon: true,
        sweep: true,
        beforeEffect: ({ specialCheck }) => {
            return {
                sprintKnockback: specialCheck || undefined,
                sweepPitch: 0.9,
            };
        },
    },
    {
        id: 'dungeons:cutlass',
        attackSpeed: 1.7,
        damage: 5.5,
        isWeapon: true,
        sweep: true,
    },
    {
        id: 'dungeons:daggers',
        attackSpeed: 3,
        damage: 4,
        isWeapon: true,
        beforeEffect: ({ player, target, specialCheck, iframes, sprintKnockback }) => {
            let daggerHit = false;
            target.__daggerSecondHit = target.__daggerSecondHit ?? false;
            if (specialCheck) {
                if (iframes && target.__daggerSecondHit) {
                    daggerHit = true;
                    target.__daggerSecondHit = false;
                    player.playAnimation('animation.player.attack_daggers');
                } else if (!iframes) {
                    player.dimension.playSound('weapon.daggers.hit', player.location, {
                        volume: 0.6,
                    });
                    target.__daggerSecondHit = true;
                }
            }

            return {
                critAttack: daggerHit || undefined,
                critMultiplier: daggerHit ? 2.2 : undefined,
                sprintKnockback: daggerHit || undefined,
                enchantedKnockback: daggerHit && !sprintKnockback ? 0.58 : undefined,

                cancelDurability: daggerHit,

                critParticle: daggerHit ? 'dungeons:daggers_strike' : undefined,
                critSound: daggerHit ? 'weapon.daggers.hit' : undefined,
                critOffset: daggerHit ? { x: 0, y: -1, z: 0 } : undefined,
            };
        },
    },
    {
        id: 'dungeons:rapier',
        attackSpeed: 2,
        damage: 5,
        isWeapon: true,
        sweep: true,
    },
    {
        id: 'dungeons:battlestaff',
        attackSpeed: 1.5,
        damage: 6.5,
        isWeapon: true,
        sweep: true,
        beforeEffect: () => {
            return {
                sweepPitch: 0.8,
            };
        },
    },
    {
        id: 'dungeons:axe',
        attackSpeed: 1.4,
        damage: 7,
        isWeapon: true,
    },
    {
        id: 'dungeons:double_axe',
        attackSpeed: 1.2,
        damage: 8.5,
        isWeapon: true,
        sweep: true,
        beforeEffect: ({ player }) => {
            return {
                sweepLocation: player.location,
                sweepSound: 'weapon.enchant.swirling',
                sweepParticle: 'dungeons:swirling',
                sweepOffset: { x: 0, y: 1, z: 0 },
            };
        },
    },
    {
        id: 'dungeons:whirlwind',
        attackSpeed: 1.2,
        damage: 8.5,
        isWeapon: true,
        sweep: true,
        beforeEffect: ({ system, player, target, specialCheck, crit, sprintKnockback }) => {
            if (!crit && !sprintKnockback && specialCheck) {
                const loc = target.location;
                player.dimension.spawnParticle('dungeons:swirling', {
                    x: loc.x,
                    y: loc.y + 1,
                    z: loc.z,
                });
                system.run(() => {
                    const vel = target.getVelocity();
                    target.applyKnockback({ x: vel.x, z: vel.y }, vel.y + 0.55);
                });
            }
            return {
                sweepLocation: player.location,
                sweepSound: 'weapon.enchant.swirling',
                sweepParticle: 'dungeons:swirling',
                sweepOffset: { x: 0, y: 1, z: 0 },
            };
        },
    },
    {
        id: 'dungeons:cursed_axe',
        attackSpeed: 1.2,
        damage: 8.5,
        isWeapon: true,
        sweep: true,
        beforeEffect: ({ player }) => {
            return {
                sweepLocation: player.location,
                sweepSound: 'weapon.enchant.swirling',
                sweepParticle: 'dungeons:swirling',
                sweepOffset: { x: 0, y: 1, z: 0 },
            };
        },
    },
    {
        id: 'dungeons:coral_blade',
        attackSpeed: 1.8,
        damage: 5,
        isWeapon: true,
        beforeEffect: ({ target, specialCheck, iframes }) => {
            const isInWater = target.isInWater && specialCheck && !iframes;
            return {
                critAttack: isInWater || undefined,
                critParticle: isInWater ? 'sweepnslash:magic_critical_hit_emitter' : undefined,
            };
        },
    },
    {
        id: 'dungeons:tempest_knife',
        attackSpeed: 1.5,
        damage: 6,
        isWeapon: true,
    },
    {
        id: 'dungeons:chill_gale_knife',
        attackSpeed: 1.5,
        damage: 6,
        isWeapon: true,
        beforeEffect: ({ target, iframes }) => {
            if (iframes || target.getEffect('slowness')) return;
            target.addEffect('slowness', 66, {
                amplifier: 1,
                showParticles: true,
            });
            const loc = target.location;
            target.dimension.spawnParticle('dungeons:element_freeze', {
                x: loc.x,
                y: loc.y + 1,
                z: loc.z,
            });
            target.dimension.playSound('mob.player.hurt_freeze', target.location, {
                volume: 0.33,
            });
        },
    },
    {
        id: 'dungeons:resolute_tempest_knife',
        attackSpeed: 1.5,
        damage: 6,
        isWeapon: true,
        beforeEffect: ({ target, crit, iframes }) => {
            if (target.hasTag('prevent_effect')) return;
            target.addTag('prevent_effect');

            const hp = target.getComponent('health');
            const dmgBonus = 0.5 - (hp.currentValue / hp.effectiveMax) * 0.5;

            let doCommittedBonus = false;
            if (!crit && !iframes && dmgBonus > 0) {
                doCommittedBonus = true;
            }

            return {
                critAttack: doCommittedBonus || undefined,
                critMultiplier: (crit ? 1.5 : 1) + dmgBonus,
                critParticle:
                    doCommittedBonus && !crit
                        ? 'sweepnslash:magic_critical_hit_emitter'
                        : undefined,
            };
        },
        script: ({ system, target }) => {
            system.run(() => {
                if (target.hasTag('prevent_effect')) {
                    target.removeTag('prevent_effect');
                }
            });
        },
    },
    {
        id: 'dungeons:soul_knife',
        attackSpeed: 1.5,
        damage: 6.5,
        isWeapon: true,
    },
    {
        id: 'dungeons:soul_scythe',
        attackSpeed: 1.3,
        damage: 6,
        isWeapon: true,
        sweep: true,
        regularKnockback: 1.122,
        enchantedKnockback: 1.381,
        beforeEffect: ({ player, specialCheck }) => {
            if (specialCheck) {
                player.dimension.playSound('weapon.obsidian_claymore.hit', player.location, {
                    pitch: 1.2,
                });
                player.dimension.playSound('attack.sweep', player.location, {
                    pitch: 1.7,
                });
            }
            return {
                sweepVolume: 0,
            };
        },
    },
];
