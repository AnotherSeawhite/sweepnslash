// packs/data/gametests/src/stats/entity.ts
import { Entity } from '@minecraft/server';
import { EntityStats } from '../importStats.js';
import { entityStats } from './loader.js';

export function getEntityStats(entity: Entity): EntityStats | undefined {
    return entityStats.find((ent) => ent.id === entity?.typeId);
}
