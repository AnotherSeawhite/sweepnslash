import { Entity } from '@minecraft/server';
import { Vec3 } from '@bedrock-oss/bedrock-boost';
import { lambertW0, lambertWm1 } from '../lambertw.ts';
import { Debug } from '../shared/debug.ts';

export function applyAttackKnockback(
    entity: Entity,
    location: { x: number; y: number; z: number },
    max_height = 1,
): void {
    const delta = Vec3.from(location).subtract(entity.location);
    const y_max = Math.max(max_height, delta.y + max_height);
    const a = 0.08;
    const d = 0.02;

    const ln = Math.log1p(-d);
    const vy =
        (a *
            (d - 1) *
            (lambertWm1(-Math.exp(-(y_max * d * ln + a * d - a) / (a * (d - 1)))) + 1)) /
        d;
    const e = Math.exp((delta.y * d * ln + a + d * (vy - a)) / (a * (d - 1)));
    const W = lambertW0((-(a * (d - 1) - vy * d) * e) / (a * (d - 1)));
    const time =
        (-a * (d - 1) * W + delta.y * d * ln + a * (1 - d) + vy * d) / (a * (d - 1) * ln);

    const m0 = 1.5;
    const multiplier = (m0 - 1) * Math.pow((66 - Math.min(time, 66)) / 66, 2) + 1;
    const vx = delta.x * 0.33 * multiplier;
    const vz = delta.z * 0.33 * multiplier;
    applyImpulseAsKnockback(entity, { x: vx, y: vy, z: vz });
}

export function applyImpulseAsKnockback(
    entity: Entity,
    vector3: { x: number; y: number; z: number },
): void {
    const { x, y, z } = vector3;
    const horizontalStrength = Math.sqrt(x * x + z * z);
    const verticalStrength = y;
    const directionX = horizontalStrength !== 0 ? x / horizontalStrength : 0;
    const directionZ = horizontalStrength !== 0 ? z / horizontalStrength : 0;

    try {
        entity.applyKnockback({ x: 0, z: 0 }, 0);
        const vel = entity.getVelocity();
        entity.applyKnockback(
            {
                x: vel.x + directionX * horizontalStrength,
                z: vel.z + directionZ * horizontalStrength,
            },
            verticalStrength + (entity.isOnGround ? 0 : vel.y),
        );
    } catch (e) {
        Debug.error('Error during knockback:', e);
    }
}
