import {
    CustomCommandSource,
    CustomCommandStatus,
    Player,
    PlayerPermissionLevel,
    system,
    world,
} from '@minecraft/server';
import { FormCancelationReason, ModalFormData } from '@minecraft/server-ui';
import { clampNumber } from '../minecraft-math.ts';
import { Sounds } from '../Files.d';

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

    let form = new ModalFormData().title({ translate: 'sweepnslash.configmenutitle' });

    function dp(object: any, { id, value }: { id: string; value?: any } = { id: '' }) {
        if (value !== undefined) object.setDynamicProperty(id, value);
        return object.getDynamicProperty(id);
    }

    if (tag == true) {
        form.label({ translate: 'sweepnslash.operatortoggleheader' });
        if (!world.isHardcore)
            form.toggle(
                { translate: 'sweepnslash.toggleaddon' },
                { defaultValue: dp(world, { id: 'addon_toggle' }) },
            );
        form.toggle(
            { translate: 'sweepnslash.toggledebugmode' },
            {
                defaultValue: dp(world, { id: 'debug_mode' }),
                tooltip: { translate: 'sweepnslash.toggledebugmode.tooltip' },
            },
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
            },
        );
        form.toggle(
            { translate: 'sweepnslash.saturationhealing' },
            {
                defaultValue: dp(world, { id: 'saturationHealing' }),
                tooltip: {
                    rawtext: [
                        { translate: 'sweepnslash.saturationhealing.tooltip' },
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

    form.label({ translate: 'sweepnslash.generaltoggleheader' });
    form.toggle(
        { translate: 'sweepnslash.excludepetfromsweep' },
        {
            defaultValue: dp(player, { id: 'excludePetFromSweep' }) ?? false,
            tooltip: { translate: 'sweepnslash.excludepetfromsweep.tooltip' },
        },
    );
    form.toggle(
        { translate: 'sweepnslash.tipmessagetoggle' },
        { defaultValue: dp(player, { id: 'tipMessage' }) ?? false },
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
        },
    );
    form.toggle(
        { translate: 'sweepnslash.bowhitsound' },
        { defaultValue: dp(player, { id: 'bowHitSound' }) ?? false },
    );
    form.toggle(
        { translate: 'sweepnslash.sweepparticles' },
        { defaultValue: dp(player, { id: 'sweep' }) ?? false },
    );
    form.toggle(
        { translate: 'sweepnslash.enchantedhitparticles' },
        { defaultValue: dp(player, { id: 'enchantedHit' }) ?? false },
    );
    form.toggle(
        { translate: 'sweepnslash.damageindicatorparticles' },
        { defaultValue: dp(player, { id: 'damageIndicator' }) ?? false },
    );
    form.toggle(
        { translate: 'sweepnslash.critparticles' },
        { defaultValue: dp(player, { id: 'criticalHit' }) ?? false },
    );
    form.divider();
    form.label({ translate: 'sweepnslash.sweepRGBtitle' });
    form.slider('§cR', 0, 255, { defaultValue: dp(player, { id: 'sweepR' }) ?? 255 });
    form.slider('§aG', 0, 255, { defaultValue: dp(player, { id: 'sweepG' }) ?? 255 });
    form.slider('§9B', 0, 255, { defaultValue: dp(player, { id: 'sweepB' }) ?? 255 });
    form.submitButton({ translate: 'sweepnslash.saveconfig' });

    form.show(player as any).then((response) => {
        const { canceled, formValues, cancelationReason } = response;
        configLastClosedMap.set(player.id, system.currentTick);

        function n(value: any) {
            const num = Number(value);
            if (isNaN(value)) player.sendMessage({ translate: 'sweepnslash.nan' });
            return isNaN(num) ? 0 : num;
        }

        if (response && canceled && cancelationReason === FormCancelationReason.UserBusy)
            return;

        if (canceled) {
            player.playSound(Sounds.SnsConfigCanceled);
            player.sendMessage({ translate: 'sweepnslash.canceled' });
            return;
        }

        player.playSound(Sounds.GamePlayerBowDing);
        player.sendMessage({ translate: 'sweepnslash.saved' });

        const rgbProps = ['sweepR', 'sweepG', 'sweepB'];

        function valuePush({ object, dynamicProperty, condition = true }: any) {
            if (!condition) return;
            while (formValues![formValuesPush] === undefined) {
                formValuesPush++;
            }
            const isRgb = rgbProps.includes(dynamicProperty);
            const value = isRgb
                ? clampNumber(n(formValues![formValuesPush]), 0, 255)
                : formValues![formValuesPush];
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
            { object: player, dynamicProperty: 'sweepR' },
            { object: player, dynamicProperty: 'sweepG' },
            { object: player, dynamicProperty: 'sweepB' },
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
            description: 'sweepnslash.commanddescription',
            permissionLevel: 0,
            cheatsRequired: false,
        },
        configFormOpener,
    );
}
