import { Player } from '@minecraft/server';
import { getStatus } from '../shared/status.ts';
import { tickIndicator } from './indicator.ts';
import { getFoodOverlayData } from './food_overlay.ts';
import { getEquipmentData } from './equipment_overlay.ts';
import { getProjectileData, formatArrowCount } from './projectile_overlay.ts';

export function tickHUD(player: Player, currentTick: number, addonToggle: boolean): void {
    const status = getStatus(player);
    const { mode, pixel, ready, subtitle } = tickIndicator(player, currentTick, addonToggle);
    const { sat, exh, hun, fnut, fsat, falpha, foodHeld } = getFoodOverlayData(
        player,
        currentTick,
    );
    const eq = getEquipmentData(player);
    const proj = getProjectileData(player);

    const hasEquipment =
        eq.showArmor ||
        eq.showOffhand ||
        eq.hMax > 0 ||
        eq.cMax > 0 ||
        eq.lMax > 0 ||
        eq.fMax > 0 ||
        eq.oMax > 0;
    const isActive =
        mode !== 'non' || sat > 0 || exh > 0 || foodHeld || hasEquipment || proj.showOverlay;

    if (!isActive && !status.showBar) return;
    status.showBar = isActive;

    const pad2 = (n: number) => String(n).padStart(2, '0');
    const pad3 = (n: number) => String(n).padStart(3, '0');
    const padDur = (n: number) => String(n).padStart(5, '0'); // '0'-padded for durability fields

    // Warning computation
    const equipWarnThreshold =
        (player.getDynamicProperty('equipWarnThreshold') as number) ?? 10;
    const ammoWarnThreshold = (player.getDynamicProperty('ammoWarnThreshold') as number) ?? 16;
    const warningsOn = (player.getDynamicProperty('projectileWarnings') as boolean) ?? true;

    const warnSlot = (cur: number, max: number) =>
        warningsOn && max > 0 && cur / max < equipWarnThreshold / 100;

    const wh = warnSlot(eq.hCur, eq.hMax);
    const wc = warnSlot(eq.cCur, eq.cMax);
    const wl = warnSlot(eq.lCur, eq.lMax);
    const wf = warnSlot(eq.fCur, eq.fMax);
    const wo = warnSlot(eq.oCur, eq.oMax);
    const wa = warningsOn && proj.showOverlay && proj.count < ammoWarnThreshold;

    // Show flags
    const show =
        (eq.showArmor ? 't' : 'f') +
        (eq.showOffhand ? 't' : 'f') +
        (proj.showOverlay ? 't' : 'f') +
        ((player.getDynamicProperty('hungerOverlay') ?? true) ? 't' : 'f');

    const warn =
        (wh ? 't' : 'f') +
        (wc ? 't' : 'f') +
        (wl ? 't' : 'f') +
        (wf ? 't' : 'f') +
        (wo ? 't' : 'f') +
        (wa ? 't' : 'f');

    // Title assembly
    const title = [
        `_sweepnslash:${mode}:${ready ? 't' : 'f'}:${pad2(pixel)}`,
        `${pad2(sat)}:${pad2(exh)}:${pad2(hun)}:${pad2(fnut)}:${pad2(fsat)}:${pad3(Math.round(falpha * 100))}`,
        `${padDur(eq.hCur)}:${padDur(eq.hMax)}`,
        `${padDur(eq.cCur)}:${padDur(eq.cMax)}`,
        `${padDur(eq.lCur)}:${padDur(eq.lMax)}`,
        `${padDur(eq.fCur)}:${padDur(eq.fMax)}`,
        `${padDur(eq.oCur)}:${padDur(eq.oMax)}`,
        `${formatArrowCount(proj.count)}`,
        `${pad2(proj.slot)}`,
        `${show}`,
        `${warn}`,
    ].join(':');

    player.onScreenDisplay.setTitle(title, {
        fadeInDuration: 0,
        fadeOutDuration: 0,
        stayDuration: 0,
    });
    if (mode === 'sub' && subtitle !== undefined) {
        player.onScreenDisplay.setTitle(' ', {
            fadeInDuration: 0,
            fadeOutDuration: 0,
            stayDuration: 10,
            subtitle,
        });
    }

    DEBUG: {
        player.onScreenDisplay.setActionBar(title);
    }
}
