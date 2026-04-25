import { Entity, EntityDamageCause, MolangVariableMap, Player, world } from '@minecraft/server';
import { Vec3 } from '@bedrock-oss/bedrock-boost';
import { Particles } from '../Files.ts';
import { Debug } from '../shared/debug.ts';
import { getStatus } from '../shared/status.ts';
import { isTeam } from '../shared/team.ts';
import { hasItemFlag } from '../stats/item.ts';
import { spawnSelectiveParticle, toColor } from '../ui/particles.ts';
import { inanimate, specialValid, view } from './checks.ts';
import { shieldBlock } from './shields.ts';

export function sweep(
    currentTick: number,
    player: Player,
    target: Entity,
    stats: any,
    {
        fireAspect,
        damage,
        level = 1,
        forced,
        location,
        scale = 3,
    }: {
        fireAspect?: number;
        damage?: number;
        level?: number;
        forced?: boolean;
        location?: Vec3;
        scale?: number;
    } = {},
    {
        particle = Particles.SweepParticle,
        offset = Vec3.Zero,
        map,
    }: {
        particle?: string;
        offset?: Vec3;
        map?: MolangVariableMap;
    } = {},
): { swept: boolean; commonEntities: Entity[] } {
    const pvp = world.gameRules.pvp;
    const status = getStatus(player);
    const isRiding = player.getComponent('riding')?.isValid ?? false;
    const isFasterThanWalk_ = (() => {
        const movement = player.getComponent('movement');
        const speed = movement?.currentValue ?? 0;
        const walkSpeed = player.isSprinting ? speed * (10 / 13) : speed;
        const velocity = player.getVelocity();
        return Math.hypot(velocity.x, velocity.z) >= walkSpeed * 2.1585 && player.isSprinting;
    })();

    if (
        !(
            (stats?.sweep || hasItemFlag(player, 'sweep')) &&
            specialValid(currentTick, player, stats) &&
            status.critSweepValid
        ) &&
        forced == undefined
    )
        return { swept: false, commonEntities: [] };

    if (
        ((!player.isOnGround || isRiding || isFasterThanWalk_) && forced == undefined) ||
        forced === false
    )
        return { swept: false, commonEntities: [] };

    if (
        inanimate(target, {
            excludeTypes: [
                'minecraft:ender_crystal',
                'minecraft:armor_stand',
                'minecraft:boat',
                'minecraft:chest_boat',
                'minecraft:minecart',
                'minecraft:command_block_minecart',
                'minecraft:hopper_minecart',
                'minecraft:tnt_minecart',
            ],
        })
    )
        return { swept: false, commonEntities: [] };

    const dist = 1;
    const height = 0.15;
    const pLoc = player.location;
    const tLoc = location ?? target.location;
    const headLoc = player.getHeadLocation();

    const playerCenter = player.dimension.getEntities({ location: pLoc, maxDistance: scale });
    const targetCenter = player.dimension.getEntities({
        location: { x: tLoc.x - scale / 2, y: tLoc.y, z: tLoc.z - scale / 2 },
        volume: { x: scale, y: 0.25, z: scale },
    });

    const ridingOn = player.getComponent('riding')?.entityRidingOn;
    const commonEntities = playerCenter.filter(
        (entity) =>
            targetCenter.some((te) => te === entity) &&
            !inanimate(entity, {
                excludeTypes: ['minecraft:armor_stand', 'minecraft:ender_crystal'],
            }) &&
            entity !== target &&
            entity !== player &&
            entity !== ridingOn &&
            (!player.getDynamicProperty('excludePetFromSweep') ||
                (player.getDynamicProperty('excludePetFromSweep') &&
                    !(
                        entity.getComponent('is_tamed')?.isValid &&
                        entity.typeId !== 'minecraft:trader_llama'
                    ))),
    );

    if (damage == undefined) return { swept: false, commonEntities };
    if (damage <= 0) return { swept: false, commonEntities: [] };

    const rgb = toColor(Vec3.from(
        (player.getDynamicProperty('sweepR') as number) ?? 255,
        (player.getDynamicProperty('sweepG') as number) ?? 255,
        (player.getDynamicProperty('sweepB') as number) ?? 255,
    ));
    if (!map) {
        map = new MolangVariableMap();
        map.setFloat('variable.size', 1.0);
        map.setColorRGB('variable.color', rgb);
    }

    let particleLocation: Vec3;
    const inView = view(player) === target;
    if (inView || player.inputInfo.lastInputModeUsed !== 'Touch') {
        const rot = player.getRotation();
        particleLocation = Vec3.from(
            pLoc.x - Math.sin(rot.y * (Math.PI / 180)) * dist,
            (pLoc.y + headLoc.y) / 2 + height,
            pLoc.z + Math.cos(rot.y * (Math.PI / 180)) * dist,
        );
    } else {
        const direction = Vec3.from(tLoc).subtract(pLoc).setY(0);
        const mag = direction.length(); // sqrt(x²+z²) since y=0
        const unitDirection = { x: direction.x / mag, z: direction.z / mag };
        particleLocation = Vec3.from(
            pLoc.x + unitDirection.x * dist,
            (pLoc.y + headLoc.y) / 2 + height,
            pLoc.z + unitDirection.z * dist,
        );
    }
    spawnSelectiveParticle(
        player,
        particle,
        location || particleLocation,
        'sweep',
        offset,
        map,
    );

    commonEntities.forEach((e) => {
        if (isTeam(player, e)) return;
        const dmgType = shieldBlock(currentTick, player, e, stats, { disable: true })
            ? EntityDamageCause.entityExplosion
            : EntityDamageCause.entityAttack;
        const formula = 1 + damage! * (level / (level + 1));
        e.applyDamage(formula, { cause: dmgType, damagingEntity: player });
        try {
            if (e instanceof Player && !pvp) return;
            const fireImmune = e?.getComponent('fire_immune')?.isValid;
            if (!fireImmune && fireAspect) e.setOnFire(fireAspect * 4, true);
        } catch (err) {
            Debug.error(err);
        }
    });

    return { swept: true, commonEntities };
}
