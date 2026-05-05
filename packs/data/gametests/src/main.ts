import { registerStartupHandlers } from './handlers/startup.ts';
import { registerCombatHandlers } from './handlers/combat.ts';
import { registerPlayerHandlers } from './handlers/player.ts';
import { registerProjectileHandlers } from './handlers/projectile.ts';
import { registerTickHandlers } from './handlers/tick.ts';
import { registerStatsLoader } from './stats/loader.ts';

export const VERSION = '3.0.1';

registerStartupHandlers();
registerCombatHandlers();
registerPlayerHandlers();
registerProjectileHandlers();
registerTickHandlers();
registerStatsLoader();
