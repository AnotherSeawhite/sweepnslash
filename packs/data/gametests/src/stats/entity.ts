import { Entity } from '@minecraft/server';
import { EntityStats } from '../importStats.ts';
import { entityStats } from './loader.ts';

export function getEntityStats(entity: Entity): EntityStats | undefined {
    return entityStats.find((ent) => ent.id === entity?.typeId);
}
