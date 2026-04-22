// packs/data/gametests/src/combat/cooldown.ts
import { Entity, Player, system } from '@minecraft/server';
import { setAttackCooldown } from '../shared/status.js';
import { CombatManager } from './attack.js';

export class AttackCooldownManager {
    static playerMap = new Map<Player, AttackCooldownManager>();

    static forPlayer(player: Player): AttackCooldownManager {
        let ac = this.playerMap.get(player);
        if (!ac) {
            ac = new this(player);
            this.playerMap.set(player, ac);
        }
        return ac;
    }

    private swingTick?: number;
    private hitTick?: number;

    private constructor(private player: Player) {}

    onSwing() {
        const now = system.currentTick;
        this.swingTick = now;

        if (this.hitTick === now) {
            this.swingTick = undefined;
            return;
        }

        system.runTimeout(() => this.resolveSwing(now), 2);
    }

    onHit(target: Entity) {
        const now = system.currentTick;
        this.hitTick = now;

        if (this.swingTick === now || this.swingTick === now - 1) {
            this.applyHit(target);
            this.swingTick = undefined;
        } else {
            this.applyHit(target);
        }
    }

    private resolveSwing(swingTick: number) {
        if (this.swingTick === swingTick) {
            this.applyMiss();
            this.swingTick = undefined;
        }
    }

    private applyHit(target: Entity) {
        CombatManager.attack({ player: this.player, target, currentTick: system.currentTick });
    }

    private applyMiss() {
        setAttackCooldown(this.player, system.currentTick);
    }
}
