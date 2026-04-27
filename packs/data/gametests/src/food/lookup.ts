// packs/data/gametests/src/food/lookup.ts
// Vanilla food nutrition data.
// Derived from AppSkin Bedrock (public domain, https://www.curseforge.com/minecraft-bedrock/addons/appleskin-bedrock).
// saturation modifier follows Java Edition conventions: saturationRestored = nutrition * satMod * 2

export interface FoodData {
    nutrition: number;
    saturation: number; // saturation modifier (multiplied by nutrition * 2 in scripting)
}

export const FOOD_LOOKUP = new Map<string, FoodData>([
    ['minecraft:cooked_chicken',       { nutrition: 6,  saturation: 0.6  }],
    ['minecraft:cooked_porkchop',      { nutrition: 8,  saturation: 0.8  }],
    ['minecraft:cooked_beef',          { nutrition: 8,  saturation: 0.8  }],
    ['minecraft:cooked_mutton',        { nutrition: 6,  saturation: 0.8  }],
    ['minecraft:cooked_rabbit',        { nutrition: 5,  saturation: 0.6  }],
    ['minecraft:cooked_cod',           { nutrition: 5,  saturation: 0.6  }],
    ['minecraft:cooked_salmon',        { nutrition: 6,  saturation: 0.6  }],
    ['minecraft:bread',                { nutrition: 5,  saturation: 0.6  }],
    ['minecraft:mushroom_stew',        { nutrition: 6,  saturation: 0.6  }],
    ['minecraft:beetroot_soup',        { nutrition: 6,  saturation: 0.6  }],
    ['minecraft:rabbit_stew',          { nutrition: 10, saturation: 0.6  }],
    ['minecraft:baked_potato',         { nutrition: 5,  saturation: 0.6  }],
    ['minecraft:cookie',               { nutrition: 2,  saturation: 0.1  }],
    ['minecraft:pumpkin_pie',          { nutrition: 8,  saturation: 0.3  }],
    ['minecraft:dried_kelp',           { nutrition: 1,  saturation: 0.1  }],
    ['minecraft:honey_bottle',         { nutrition: 6,  saturation: 0.1  }],
    ['minecraft:beetroot',             { nutrition: 1,  saturation: 0.6  }],
    ['minecraft:potato',               { nutrition: 1,  saturation: 0.3  }],
    ['minecraft:poisonous_potato',     { nutrition: 2,  saturation: 0.3  }],
    ['minecraft:carrot',               { nutrition: 3,  saturation: 0.6  }],
    ['minecraft:golden_carrot',        { nutrition: 6,  saturation: 1.2  }],
    ['minecraft:apple',                { nutrition: 4,  saturation: 0.3  }],
    ['minecraft:golden_apple',         { nutrition: 4,  saturation: 1.2  }],
    ['minecraft:enchanted_golden_apple', { nutrition: 4, saturation: 1.2 }],
    ['minecraft:melon_slice',          { nutrition: 2,  saturation: 0.3  }],
    ['minecraft:sweet_berries',        { nutrition: 2,  saturation: 0.3  }],
    ['minecraft:glow_berries',         { nutrition: 2,  saturation: 0.3  }],
    ['minecraft:chicken',              { nutrition: 2,  saturation: 0.3  }],
    ['minecraft:porkchop',             { nutrition: 3,  saturation: 0.3  }],
    ['minecraft:beef',                 { nutrition: 3,  saturation: 0.3  }],
    ['minecraft:mutton',               { nutrition: 2,  saturation: 0.3  }],
    ['minecraft:rabbit',               { nutrition: 3,  saturation: 0.3  }],
    ['minecraft:cod',                  { nutrition: 2,  saturation: 0.1  }],
    ['minecraft:salmon',               { nutrition: 2,  saturation: 0.1  }],
    ['minecraft:tropical_fish',        { nutrition: 1,  saturation: 0.1  }],
    ['minecraft:pufferfish',           { nutrition: 1,  saturation: 0.1  }],
    ['minecraft:spider_eye',           { nutrition: 2,  saturation: 0.8  }],
    ['minecraft:chorus_fruit',         { nutrition: 4,  saturation: 0.3  }],
    ['minecraft:rotten_flesh',         { nutrition: 4,  saturation: 0.1  }],
    ['minecraft:suspicious_stew',      { nutrition: 6,  saturation: 0.6  }],
    ['minecraft:torchflower_seeds',    { nutrition: 1,  saturation: 0.1  }],
    ['minecraft:pitcher_pod',          { nutrition: 1,  saturation: 0.1  }],
]);
