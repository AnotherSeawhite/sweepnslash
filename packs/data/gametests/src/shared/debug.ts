import { world } from '@minecraft/server';
import { Logger, LogLevel, OutputType } from '@bedrock-oss/bedrock-boost';

// Set all log levels to chat-only. Logger.getOutputConfig() returns the live
// settings object, so mutating it affects all loggers globally.
const outputConfig = Logger.getOutputConfig();
for (const level of [
    LogLevel.Trace,
    LogLevel.Debug,
    LogLevel.Info,
    LogLevel.Warn,
    LogLevel.Error,
    LogLevel.Fatal,
]) {
    outputConfig[level.level] = [OutputType.Chat];
}

export const logger = Logger.getLogger('sweepnslash', 'sns');

export const Debug = {
    isEnabled(): boolean {
        return world.getDynamicProperty('debug_mode') === true;
    },
    error(...args: unknown[]): void {
        if (this.isEnabled()) logger.error(...args);
    },
    warn(...args: unknown[]): void {
        if (this.isEnabled()) logger.warn(...args);
    },
    info(...args: unknown[]): void {
        if (this.isEnabled()) logger.info(...args);
    },
    debug(...args: unknown[]): void {
        if (this.isEnabled()) logger.debug(...args);
    },
    ifEnabled(fn: () => void): void {
        if (this.isEnabled()) fn();
    },
};
