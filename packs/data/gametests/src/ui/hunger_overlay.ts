import { Player } from '@minecraft/server';
import { getSaturation, getExhaustion, getHunger } from '../food/accessors.ts';
import { FOOD_LOOKUP } from '../food/lookup.ts';

export interface HungerData {
    sat: number;
    exh: number;
    hun: number;
    fnut: number;
    fsat: number;
    foodHeld: boolean;
}

export function getHungerData(player: Player, currentTick: number): HungerData {
    const sat = Math.round(getSaturation(player) ?? 0);
    const exh = Math.round((getExhaustion(player) ?? 0) * 10);
    const hun = Math.round(getHunger(player) ?? 0);

    const hungerOverlay = player.getDynamicProperty('hungerOverlay') ?? true;
    const base = { sat: hungerOverlay ? sat : 0, exh: hungerOverlay ? exh : 0, hun, fnut: 0, fsat: 0, foodHeld: false };

    const foodPreview = player.getDynamicProperty('foodPreview') ?? true;
    if (!foodPreview) return base;

    const inv = player.getComponent('inventory');
    if (!inv) return base;
    const item = inv.container?.getItem(player.selectedSlotIndex);
    if (!item) return base;

    // Try API component first (works for custom items), fall back to lookup table
    const foodComp = item.getComponent('minecraft:food');
    let nutrition: number;
    let satMod: number;
    if (foodComp) {
        nutrition = foodComp.nutrition;
        satMod = foodComp.saturationModifier;
    } else {
        const entry = FOOD_LOOKUP.get(item.typeId);
        if (!entry) return base;
        nutrition = entry.nutrition;
        satMod = entry.saturation;
    }

    // Blink: alternate every 10 ticks (same cadence as AppSkin)
    const inPreviewPhase = Math.floor(currentTick / 10) % 2 === 0;
    const previewHunger = Math.min(20, hun + nutrition);
    const previewSat = Math.min(20, sat + nutrition * satMod * 2);

    return {
        sat: hungerOverlay ? sat : 0,
        exh: hungerOverlay ? exh : 0,
        hun,
        fnut: inPreviewPhase ? Math.round(previewHunger) : 0,
        fsat: inPreviewPhase ? Math.round(previewSat) : 0,
        foodHeld: true,
    };
}
