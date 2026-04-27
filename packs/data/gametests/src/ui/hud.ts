import { Player } from '@minecraft/server';
import { getStatus } from '../shared/status.ts';
import { tickIndicator } from './indicator.ts';
import { getHungerData } from './hunger_overlay.ts';

export function tickHUD(player: Player, currentTick: number, addonToggle: boolean): void {
    const status = getStatus(player);
    const { mode, pixel, ready, subtitle } = tickIndicator(player, currentTick, addonToggle);
    const { sat, exh } = getHungerData(player);

    // Skip sending when nothing is active and we already cleared
    const isActive = mode !== 'non' || sat > 0 || exh > 0;
    if (!isActive && !status.showBar) return;
    status.showBar = isActive;

    const pad2 = (n: number) => String(n).padStart(2, '0');
    const title = `_sweepnslash|${mode}|${ready ? 't' : 'f'}|${pad2(pixel)}|${pad2(sat)}|${pad2(exh)}`;

    if (mode === 'sub' && subtitle !== undefined) {
        // Sub (Geyser) mode: send data title first (stayDuration 0), then visual subtitle title
        player.onScreenDisplay.setTitle(title, {
            fadeInDuration: 0,
            fadeOutDuration: 0,
            stayDuration: 0,
        });
        player.onScreenDisplay.setTitle(' ', {
            fadeInDuration: 0,
            fadeOutDuration: 0,
            stayDuration: 10,
            subtitle,
        });
    } else {
        player.onScreenDisplay.setTitle(title, {
            fadeInDuration: 0,
            fadeOutDuration: 0,
            stayDuration: 0,
        });
    }
}
