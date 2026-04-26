import { world } from '@minecraft/server';
import { getStatus } from '../shared/status.ts';
import { itemHasFlag } from '../stats/item.ts';
import { inventoryAddLore } from '../shared/lore.ts';

export function registerPlayerHandlers(): void {
    world.afterEvents.itemStartUse.subscribe(({ source: player, itemStack }) => {
        const status = getStatus(player);
        status.holdInteract = true;
        if (itemStack && itemHasFlag(itemStack, 'kinetic_weapon'))
            status.chargeAttacking = true;
    });

    world.afterEvents.itemStopUse.subscribe(({ source: player, itemStack }) => {
        const status = getStatus(player);
        status.holdInteract = false;
        if (itemStack && itemHasFlag(itemStack, 'kinetic_weapon'))
            status.chargeAttacking = false;
    });

    world.afterEvents.playerInteractWithBlock.subscribe(({ player, block }) => {
        if (block) {
            const status = getStatus(player);
            status.rightClick = true;
        }
    });

    world.afterEvents.playerInventoryItemChange.subscribe(({ player: source, slot }) => {
        inventoryAddLore({ source, slot });
    });
}
