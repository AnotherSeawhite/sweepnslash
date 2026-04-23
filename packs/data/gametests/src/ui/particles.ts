import { Entity, MolangVariableMap, world } from '@minecraft/server';
import { clampNumber } from '../minecraft-math.ts';
import { Particles } from '../Files.ts';
import { debug } from '../shared/math.ts';
import { getEntityStats } from '../stats/entity.ts';

export function toColor(vector3: { x: number; y: number; z: number }) {
    const { x, y, z } = vector3;
    const rand = Math.random() * 0.6 + 0.4;
    return {
        red: (clampNumber(x, 0, 255) / 255) * rand,
        green: (clampNumber(y, 0, 255) / 255) * rand,
        blue: (clampNumber(z, 0, 255) / 255) * rand,
    };
}

export function spawnSelectiveParticle(
    entity: Entity,
    effectName: string,
    location: { x: number; y: number; z: number },
    dynamicProperty: string,
    offset: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
    molangVariables?: MolangVariableMap,
): void {
    const debugMode = world.getDynamicProperty('debug_mode');
    const offsetLocation = {
        x: location.x + offset.x,
        y: location.y + offset.y,
        z: location.z + offset.z,
    };
    for (const p of world.getAllPlayers()) {
        try {
            if (
                p.getDynamicProperty(dynamicProperty) == true &&
                p.dimension.id == entity.dimension.id
            ) {
                molangVariables
                    ? p.spawnParticle(effectName, offsetLocation, molangVariables)
                    : p.spawnParticle(effectName, offsetLocation);
            }
        } catch (e) {
            if (debugMode) debug(String(e));
        }
    }
}

export function healthParticle(entity: Entity, damage: number): void {
    const loc = entity.location;
    const head = entity.getHeadLocation();
    const entityOffset = getEntityStats(entity)?.centerOffset ?? { x: 0, y: 0, z: 0 };
    const center = {
        x: loc.x + entityOffset.x,
        y: (loc.y + head.y) / 2 + 0.5 + entityOffset.y,
        z: loc.z + entityOffset.z,
    };

    const hp = entity.getComponent('health');
    const dmg = clampNumber(damage, hp!.effectiveMin, hp!.effectiveMax) / 2;
    const amount = Math.trunc(dmg);
    const map = new MolangVariableMap();
    map.setFloat('variable.amount', amount);
    spawnSelectiveParticle(
        entity,
        Particles.DamageIndicatorEmitter,
        center,
        'damageIndicator',
        undefined,
        map,
    );
}
