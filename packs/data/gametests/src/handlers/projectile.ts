import { Player, world } from '@minecraft/server';
import { isTeam } from '../shared/team.ts';
import { getItemStats, itemHasFlag } from '../stats/item.ts';
import { Sounds } from '../Files.ts';

export function registerProjectileHandlers(): void {
    world.afterEvents.projectileHitEntity.subscribe((event) => {
        const { source: player, projectile } = event;
        const target = event.getEntityHit().entity;

        if (!player || !target) return;
        if (world.getDynamicProperty('addon_toggle') == false) return;
        if (isTeam(player, target)) return;

        const configCheck =
            player instanceof Player && player.getDynamicProperty('bowHitSound') == true;
        if (
            configCheck &&
            target instanceof Player &&
            player !== target &&
            projectile.typeId === 'minecraft:arrow'
        ) {
            (player as Player).playSound(Sounds.GamePlayerBowDing, { pitch: 0.5 });
        }
    });

    world.afterEvents.entitySpawn.subscribe(({ cause, entity }) => {
        if (world.getDynamicProperty('addon_toggle') == false) return;
        if (!entity?.isValid) return;

        const projectileComp = entity?.getComponent('projectile');
        const owner = projectileComp?.owner;
        if (!owner) return;

        const { item, stats } = getItemStats(owner as Player);
        if (stats?.noInherit || (item && itemHasFlag(item, 'no_inherit'))) return;

        const ownerVel = owner.getVelocity();
        entity.applyImpulse(ownerVel);
    });
}
