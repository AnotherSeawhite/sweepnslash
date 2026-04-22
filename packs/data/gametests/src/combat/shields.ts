// packs/data/gametests/src/combat/shields.ts
import { Entity, GameMode, Player, world } from '@minecraft/server';
import { calculateAngle, sub } from '../shared/math.js';
import { getStatus } from '../shared/status.js';
import { hasItemFlag } from '../stats/item.js';
import { specialValid } from './checks.js';

export function shield(target: Entity): boolean {
    const slot = ['Mainhand', 'Offhand'];
    const targetEquippable = target.getComponent('equippable');
    const shieldCooldown = target.getItemCooldown('minecraft:shield');

    for (const s of slot) {
        const shieldItem = targetEquippable?.getEquipment(s as any)?.typeId === 'minecraft:shield';
        const isRiding = target.getComponent('riding')?.isValid ?? false;
        if (shieldItem && (target.isSneaking || isRiding) && shieldCooldown == 0) {
            return true;
        }
    }
    return false;
}

export function angle(player: Entity, target: Entity): boolean {
    const viewDir = target.getViewDirection();
    viewDir.y = 0;
    const pLoc = target.location;
    const entities = target.dimension.getEntities({ location: target.location });
    const inViewEntities = entities.filter((entity) => {
        const eLoc = entity.location;
        const toEntityVec = sub(eLoc, pLoc);
        toEntityVec.y = 0;
        const ang = calculateAngle(viewDir, toEntityVec);
        return ang >= -90 && ang <= 90;
    });
    return inViewEntities.some((e) => player === e);
}

export function shieldBlock(
    currentTick: number,
    player: Entity,
    target: Entity,
    stats: any,
    { disable = false }: { disable?: boolean } = {},
): boolean {
    const status = getStatus(target);
    let angleResult = false;
    let specialValidResult = true;

    if (target instanceof Player && target.getGameMode() == GameMode.Creative) return false;

    if (world.getDynamicProperty('shieldBreakSpecial') && player instanceof Player) {
        specialValidResult = specialValid(currentTick, player, stats);
    }

    if (status.shieldValid) {
        angleResult = angle(player, target);
        if (
            (stats?.disableShield || (player instanceof Player && hasItemFlag(player, 'disable_shield'))) &&
            angleResult &&
            specialValidResult &&
            disable
        ) {
            target.startItemCooldown('minecraft:shield', 100);
            player.dimension.playSound('random.break', target.location);
        }
    }
    return angleResult;
}
