// packs/data/gametests/src/ui/projectile_overlay.ts
import { Player, EquipmentSlot } from '@minecraft/server';
import { OverlayMode } from './overlay_mode';

export interface ProjectileData {
    count: number;
    showOverlay: boolean;
    slot: number; // 0-35 = inventory slot, 36 = offhand, 99 = none
}

// Priority-ordered list of projectile typeIds per shooter
const SHOOTER_PROJECTILES = new Map<string, string[]>([
    ['minecraft:bow', ['minecraft:arrow']],
    ['minecraft:crossbow', ['minecraft:arrow', 'minecraft:firework_rocket']],
]);

// Default types when no shooter is held and arrowMode=Always
const ALWAYS_FALLBACK_TYPES: string[] = ['minecraft:arrow'];

// Types that only function as ammo from the offhand slot (not from inventory)
const OFFHAND_ONLY_PROJECTILES = new Set<string>(['minecraft:firework_rocket']);

// 5-char '_'-padded arrow count string
export function formatArrowCount(n: number): string {
    if (n < 1000) return String(n).padStart(5, '_');
    const k = n / 1000;
    // k.toFixed(1) rounds 9.95→'10.0' (6 chars); redirect to floor branch in that case
    // Realistic max is ~2.3k so this edge is purely defensive
    return k < 9.95 ? `_${k.toFixed(1)}k` : String(Math.round(k) + 'k').padStart(5, '_');
}

// Sum all instances of typeId across the 36 main inventory slots + offhand
function countType(player: Player, typeId: string): number {
    const inv = player.getComponent('inventory')?.container;
    let total = 0;
    if (inv) {
        for (let i = 0; i < inv.size; i++) {
            const item = inv.getItem(i);
            if (item?.typeId === typeId) total += item.amount;
        }
    }
    const offhand = player.getComponent('equippable')?.getEquipment(EquipmentSlot.Offhand);
    if (offhand?.typeId === typeId) total += offhand.amount;
    return total;
}

// Resolve which projectile type to use and where the first one lives.
// Priority: offhand (regardless of type priority order) → inventory (by type priority order).
function resolveAmmo(
    player: Player,
    projectileTypes: string[],
): { type: string; slot: number; count: number } | null {
    const offhand = player.getComponent('equippable')?.getEquipment(EquipmentSlot.Offhand);
    if (offhand && projectileTypes.includes(offhand.typeId)) {
        return { type: offhand.typeId, slot: 36, count: countType(player, offhand.typeId) };
    }

    const inv = player.getComponent('inventory')?.container;
    if (!inv) return null;

    for (const type of projectileTypes) {
        if (OFFHAND_ONLY_PROJECTILES.has(type)) continue; // e.g. fireworks only work from offhand
        for (let i = 0; i < inv.size; i++) {
            const item = inv.getItem(i);
            if (item?.typeId === type) {
                return { type, slot: i, count: countType(player, type) };
            }
        }
    }

    return null;
}

export function getProjectileData(player: Player): ProjectileData {
    const arrowMode = (player.getDynamicProperty('arrowMode') as string) ?? OverlayMode.Auto;

    if (arrowMode === OverlayMode.Disabled) return { count: 0, showOverlay: false, slot: 99 };

    const inv = player.getComponent('inventory')?.container;
    const mainHand = inv?.getItem(player.selectedSlotIndex);
    let projectileTypes = mainHand ? SHOOTER_PROJECTILES.get(mainHand.typeId) : undefined;

    if (!projectileTypes) {
        if (arrowMode === OverlayMode.Always) {
            // No shooter held but always-show: default to arrow
            projectileTypes = ALWAYS_FALLBACK_TYPES;
        } else {
            return { count: 0, showOverlay: false, slot: 99 };
        }
    }

    const resolved = resolveAmmo(player, projectileTypes);
    if (!resolved) return { count: 0, showOverlay: true, slot: 99 };

    return { count: resolved.count, showOverlay: true, slot: resolved.slot };
}
