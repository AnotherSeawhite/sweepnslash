import { Dimension, WeatherType, world } from '@minecraft/server';

export function getWeather(dimension: Dimension): WeatherType {
    const key = `sns:weather:${dimension.id}`;
    const stored = world.getDynamicProperty(key);
    if (stored === undefined) {
        world.setDynamicProperty(key, WeatherType.Clear);
        return WeatherType.Clear;
    }
    if (typeof stored !== 'string') return WeatherType.Clear;
    return stored as WeatherType;
}
