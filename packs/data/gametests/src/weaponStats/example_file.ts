// Based on The Minecraft Wiki info
// https://minecraft.wiki/w/Damage

// Read CROSS_COMPATIBILITY_GUIDE.txt for adding stat files

/*
 
 For the sake of customizability, the weapons don't follow item tags(like "minecraft:is_axe") for sweeping and breaking shield.
 If the weapon has both sweep and disableShield property set to true, sweep attacks from the weapon can disable shield.
 isWeapon property depletes the item's durability by 1 if true, and 2 if false or not defined. 
 If skipLore is set to true, the game will not add the lore text (Attack Speed and Attack Damage) on the specified item.
 regularKnockback defines the knockback distance in blocks without knockback enchantment, and enchantedKnockback is the one with knockback enchantment and/or sprint knockback applied.
 
 
 ## Explanations of properties in custom stats ##
 
 !!! IMPORTANT !!!
 if you are loading the stats via scriptevent, imports in your stats js will NOT work
 use 'mc' in functions instead of importing from modules (ex: mc.MolangVariableMap)

 Sweep 'N Slash uses 2.0.0-beta module for @minecraft/server. This means IPC exported functions are required to follow 2.0.0-beta formats.
 
	 # beforeEffect:
	
		player and target returns Entity
		item returns ItemStack
		dmg returns the number of the item's damage before calculation, ex) this item has 6 attack damage so it will return 6
		specialCheck returns boolean whether the attack is eligible for crit, sweep or sprint knockback
		sweptEntities returns array of entities affected by sweep *except for the target*, or an empty array if there's no entity
		crit/sprintKnockback returns a boolean whether the crit/sprintKnockback is about to land
		cooldown returns the percentage of attack charge (0~1)
		iframes returns the boolean of entity's iframes status
		
		you can cancel or modify the damage and other properties with scripts before the attack lands by returning the properties and sending the data to main scripts
		
		cancel will cancel the attack if set to true (duh!)
		dmg will set the number of the weapon's attack damage, default if undefined. *this is before calculation*
		critMultiplier sets the damage multiplier from crit attacks, *this affects sweep damage if sweep attack happened* (1.5 by default)
		critAttack, sweep, sprintKnockback will *force* those attacks regardless of condition if set to true, or force disable if false
		sweepLevel is basically level of Sweeping Edge enchantment effect (1 by default)
		cancelDurability will cancel durability reduction if set to true
		sweepLocation takes Vector3, changes where sweep attack radius is located at (target's location by default)
		sweepRadius changes the distance of sweep attack radius in blocks
		sweepParticle, critParticle, sweepSound, critSound string changes the particle and sound
		sweepPitch and sweepVolume changes sound's pitch and volume
		sweepMap and critMap takes MolangVariableMap for particles
		sweepOffset and critOffset takes Vector3, particle offsets
		default sweep particle has two variables: variable.size (1.0) and variable.color (RGB)
		
		keep in mind that returning properties undefined will make it fall back to default except for cancel property
		
		
	# script:
	
		dmg returns number of attempted damage regardless of the target being hurt
		hit returns boolean whether the target was damaged
		shieldBlock, specialCheck, crit, sprintKnockback returns boolean, self explanatory
		inanimate returns a boolean whether the target has inanimate family, armor stand is an exception
		
		this code runs after all the necessary codes


 Have fun!
 
*/

/* Pro tip:
	Dividing 1 by the attack speed will tell how fast you can attack.
	ex)
	1.6 attack speed has delay of 0.625 seconds (1/1.6)
	4 attack speed has delay of 0.25 seconds (1/4)

	You can get damage and DPS test in content logs using 'sns:testdamage' scriptevent. This requires Debug Mode enabled.
*/

export const exampleArray = [
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
            if (hit) {
                player.sendMessage('Yeet!');
            }
        },
    },
];
