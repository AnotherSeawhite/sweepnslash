// Based on The Minecraft Wiki info
// https://minecraft.wiki/w/Damage

import { WeaponStats } from '../importStats';

// Read CROSS_COMPATIBILITY_GUIDE.txt for adding stat files

/* Pro tip:
	Dividing 1 by the attack speed will tell how fast you can attack.
	ex)
	1.6 attack speed has delay of 0.625 seconds (1/1.6)
	4 attack speed has delay of 0.25 seconds (1/4)

	You can get damage and DPS test in content logs using 'sns:testdamage' scriptevent. This requires Debug Mode enabled.
*/

export const exampleArray: WeaponStats[] = [
    {
        id: 'namespace:example1',
        attackSpeed: 1.6,
        damage: 6,
        isWeapon: true,
        sweep: true,
        disableShield: false,
        skipLore: false,
        regularKnockback: 1.552,
        enchantedKnockback: 2.586,
		regularVerticalKnockback: 0.7955,
		enchantedVerticalKnockback: 1,
        beforeEffect: ({
            mc,
            world,
            player,
            target,
            item,
            dmg,
            specialCheck,
            sweptEntities,
            crit,
            sprintKnockback,
            cooldown,
            iframes,
        }) => {
            let confirmedCrit = cooldown === 1;

            function random(min: number, max: number) {
                return Math.random() * (max - min) + min;
            }
            const rgb = {
                red: random(0, 1),
                green: random(0, 1),
                blue: random(0, 1),
            };
            let map = new mc.MolangVariableMap();
            map.setFloat('variable.size', random(0.8, 1));
            map.setColorRGB('variable.color', rgb);

            return {
                cancel: false,
                dmg: Math.random() * dmg,
                critAttack: confirmedCrit,
                critMultiplier: 2,
                sweep: confirmedCrit ? false : undefined,
                sweepLevel: 1,
                sprintKnockback: false,
                cancelDurability: true,
                regularKnockback: 1.552,
                enchantedKnockback: 2.586,
                sweepLocation: target.location,
                sweepRadius: 3,

                sweepParticle: undefined,
                sweepSound: undefined,
                sweepPitch: 1,
                sweepVolume: 1,
                sweepMap: map,

                critParticle: undefined,
                critSound: undefined,
                critMap: undefined,
            };
        },
        script: ({
            mc,
            world,
            player,
            target,
            item,
            sweptEntities,
            dmg,
            hit,
            shieldBlock,
            specialCheck,
            crit,
            sprintKnockback,
            inanimate,
            cooldown,
        }) => {
            if (hit && !crit) player.sendMessage(target.typeId + ' was hit');
            else if (crit) player.sendMessage('powerful hit!');
            else player.sendMessage(target.typeId + ' was not hit, too bad');

            sweptEntities.forEach((e) => {
                player.sendMessage(e.typeId + ' was swept');
            });
        },
    },
    {
        id: 'namespace:example2',
        attackSpeed: 1.6,
        damage: 7,
        isWeapon: true,
        regularKnockback: 1.552,
        enchantedKnockback: 2.586,
        beforeEffect: ({ cooldown }) => {
            return {
                critAttack: false,
                sprintKnockback: true,
                cancelDurability: cooldown === 1,
                enchantedKnockback: 2.586 * (4 * cooldown),
            };
        },
        script: ({ player, hit }) => {
            if (hit) player.sendMessage('Yeet!');
        },
    },
];
