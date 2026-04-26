import { Entity, PlayerSoundOptions, world } from '@minecraft/server';
import { Debug } from '../shared/debug.ts';

export function playSelectiveSound(
    entity: Entity,
    soundId: string,
    dynamicProperty: string,
    soundOptions?: PlayerSoundOptions,
): void {
    for (const p of world.getAllPlayers()) {
        try {
            if (
                p.getDynamicProperty(dynamicProperty) == true &&
                p.dimension.id == entity.dimension.id
            )
                p.playSound(soundId, soundOptions);
        } catch (e) {
            Debug.error(e);
        }
    }
}
