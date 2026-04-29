import { Player, system } from '@minecraft/server';
import { clampNumber } from '../shared/math.ts';
import { Debug } from '../shared/debug.ts';
import { getStatus, setLastShieldTime } from '../shared/status.ts';
import { getItemStats, hasItemFlag, itemHasFlag } from '../stats/item.ts';
import { getCooldownTime } from '../combat/damage.ts';
import { view, specialValid } from '../combat/checks.ts';
import { shield } from '../combat/shields.ts';

export interface IndicatorResult {
    mode: 'crs' | 'htb' | 'sub' | 'non';
    pixel: number;
    ready: boolean;
    subtitle?: string;
}

export function tickIndicator(
    player: Player,
    currentTick: number,
    addonToggle: boolean,
): IndicatorResult {
    const status = getStatus(player);
    const { item, stats } = getItemStats(player);

    // Shield delay check
    if (!(shield(player) && !status.holdInteract)) {
        setLastShieldTime(player, currentTick);
    }
    const shieldTime = currentTick - status.lastShieldTime;
    status.shieldValid = shieldTime >= 5 || shieldTime == 1;

    // Slot/item change → reset cooldown
    if (
        (player.selectedSlotIndex !== status.lastSelectedSlot &&
            status.lastSelectedItem !== item?.typeId) ||
        (status.lastSelectedItem !== item?.typeId &&
            !(status.lastSelectedItem === undefined && item?.typeId === undefined))
    ) {
        if (item && itemHasFlag(item, 'custom_cooldown')) {
            const cooldownComp = item.getComponent('cooldown');
            cooldownComp?.startCooldown(player);
        }
        status.lastAttackTime = currentTick;
    }

    status.lastSelectedSlot = player.selectedSlotIndex;
    status.lastSelectedItem = item?.typeId;

    // Sprint check
    const isSprinting = player.isSprinting;
    if (!isSprinting) {
        status.sprintKnockbackHitUsed = false;
        status.sprintKnockbackValid = false;
        status.critSweepValid = true;
    } else if (isSprinting && !status.sprintKnockbackHitUsed) {
        status.sprintKnockbackValid = true;
    } else if (isSprinting && status.sprintKnockbackHitUsed) {
        status.sprintKnockbackValid = false;
    }
    status.critSweepValid = !player.isSprinting || status.sprintKnockbackHitUsed;

    // Fall distance (mace smash attack / spears)
    const fallDist = status.fallDistance;
    if (
        player.isFalling &&
        !player.isGliding &&
        !player.isOnGround &&
        !player.isInWater &&
        !player.isFlying &&
        !player.isClimbing &&
        !player.getEffect('slow_falling') &&
        !player.getEffect('levitation')
    ) {
        status.fallDistance = fallDist + player.getVelocity().y;
    } else {
        system.run(() => (status.fallDistance = 0));
    }

    if (addonToggle) {
        if (
            (Math.abs(fallDist) >= 1.5 && item && itemHasFlag(item, 'mace')) ||
            status.chargeAttacking
        ) {
            player.triggerEvent('sweepnslash:mace');
            status.mace = true;
        } else {
            player.triggerEvent('sweepnslash:not_mace');
            status.mace = false;
        }
    } else {
        player.triggerEvent('sweepnslash:mace');
    }

    // Cooldown UI
    const maxCD = getCooldownTime(player, stats?.attackSpeed).ticks;
    status.cooldown = Math.max(0, status.lastAttackTime + maxCD - currentTick);

    let curCD = status.cooldown;
    if (hasItemFlag(player, 'custom_cooldown') && item) {
        const cooldownComp = item.getComponent('cooldown');
        if (cooldownComp?.cooldownCategory)
            curCD = cooldownComp.getCooldownTicksRemaining(player);
    }
    const pixelValue = Math.min(16, Math.floor(((Math.round(maxCD) - curCD) / maxCD) * 17));
    const uiPixelValue = clampNumber(pixelValue, 0, 16);

    const subGrey = Math.round(uiPixelValue / 1.6);
    const subDarkGrey = 10 - subGrey;
    let cooldownSubtitle = '§7˙'.repeat(Math.max(0, subGrey));
    cooldownSubtitle += '§8˙'.repeat(subDarkGrey);

    const inRange = view(player, stats?.reach);
    const targetValid = !(inRange?.getComponent('health')?.currentValue! <= 0);
    const specialCheck = specialValid(currentTick, player, stats);

    const riders = player.getComponent('rideable')?.getRiders() ?? [];
    const riderCheck = riders.some((rider) => rider === inRange);
    const ridingOn = player.getComponent('riding')?.entityRidingOn;
    const ridingCheck = ridingOn !== inRange;

    const viewCheck = inRange && targetValid && !riderCheck && ridingCheck;

    const barStyle = (player.getDynamicProperty('cooldownStyle') as number) ?? 0;
    const barArray = ['crs', 'htb', 'sub', 'non'][barStyle];
    const bonkReady: boolean = (viewCheck && curCD <= 0) ?? false;

    if (addonToggle && Debug.isEnabled()) {
        const cooldownPercentage = Math.floor(((maxCD - curCD) / maxCD) * 100);
        const actionBarDisplay = `${Math.trunc(curCD)} (${specialCheck ? '§a' : ''}${cooldownPercentage}%§f)`;
        player.onScreenDisplay.setActionBar(actionBarDisplay);
    }

    if (!addonToggle || barStyle === 3) {
        return { mode: 'non', pixel: 0, ready: false };
    } else if (
        curCD > 0 ||
        (viewCheck && stats && !hasItemFlag(player, 'hide_indicator') && barStyle === 0)
    ) {
        if (barStyle === 2) {
            return {
                mode: 'sub',
                pixel: uiPixelValue,
                ready: bonkReady,
                subtitle: cooldownSubtitle,
            };
        } else {
            return {
                mode: barArray as 'crs' | 'htb' | 'sub' | 'non',
                pixel: uiPixelValue,
                ready: bonkReady,
            };
        }
    } else {
        return { mode: 'non', pixel: 0, ready: false };
    }
}
