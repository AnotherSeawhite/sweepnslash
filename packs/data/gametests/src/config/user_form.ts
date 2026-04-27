import {
    CustomCommandSource,
    CustomCommandStatus,
    Player,
    system,
} from '@minecraft/server';
import { FormCancelationReason, ModalFormData } from '@minecraft/server-ui';
import { clampNumber } from '../shared/math.ts';
import { Sounds } from '../Files.ts';

const userConfigLastClosedMap = new Map<string, number>();
const userConfigCommand = 'sns:user_config';

export function userConfigFormOpener({ sourceEntity: player, sourceType }: any) {
    if (!(player instanceof Player && sourceType === CustomCommandSource.Entity)) {
        return {
            status: CustomCommandStatus.Failure,
            message: 'Target must be player-type and command executor must be entity',
        };
    }
    system.run(() => userConfigForm(player));
    return { status: CustomCommandStatus.Success };
}

export function userConfigForm(player: Player): void {
    if ((userConfigLastClosedMap.get(player.id) ?? 0) + 20 > system.currentTick) return;

    let formValuesPush = 0;

    function dp(object: any, { id, value }: { id: string; value?: any } = { id: '' }) {
        if (value !== undefined) object.setDynamicProperty(id, value);
        return object.getDynamicProperty(id);
    }

    const form = new ModalFormData()
        .title({ translate: 'sweepnslash.user_config.menu.title' })
        .label({ translate: 'sweepnslash.config.personal.header' })
        .dropdown(
            { translate: 'sweepnslash.config.personal.indicator' },
            [
                { translate: 'sweepnslash.config.personal.indicator.crosshair' },
                { translate: 'sweepnslash.config.personal.indicator.hotbar' },
                { translate: 'sweepnslash.config.personal.indicator.geyser' },
                { translate: 'sweepnslash.config.personal.indicator.none' },
            ],
            {
                defaultValueIndex: dp(player, { id: 'cooldownStyle' }),
                tooltip: { translate: 'sweepnslash.config.personal.indicator.tooltip' },
            },
        )
        .toggle(
            { translate: 'sweepnslash.config.personal.hunger_overlay' },
            {
                defaultValue: dp(player, { id: 'hungerOverlay' }) ?? true,
                tooltip: { translate: 'sweepnslash.config.personal.hunger_overlay.tooltip' },
            },
        )
        .toggle(
            { translate: 'sweepnslash.config.personal.bowhitsound' },
            { defaultValue: dp(player, { id: 'bowHitSound' }) ?? false },
        )
        .toggle(
            { translate: 'sweepnslash.config.personal.sweep.particles' },
            { defaultValue: dp(player, { id: 'sweep' }) ?? false },
        )
        .toggle(
            { translate: 'sweepnslash.config.personal.enchanted.particles' },
            { defaultValue: dp(player, { id: 'enchantedHit' }) ?? false },
        )
        .toggle(
            { translate: 'sweepnslash.config.personal.damage.particles' },
            { defaultValue: dp(player, { id: 'damageIndicator' }) ?? false },
        )
        .toggle(
            { translate: 'sweepnslash.config.personal.crit.particles' },
            { defaultValue: dp(player, { id: 'criticalHit' }) ?? false },
        )
        .divider()
        .label({ translate: 'sweepnslash.config.personal.sweep.rgb' })
        .slider('§cR', 0, 255, { defaultValue: dp(player, { id: 'sweepR' }) ?? 255 })
        .slider('§aG', 0, 255, { defaultValue: dp(player, { id: 'sweepG' }) ?? 255 })
        .slider('§9B', 0, 255, { defaultValue: dp(player, { id: 'sweepB' }) ?? 255 })
        .submitButton({ translate: 'sweepnslash.config.save' });

    form.show(player as any).then((response) => {
        const { canceled, formValues, cancelationReason } = response;
        userConfigLastClosedMap.set(player.id, system.currentTick);

        function n(value: any) {
            const num = Number(value);
            if (isNaN(num)) player.sendMessage({ translate: 'sweepnslash.config.status.nan' });
            return isNaN(num) ? 0 : num;
        }

        if (response && canceled && cancelationReason === FormCancelationReason.UserBusy) return;

        if (canceled) {
            player.playSound(Sounds.SnsConfigCanceled);
            player.sendMessage({ translate: 'sweepnslash.config.status.canceled' });
            return;
        }

        player.playSound(Sounds.GamePlayerBowDing);
        player.sendMessage({ translate: 'sweepnslash.config.status.saved' });

        const rgbProps = ['sweepR', 'sweepG', 'sweepB'];

        function valuePush({ object, dynamicProperty, condition = true }: any) {
            if (!condition) return;
            while (formValues![formValuesPush] === undefined) formValuesPush++;
            const isRgb = rgbProps.includes(dynamicProperty);
            const value = isRgb
                ? clampNumber(n(formValues![formValuesPush]), 0, 255)
                : formValues![formValuesPush];
            object.setDynamicProperty(dynamicProperty, value);
            formValuesPush++;
        }

        const properties = [
            { object: player, dynamicProperty: 'cooldownStyle' },
            { object: player, dynamicProperty: 'hungerOverlay' },
            { object: player, dynamicProperty: 'bowHitSound' },
            { object: player, dynamicProperty: 'sweep' },
            { object: player, dynamicProperty: 'enchantedHit' },
            { object: player, dynamicProperty: 'damageIndicator' },
            { object: player, dynamicProperty: 'criticalHit' },
            { object: player, dynamicProperty: 'sweepR' },
            { object: player, dynamicProperty: 'sweepG' },
            { object: player, dynamicProperty: 'sweepB' },
        ];

        properties.forEach(valuePush);
    });
}

export function registerUserConfigCommand(init: any): void {
    init.customCommandRegistry.registerCommand(
        {
            name: userConfigCommand,
            description: 'sweepnslash.user_config.command.description',
            permissionLevel: 0,
            cheatsRequired: false,
        },
        userConfigFormOpener,
    );
}
