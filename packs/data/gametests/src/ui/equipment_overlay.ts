// packs/data/gametests/src/ui/equipment_overlay.ts
import { Player, EquipmentSlot } from '@minecraft/server';

export interface EquipmentData {
    hCur: number; hMax: number;
    cCur: number; cMax: number;
    lCur: number; lMax: number;
    fCur: number; fMax: number;
    oCur: number; oMax: number;
}

function slotDurability(player: Player, slot: EquipmentSlot): { cur: number; max: number } {
    const item = player.getComponent('equippable')?.getEquipment(slot);
    if (!item) return { cur: 0, max: 0 };
    const dur = item.getComponent('durability');
    if (!dur) return { cur: 0, max: 0 }; // unbreakable item
    return { cur: dur.maxDurability - dur.damage, max: dur.maxDurability };
}

export function getEquipmentData(player: Player): EquipmentData {
    const disabled = !(player.getDynamicProperty('armorOverlay') ?? true);
    if (disabled) return { hCur: 0, hMax: 0, cCur: 0, cMax: 0, lCur: 0, lMax: 0, fCur: 0, fMax: 0, oCur: 0, oMax: 0 };

    const h = slotDurability(player, EquipmentSlot.Head);
    const c = slotDurability(player, EquipmentSlot.Chest);
    const l = slotDurability(player, EquipmentSlot.Legs);
    const f = slotDurability(player, EquipmentSlot.Feet);
    const o = slotDurability(player, EquipmentSlot.Offhand);

    return { hCur: h.cur, hMax: h.max, cCur: c.cur, cMax: c.max, lCur: l.cur, lMax: l.max, fCur: f.cur, fMax: f.max, oCur: o.cur, oMax: o.max };
}
