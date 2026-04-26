import { Entity, Player } from '@minecraft/server';

export interface PlayerStatus {
    sprintKnockbackHitUsed: boolean;
    sprintKnockbackValid: boolean;
    critSweepValid: boolean;
    shieldValid: boolean;
    mace: boolean;
    attackReady: boolean;
    chargeAttacking: boolean;
    showBar: boolean;
    holdInteract: boolean;
    leftClick: boolean;
    rightClick: boolean;
    lastSelectedItem: unknown;
    lastSelectedSlot: unknown;
    cooldown: number;
    lastAttackTime: number;
    lastShieldTime: number;
    foodTickTimer: number;
    fallDistance: number;
}

const playerStatus = new WeakMap<Entity, PlayerStatus>();

function initializePlayerStatus(entity: Entity): PlayerStatus {
    const status: PlayerStatus = {
        sprintKnockbackHitUsed: false,
        sprintKnockbackValid: false,
        critSweepValid: true,
        shieldValid: false,
        mace: false,
        attackReady: false,
        chargeAttacking: false,
        showBar: true,
        holdInteract: false,
        leftClick: false,
        rightClick: false,
        lastSelectedItem: undefined,
        lastSelectedSlot: undefined,
        cooldown: 0,
        lastAttackTime: 0,
        lastShieldTime: 0,
        foodTickTimer: 0,
        fallDistance: 0,
    };
    playerStatus.set(entity, status);
    return status;
}

export function getStatus(entity: Entity): PlayerStatus {
    if (!playerStatus.has(entity)) initializePlayerStatus(entity);
    return playerStatus.get(entity)!;
}

export function setAttackCooldown(player: Player, currentTick: number): void {
    const status = getStatus(player);
    status.lastAttackTime = currentTick;
}

export function setLastShieldTime(player: Player, currentTick: number): void {
    const status = getStatus(player);
    status.lastShieldTime = currentTick;
}
