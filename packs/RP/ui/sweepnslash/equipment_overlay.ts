// packs/RP/ui/sweepnslash/equipment_overlay.ts
// Marathon generator — produces equipment_overlay.json, then deleted by build pipeline.

const UPDATE_STRING = '_sweepnslash:';

// All elements are flat siblings inside equipment_overlay (full-screen panel).
// resolve_sibling_scope: true is required on all bindings that reference data_eq_control.

// Data control
// Extracts #side and all durability fields from the sweepnslash title.
// '_'-padded values: use (value - '_') to strip leading underscores before
// passing to progress_bar_renderer. This relies on MCUI's string '-' operator
// stripping all leading occurrences of the RHS pattern.
const dataEqControl = {
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
            binding_type: 'view',
            source_property_name: `(not (#hud_title_text_string = #preserved_text) and not ((#hud_title_text_string - '${UPDATE_STRING}') = #hud_title_text_string))`,
            target_property_name: '#visible',
        },
        {
            binding_type: 'view',
            source_property_name: `(#preserved_text - '${UPDATE_STRING}')`,
            target_property_name: '#texto',
        },
        // side char at offset 24
        {
            binding_type: 'view',
            source_property_name: "('%.1s' * (#texto - ('%.24s' * #texto)))",
            target_property_name: '#side',
        },
        // h_cur at 26, h_max at 32
        {
            binding_type: 'view',
            source_property_name: "('%.5s' * (#texto - ('%.26s' * #texto)))",
            target_property_name: '#h_cur',
        },
        {
            binding_type: 'view',
            source_property_name: "('%.5s' * (#texto - ('%.32s' * #texto)))",
            target_property_name: '#h_max',
        },
        // c_cur at 38, c_max at 44
        {
            binding_type: 'view',
            source_property_name: "('%.5s' * (#texto - ('%.38s' * #texto)))",
            target_property_name: '#c_cur',
        },
        {
            binding_type: 'view',
            source_property_name: "('%.5s' * (#texto - ('%.44s' * #texto)))",
            target_property_name: '#c_max',
        },
        // l_cur at 50, l_max at 56
        {
            binding_type: 'view',
            source_property_name: "('%.5s' * (#texto - ('%.50s' * #texto)))",
            target_property_name: '#l_cur',
        },
        {
            binding_type: 'view',
            source_property_name: "('%.5s' * (#texto - ('%.56s' * #texto)))",
            target_property_name: '#l_max',
        },
        // f_cur at 62, f_max at 68
        {
            binding_type: 'view',
            source_property_name: "('%.5s' * (#texto - ('%.62s' * #texto)))",
            target_property_name: '#f_cur',
        },
        {
            binding_type: 'view',
            source_property_name: "('%.5s' * (#texto - ('%.68s' * #texto)))",
            target_property_name: '#f_max',
        },
        // o_cur at 74, o_max at 80
        {
            binding_type: 'view',
            source_property_name: "('%.5s' * (#texto - ('%.74s' * #texto)))",
            target_property_name: '#o_cur',
        },
        {
            binding_type: 'view',
            source_property_name: "('%.5s' * (#texto - ('%.80s' * #texto)))",
            target_property_name: '#o_max',
        },
    ],
};

// Slot definitions (bottom → top order in layout, right-side y increases going up)
const SLOTS = [
    {
        name: 'offhand',
        curProp: '#o_cur',
        maxProp: '#o_max',
        bg: 'textures/ui/sweepnslash/offhand_slot',
        yR: -26,
        yL: -26,
    },
    {
        name: 'feet',
        curProp: '#f_cur',
        maxProp: '#f_max',
        bg: 'textures/ui/sweepnslash/feet_slot',
        yR: -50,
        yL: -50,
    },
    {
        name: 'legs',
        curProp: '#l_cur',
        maxProp: '#l_max',
        bg: 'textures/ui/sweepnslash/legs_slot',
        yR: -74,
        yL: -74,
    },
    {
        name: 'chest',
        curProp: '#c_cur',
        maxProp: '#c_max',
        bg: 'textures/ui/sweepnslash/chest_slot',
        yR: -98,
        yL: -98,
    },
    {
        name: 'head',
        curProp: '#h_cur',
        maxProp: '#h_max',
        bg: 'textures/ui/sweepnslash/head_slot',
        yR: -122,
        yL: -122,
    },
] as const;

// Three-binding pattern (same as hunger overlay icons):
//   1. read #show_survival_ui
//   2. evaluate visibility condition from data_eq_control sibling
//   3. AND both → #visible
function slotBinding(visExpr: string) {
    return [
        { binding_name: '#show_survival_ui' },
        {
            binding_type: 'view',
            source_control_name: 'data_eq_control',
            resolve_sibling_scope: true,
            source_property_name: visExpr,
            target_property_name: '#data_visible',
        },
        {
            binding_type: 'view',
            source_property_name: '(#show_survival_ui and #data_visible)',
            target_property_name: '#visible',
        },
    ];
}

const controls: Array<Record<string, object>> = [{ data_eq_control: dataEqControl }];

for (const slot of SLOTS) {
    for (const side of ['r', 'l'] as const) {
        const anchorTo = side === 'r' ? 'bottom_right' : 'bottom_left';
        const anchorFrom = side === 'r' ? 'bottom_right' : 'bottom_left';
        const xBg = side === 'r' ? -4 : 4;
        const xBar = side === 'r' ? -9 : 9; // bar is 12px wide; shifts it 5px inward to center under icon
        const y = side === 'r' ? slot.yR : slot.yL;

        const occupiedExpr = `(not (#show_survival_ui = false) and not ((${slot.maxProp} - '_') = '0') and (#side = '${side}'))`;

        // Background slot icon (22×22)
        controls.push({
            [`${slot.name}_bg_${side}`]: {
                type: 'image',
                texture: slot.bg,
                size: [22, 22],
                layer: 1,
                anchor_from: anchorFrom,
                anchor_to: anchorTo,
                offset: [xBg, y],
                bindings: slotBinding(occupiedExpr),
            },
        });

        // Durability bar using progress_bar_renderer (same as DAV)
        // is_durability: true → automatic green→yellow→red colour grading
        controls.push({
            [`${slot.name}_bar_${side}`]: {
                type: 'custom',
                renderer: 'progress_bar_renderer',
                size: [12, 1],
                layer: 2,
                anchor_from: anchorFrom,
                anchor_to: anchorTo,
                offset: [xBar, y - 5],
                property_bag: {
                    drop_shadow: true,
                    is_durability: true,
                    round_value: true,
                },
                bindings: [
                    ...slotBinding(occupiedExpr),
                    {
                        binding_type: 'view',
                        source_control_name: 'data_eq_control',
                        resolve_sibling_scope: true,
                        source_property_name: `(${slot.curProp} - '_')`,
                        target_property_name: '#progress_bar_current_amount',
                    },
                    {
                        binding_type: 'view',
                        source_control_name: 'data_eq_control',
                        resolve_sibling_scope: true,
                        source_property_name: `(${slot.maxProp} - '_')`,
                        target_property_name: '#progress_bar_total_amount',
                    },
                ],
            },
        });
    }
}

const output = {
    namespace: 'sweepnslash_eq',
    equipment_overlay: {
        type: 'panel',
        size: ['100%', '100%'],
        anchor_from: 'center',
        anchor_to: 'center',
        bindings: [{ binding_name: '#show_survival_ui', binding_name_override: '#visible' }],
        controls,
    },
};

await Deno.writeTextFile('./equipment_overlay.json', JSON.stringify(output, null, 2));
