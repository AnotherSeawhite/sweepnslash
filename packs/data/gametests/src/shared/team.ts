import { Entity } from '@minecraft/server';

export function isTeam(playerA: Entity, playerB: Entity): boolean {
    const prefix = 'ae_je:team:';
    const tagsA = playerA.getTags().filter((tag) => tag.startsWith(prefix));
    const tagsB = playerB.getTags().filter((tag) => tag.startsWith(prefix));
    return tagsA.some((tag) => tagsB.includes(tag));
}
