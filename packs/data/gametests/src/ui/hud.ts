import { Player } from '@minecraft/server';
import { getStatus } from '../shared/status.ts';
import { tickIndicator } from './indicator.ts';
import { getFoodOverlayData } from './food_overlay.ts';
import { getEquipmentData } from './equipment_overlay.ts';

export function tickHUD(player: Player, currentTick: number, addonToggle: boolean): void {
    const status = getStatus(player);
    const { mode, pixel, ready, subtitle } = tickIndicator(player, currentTick, addonToggle);
    const { sat, exh, hun, fnut, fsat, falpha, foodHeld } = getFoodOverlayData(player, currentTick);
    const eq = getEquipmentData(player);

    const hasEquipment =
        eq.hMax > 0 || eq.cMax > 0 || eq.lMax > 0 || eq.fMax > 0 || eq.oMax > 0;
    const isActive = mode !== 'non' || sat > 0 || exh > 0 || foodHeld || hasEquipment;

    if (!isActive && !status.showBar) return;
    status.showBar = isActive;

    const pad2 = (n: number) => String(n).padStart(2, '0');
    const pad5 = (n: number) => String(n).padStart(5, '_');
    const side = ((player.getDynamicProperty('armorSide') as number) ?? 0) === 0 ? 'r' : 'l';

    const title = [
        `_sweepnslash:${mode}:${ready ? 't' : 'f'}:${pad2(pixel)}`,
        `${pad2(sat)}:${pad2(exh)}:${pad2(hun)}:${pad2(fnut)}:${pad2(fsat)}:${pad2(falpha)}`,
        `${side}`,
        `${pad5(eq.hCur)}:${pad5(eq.hMax)}`,
        `${pad5(eq.cCur)}:${pad5(eq.cMax)}`,
        `${pad5(eq.lCur)}:${pad5(eq.lMax)}`,
        `${pad5(eq.fCur)}:${pad5(eq.fMax)}`,
        `${pad5(eq.oCur)}:${pad5(eq.oMax)}`,
    ].join(':');

    player.onScreenDisplay.setTitle(title, {
        fadeInDuration: 0,
        fadeOutDuration: 0,
        stayDuration: 0,
    });
    player.sendMessage(title); // DEBUG - intentional per user
    if (mode === 'sub' && subtitle !== undefined) {
        player.onScreenDisplay.setTitle(' ', {
            fadeInDuration: 0,
            fadeOutDuration: 0,
            stayDuration: 10,
            subtitle,
        });
    }
}
