import { DimensionTypes, Player, system, world } from '@minecraft/server';
import { initWorldProperties, initPlayerProperties } from '../config/init.ts';
import { registerConfigCommand } from '../config/form.ts';
import { setAttackCooldown } from '../shared/status.ts';
import { damageTest } from '../combat/checks.ts';
import { VERSION } from '../main.ts';

let SimulatedPlayer: any;
let gametest = true;

export function registerStartupHandlers(): void {
    import('@minecraft/server-gametest')
        .then((module) => {
            SimulatedPlayer = module.SimulatedPlayer;
        })
        .catch(() => {
            gametest = false;
        });

    system.beforeEvents.startup.subscribe(({ itemComponentRegistry }) => {
        itemComponentRegistry.registerCustomComponent('sweepnslash:stats', {});
        itemComponentRegistry.registerCustomComponent('sweepnslash:flags', {});
    });

    system.beforeEvents.startup.subscribe((init) => {
        registerConfigCommand(init);
    });

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
        setAttackCooldown(player, system.currentTick);
    });

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

    world.afterEvents.weatherChange.subscribe(({ dimension, newWeather }) => {
        const type = DimensionTypes.get(dimension)!;
        world.setDynamicProperty(`sns:weather:${type.typeId}`, newWeather);
    });
}
