// packs/data/gametests/src/ui/equipment_overlay.ts
import { Player, EquipmentSlot } from '@minecraft/server';
import { OverlayMode } from './overlay_mode';

export interface EquipmentData {
    hCur: number;
    hMax: number;
    cCur: number;
    cMax: number;
    lCur: number;
    lMax: number;
    fCur: number;
    fMax: number;
    oCur: number;
    oMax: number;
    showArmor: boolean;
    showOffhand: boolean;
}

function slotDurability(
    player: Player,
    slot: EquipmentSlot,
): { cur: number; max: number; occupied: boolean } {
    const item = player.getComponent('equippable')?.getEquipment(slot);
    if (!item) return { cur: 0, max: 0, occupied: false };
    const dur = item.getComponent('durability');
    if (!dur) return { cur: 0, max: 0, occupied: true };
    return { cur: dur.maxDurability - dur.damage, max: dur.maxDurability, occupied: true };
}

export function getEquipmentData(player: Player): EquipmentData {
    const armorMode =
        (player.getDynamicProperty('armorMode') as OverlayMode) ?? OverlayMode.Auto;
    const offhandMode =
        (player.getDynamicProperty('offhandMode') as OverlayMode) ?? OverlayMode.Always;

    const h = slotDurability(player, EquipmentSlot.Head);
    const c = slotDurability(player, EquipmentSlot.Chest);
    const l = slotDurability(player, EquipmentSlot.Legs);
    const f = slotDurability(player, EquipmentSlot.Feet);
    const o = slotDurability(player, EquipmentSlot.Offhand);

    const anyArmorOccupied = h.occupied || c.occupied || l.occupied || f.occupied;

    const showArmor =
        armorMode === OverlayMode.Always ||
        (armorMode === OverlayMode.Auto && anyArmorOccupied);
    const showOffhand =
        offhandMode === OverlayMode.Always || (offhandMode === OverlayMode.Auto && o.occupied);

    const ad = armorMode === OverlayMode.Disabled;
    const od = offhandMode === OverlayMode.Disabled;

    return {
        hCur: ad ? 0 : h.cur,
        hMax: ad ? 0 : h.max,
        cCur: ad ? 0 : c.cur,
        cMax: ad ? 0 : c.max,
        lCur: ad ? 0 : l.cur,
        lMax: ad ? 0 : l.max,
        fCur: ad ? 0 : f.cur,
        fMax: ad ? 0 : f.max,
        oCur: od ? 0 : o.cur,
        oMax: od ? 0 : o.max,
        showArmor,
        showOffhand,
    };
}
