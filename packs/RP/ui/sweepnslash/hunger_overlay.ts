// packs/RP/ui/sweepnslash/hunger_overlay.ts
// Marathon generator — produces hunger_overlay.json, then is deleted by the build pipeline.

const UPDATE_STRING = '_sweepnslash|';

// x offsets matching the vanilla hunger heart positions (rightmost → leftmost)
const SAT_X = [87, 79, 71, 63, 55, 47, 39, 31, 23, 15];

// x offsets for exhaustion sub-markers (4 px steps, rightmost → leftmost)
const EXH_X = [89, 85, 81, 77, 73, 69, 65, 61, 57, 53, 49, 45, 41, 37, 33, 29, 25, 21, 17, 13];

const Y = -32;

// data control
// Preserved-title pattern: captures the title string whenever it changes to one
// starting with UPDATE_STRING, then exposes #sat and #exh as computed properties
// that icon siblings can read via source_control_name: "data_control_hunger".
const dataControlHunger = {
    type: 'panel',
    size: [0, 0],
    bindings: [
        { binding_name: '#hud_title_text_string' },
        {
            binding_name: '#hud_title_text_string',
            binding_name_override: '#preserved_text',
            binding_condition: 'visibility_changed',
        },
        {
            // Visible (= triggers capture) when title changes to a sweepnslash| one
            binding_type: 'view',
            source_property_name: `(not (#hud_title_text_string = #preserved_text) and not ((#hud_title_text_string - '${UPDATE_STRING}') = #hud_title_text_string))`,
            target_property_name: '#visible',
        },
        {
            // Strip prefix → "crs|f|08|14|32"
            binding_type: 'view',
            source_property_name: `(#preserved_text - '${UPDATE_STRING}')`,
            target_property_name: '#texto',
        },
        {
            // sat: chars 9-10 of texto (after "crs|f|08|")
            binding_type: 'view',
            source_property_name: "('%.2s' * (#texto - ('%.9s' * #texto)))",
            target_property_name: '#sat',
        },
        {
            // exh: chars 12-13 of texto (after "crs|f|08|14|")
            binding_type: 'view',
            source_property_name: "('%.2s' * (#texto - ('%.12s' * #texto)))",
            target_property_name: '#exh',
        },
    ],
};

// helper to build a single icon element
function icon(texture: string, layer: number, x: number, visExpr: string, alpha = 1.0): object {
    // deno-lint-ignore no-explicit-any
    const def: any = {
        type: 'image',
        layer,
        texture,
        size: [9, 9],
        anchor_from: 'bottom_middle',
        anchor_to: 'bottom_middle',
        offset: [x, Y],
        bindings: [
            { binding_name: '#show_survival_ui' },
            {
                binding_type: 'view',
                source_control_name: 'data_control_hunger',
                resolve_sibling_scope: true,
                source_property_name: visExpr,
                target_property_name: '#data_visible',
            },
            {
                binding_type: 'view',
                source_property_name: '(#show_survival_ui and #data_visible)',
                target_property_name: '#visible',
            },
        ],
    };
    if (alpha !== 1.0) def.alpha = alpha;
    return def;
}

// build controls
const controls: Array<Record<string, object>> = [{ data_control_hunger: dataControlHunger }];

// Saturation icons (layer 3, on top of vanilla hunger hearts)
for (let i = 0; i < 10; i++) {
    const n = i + 1;
    const x = SAT_X[i];
    const threshold = 2 * n - 1; // odd numbers 1, 3, 5 … 19
    controls.push({
        [`sat_full_${n}`]: icon('textures/ui/saturation_full', 3, x, `(#sat > ${threshold})`),
    });
    controls.push({
        [`sat_half_${n}`]: icon('textures/ui/saturation_half', 3, x, `(#sat = ${threshold})`),
    });
}

// Exhaustion markers (layer 0, behind hunger hearts)
for (let i = 0; i < 20; i++) {
    const n = i + 1;
    const x = EXH_X[i];
    const threshold = (n - 1) * 2; // 0, 2, 4 … 38
    controls.push({
        [`exh_${n}`]: icon('textures/ui/hunger_exhaustion', 0, x, `(#exh > ${threshold})`, 0.5),
    });
}

// assemble output
const output = {
    namespace: 'sweepnslash_hunger',
    hunger_overlay_panel: {
        type: 'panel',
        // Full-size so children's bottom_middle anchor aligns with root_panel's bottom_middle
        size: ['100%', '100%'],
        anchor_from: 'center',
        anchor_to: 'center',
        controls,
    },
};

await Deno.writeTextFile('./hunger_overlay.json', JSON.stringify(output, null, 2));
console.log('Generated hunger_overlay.json');
