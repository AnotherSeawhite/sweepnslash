import { Player } from '@minecraft/server';
import { getSaturation, getExhaustion, getHunger } from '../food/accessors.ts';
import { FOOD_LOOKUP } from '../food/lookup.ts';

export interface FoodOverlayData {
    sat: number;
    exh: number;
    hun: number;
    fnut: number;
    fsat: number;
    falpha: number;
    foodHeld: boolean;
}

function getFlashAlpha(tick: number, maxAlpha = 1.0) {
    const pos = tick % 32;

    const unclamped =
        pos < 16
            ? -0.5 + pos * 0.125 // ascending
            : 1.5 - (pos - 16) * 0.125; // descending

    const clamped = Math.max(0, Math.min(1, unclamped));
    return clamped * Math.max(0, Math.min(1, maxAlpha));
}

export function getFoodOverlayData(player: Player, currentTick: number): FoodOverlayData {
    const sat = Math.round(getSaturation(player) ?? 0);
    const exh = Math.round((getExhaustion(player) ?? 0) * 10);
    const hun = Math.round(getHunger(player) ?? 0);

    const foodOverlay = player.getDynamicProperty('foodOverlay') ?? true;
    const base: FoodOverlayData = {
        sat: foodOverlay ? sat : 0,
        exh: foodOverlay ? exh : 0,
        hun,
        fnut: 0,
        fsat: 0,
        falpha: 0,
        foodHeld: false,
    };

    const maxAlpha = (player.getDynamicProperty('foodPreviewMaxAlpha') as number) ?? 1.0;

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

    const previewHunger = Math.min(20, hun + nutrition);
    const previewSat = Math.min(20, sat + nutrition * satMod * 2);

    return {
        sat: foodOverlay ? sat : 0,
        exh: foodOverlay ? exh : 0,
        hun,
        fnut: Math.round(previewHunger),
        fsat: Math.round(previewSat),
        falpha: getFlashAlpha(currentTick, maxAlpha),
        foodHeld: true,
    };
}
