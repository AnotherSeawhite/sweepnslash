// packs/data/gametests/src/ui/sounds.ts
import { Entity, PlayerSoundOptions, world } from '@minecraft/server';
import { debug } from '../shared/math.js';

export function playSelectiveSound(
    entity: Entity,
    soundId: string,
    dynamicProperty: string,
    soundOptions?: PlayerSoundOptions,
): void {
    const debugMode = world.getDynamicProperty('debug_mode');
    for (const p of world.getAllPlayers()) {
        try {
            if (
                p.getDynamicProperty(dynamicProperty) == true &&
                p.dimension.id == entity.dimension.id
            ) {
                p.playSound(soundId, soundOptions);
            }
        } catch (e) {
            if (debugMode) debug(String(e));
        }
    }
}
