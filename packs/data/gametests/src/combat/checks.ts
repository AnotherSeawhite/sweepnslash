// packs/data/gametests/src/combat/checks.ts
import { Entity, GameMode, ItemStack, Player, world } from '@minecraft/server';
import { debug } from '../shared/math.js';
import { getStatus } from '../shared/status.js';
import { getItemStats, itemHasFlag } from '../stats/item.js';
import { calculateDamage, getCooldownTime } from './damage.js';
import { shieldBlock } from './shields.js';

export function inanimate(
    entity: Entity,
    { excludeTypes = [] }: { excludeTypes?: string[] } = {},
): boolean {
    const inanimateArray = [
        'minecraft:ender_crystal',
        'minecraft:painting',
        'minecraft:falling_block',
        'minecraft:tnt',
        'minecraft:fishing_hook',
        'minecraft:item',
        'minecraft:xp_orb',
    ];
    if (excludeTypes.includes(entity.typeId)) return false;
    return (
        entity.getComponent('type_family')?.hasTypeFamily('inanimate') ||
        entity.getComponent('type_family')?.hasTypeFamily('ignore') ||
        inanimateArray.some((e) => e === entity.typeId)
    ) ?? false;
}

export function enchantLevel(item: ItemStack | undefined, id: string): number {
    if (!item) return 0;
    return item.getComponent('enchantable')?.getEnchantment(id)?.level ?? 0;
}

export function effect(entity: Entity, id: string): number {
    const eff = entity.getEffect(id);
    return eff ? eff.amplifier + 1 : 0;
}

export function isFasterThanWalk(entity: Entity): boolean {
    const movement = entity.getComponent('movement');
    const speed = movement?.currentValue ?? 0;
    const walkSpeed = entity.isSprinting ? speed * (10 / 13) : speed;
    const velocity = entity.getVelocity();
    return Math.hypot(velocity.x, velocity.z) >= walkSpeed * 2.1585 && entity.isSprinting;
}

export function specialValid(currentTick: number, player: Player, stats: any): boolean {
    const status = getStatus(player);
    const timeSinceLastAttack = currentTick - status.lastAttackTime;
    const cooldownTime = getCooldownTime(player, stats?.attackSpeed).ticks;
    const cooldownPercent = (timeSinceLastAttack / cooldownTime) * 100;
    return cooldownPercent > 84.8;
}

export function criticalHit(
    currentTick: number,
    player: Player,
    target: Entity,
    stats: any,
    { damage, forced }: { damage?: number; forced?: boolean } = {},
): boolean {
    if (inanimate(target, { excludeTypes: ['minecraft:armor_stand'] })) return false;
    if (damage !== undefined && damage <= 0) return false;
    if (forced === false) return false;
    const status = getStatus(player);
    const shieldBlocked = shieldBlock(currentTick, player, target, stats);
    const isRiding = player.getComponent('riding')?.isValid ?? false;
    const isValid =
        (player.isFalling &&
            !player.isOnGround &&
            !player.isInWater &&
            !player.isFlying &&
            !player.isClimbing &&
            !isRiding &&
            !effect(player, 'blindness') &&
            !effect(player, 'slow_falling') &&
            specialValid(currentTick, player, stats) &&
            status.critSweepValid &&
            !shieldBlocked &&
            forced == undefined) ||
        forced == true;
    return isValid;
}

export function sprintKnockback(
    currentTick: number,
    player: Player,
    target: Entity,
    stats: any,
    { damage, noEffect, forced }: { damage?: number; noEffect?: boolean; forced?: boolean } = {},
): boolean {
    if (
        inanimate(target, {
            excludeTypes: [
                'minecraft:armor_stand',
                'minecraft:boat',
                'minecraft:chest_boat',
                'minecraft:minecart',
                'minecraft:command_block_minecart',
                'minecraft:hopper_minecart',
                'minecraft:tnt_minecart',
            ],
        })
    )
        return false;
    if (damage !== undefined && damage <= 0) return false;
    const status = getStatus(player);
    const isValid =
        (specialValid(currentTick, player, stats) &&
            status.sprintKnockbackValid &&
            forced == undefined) ||
        forced == true;
    if (isValid && !noEffect) {
        status.sprintKnockbackHitUsed = true;
    }
    return isValid;
}

export function view(player: Player, distance = 3): Entity | null {
    const targetEntity = player.getEntitiesFromViewDirection({
        maxDistance: distance,
        excludeTypes: [
            'item', 'xp_orb', 'arrow', 'ender_pearl', 'snowball',
            'egg', 'painting', 'tnt', 'fishing_hook', 'falling_block', 'ender_crystal',
        ],
    })[0]?.entity;
    if (targetEntity && inanimate(targetEntity, { excludeTypes: ['minecraft:armor_stand'] })) {
        return null;
    }
    return targetEntity ?? null;
}

export function block(player: Player) {
    return player.getBlockFromViewDirection({ maxDistance: 8, includeLiquidBlocks: false });
}

export function durability(
    player: Player,
    equippableComp: any,
    item: ItemStack,
    stats: any,
): void {
    if (player.getGameMode() === GameMode.Creative) return;
    const durabilityComp = item?.getComponent('durability');
    if ((durabilityComp as any)?.unbreakable === true) return;
    if (!durabilityComp || !stats) return;

    const unbreakingLevel = enchantLevel(item, 'unbreaking');
    const breakChance = durabilityComp.getDamageChance(unbreakingLevel);
    if (breakChance < Math.random() * 100) return;

    const durabilityModifier = stats?.isWeapon || itemHasFlag(item, 'is_weapon') ? 1 : 2;
    durabilityComp.damage = Math.min(
        durabilityComp.damage + durabilityModifier,
        durabilityComp.maxDurability,
    );

    if (durabilityComp.damage >= durabilityComp.maxDurability) {
        player.dimension.playSound('random.break', player.location);
        equippableComp.setEquipment('Mainhand', undefined);
    } else {
        equippableComp.setEquipment('Mainhand', item);
    }
}

export function damageTest(player: Player): void {
    const debugMode = world.getDynamicProperty('debug_mode');
    const { item, stats } = getItemStats(player);
    const baseDamage = stats?.damage || 1;
    const attackSpeed = stats?.attackSpeed || 4;
    const attackSpeedTicks = Math.round(getCooldownTime(player, attackSpeed).baseSpeed);
    const damageLog: string[] = [];

    for (let t = 0; t <= attackSpeedTicks; t++) {
        const dmg = calculateDamage(
            player, player as any, item, stats, 0, t,
            baseDamage, attackSpeed, { damageTest: true, attackSpeedTicks },
        ).damage;
        damageLog.push(
            `§f[ §a${t} (${Math.round((t * 100) / attackSpeedTicks)}%) §f| §c${dmg.toFixed(2)} §f| §e${(dmg / (t / 20)).toFixed(2)} (${(dmg / Math.max(0.5, t / 20)).toFixed(2)}) §f]`,
        );
    }

    if (debugMode)
        debug(
            `${item?.typeId || 'hand'} ${stats || item == undefined ? '' : '§c(Weapon stats not found)§f'}\n[ §aTicks §f| §cDamage §f| §eDPS (with iframes) §f]\n§e${damageLog.join('\n')}`,
        );
}
