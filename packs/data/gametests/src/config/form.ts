import {
    CustomCommandSource,
    CustomCommandStatus,
    Player,
    PlayerPermissionLevel,
    system,
    world,
} from '@minecraft/server';
import { FormCancelationReason, ModalFormData } from '@minecraft/server-ui';
import { Sounds } from '../Files.ts';

const configLastClosedMap = new Map<string, number>();

const configCommand = 'sns:config';

export function configFormOpener({ sourceEntity: player, sourceType }: any) {
    if (!(player instanceof Player && sourceType === CustomCommandSource.Entity)) {
        return {
            status: CustomCommandStatus.Failure,
            message: 'Target must be player-type and command executor must be entity',
        };
    }
    system.run(() => configForm(player));
    return { status: CustomCommandStatus.Success };
}

export function configForm(player: Player): void {
    if ((configLastClosedMap.get(player.id) ?? 0) + 20 > system.currentTick) return;

    const tag = player.hasTag('sweepnslash.config');
    const op = player.playerPermissionLevel == PlayerPermissionLevel.Operator;
    let formValuesPush = 0;

    let form = new ModalFormData().title({ translate: 'sweepnslash.config.menu.title' });

    function dp(object: any, { id, value }: { id: string; value?: any } = { id: '' }) {
        if (value !== undefined) object.setDynamicProperty(id, value);
        return object.getDynamicProperty(id);
    }

    if (tag == true) {
        form.label({ translate: 'sweepnslash.config.operator.header' });
        if (!world.isHardcore)
            form.toggle(
                { translate: 'sweepnslash.config.operator.addon' },
                { defaultValue: dp(world, { id: 'addon_toggle' }) },
            );
        form.toggle(
            { translate: 'sweepnslash.config.operator.debug' },
            {
                defaultValue: dp(world, { id: 'debug_mode' }),
                tooltip: { translate: 'sweepnslash.config.operator.debug.tooltip' },
            },
        );
        form.divider();
    }

    if (op == true) {
        form.label({ translate: 'sweepnslash.config.server.header' });
        form.toggle(
            { translate: 'sweepnslash.config.server.shieldbreak' },
            {
                defaultValue: dp(world, { id: 'shieldBreakSpecial' }),
                tooltip: { translate: 'sweepnslash.config.server.shieldbreak.tooltip' },
            },
        );
        form.toggle(
            { translate: 'sweepnslash.config.server.saturation' },
            {
                defaultValue: dp(world, { id: 'saturationHealing' }),
                tooltip: {
                    rawtext: [
                        { translate: 'sweepnslash.config.server.saturation.tooltip' },
                        { text: '\n\n' },
                        { translate: 'createWorldScreen.naturalregeneration' },
                        { text: ': ' },
                        { text: world.gameRules.naturalRegeneration ? '§aON' : '§cOFF' },
                    ],
                },
            },
        );
        form.divider();
    }

    form.label({ translate: 'sweepnslash.config.general.header' });
    form.toggle(
        { translate: 'sweepnslash.config.general.excludepet' },
        {
            defaultValue: dp(player, { id: 'excludePetFromSweep' }) ?? false,
            tooltip: { translate: 'sweepnslash.config.general.excludepet.tooltip' },
        },
    );
    form.toggle(
        { translate: 'sweepnslash.config.general.tipmessage' },
        { defaultValue: dp(player, { id: 'tipMessage' }) ?? false },
    );
    form.submitButton({ translate: 'sweepnslash.config.save' });

    form.show(player as any).then((response) => {
        const { canceled, formValues, cancelationReason } = response;
        configLastClosedMap.set(player.id, system.currentTick);

        if (response && canceled && cancelationReason === FormCancelationReason.UserBusy)
            return;

        if (canceled) {
            player.playSound(Sounds.SnsConfigCanceled);
            player.sendMessage({ translate: 'sweepnslash.config.status.canceled' });
            return;
        }

        player.playSound(Sounds.GamePlayerBowDing);
        player.sendMessage({ translate: 'sweepnslash.config.status.saved' });

        function valuePush({ object, dynamicProperty, condition = true }: any) {
            if (!condition) return;
            while (formValues![formValuesPush] === undefined) {
                formValuesPush++;
            }
            object.setDynamicProperty(dynamicProperty, formValues![formValuesPush]);
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
        ];

        properties.forEach(valuePush);

        system.sendScriptEvent(
            'sweep-and-slash:toggle',
            `${world.getDynamicProperty('addon_toggle')}`,
        );
    });
}

export function registerConfigCommand(init: any): void {
    init.customCommandRegistry.registerCommand(
        {
            name: configCommand,
            description: 'sweepnslash.config.command.description',
            permissionLevel: 0,
            cheatsRequired: false,
        },
        configFormOpener,
    );
}
