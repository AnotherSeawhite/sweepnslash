import { Dimension, DimensionTypes, system, WeatherType, world } from '@minecraft/server';

export function getWeather(dimension: Dimension): WeatherType {
    const type = DimensionTypes.get(dimension.id)!;
    const key = `sns:weather:${type.typeId}`;
    const stored = world.getDynamicProperty(key);
    if (stored === undefined) {
        world.setDynamicProperty(key, WeatherType.Clear);
        return WeatherType.Clear;
    }
    if (typeof stored !== 'string') return WeatherType.Clear;
    return stored as WeatherType;
}
