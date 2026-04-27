// packs/RP/ui/sweepnslash/hunger_overlay.ts
// Marathon generator — produces hunger_overlay.json, then is deleted by the build pipeline.

const UPDATE_STRING = '_sweepnslash|';

// x offsets matching the vanilla hunger heart positions (rightmost heart 1 → leftmost heart 10)
const SAT_X = [87, 79, 71, 63, 55, 47, 39, 31, 23, 15];
// x offsets for exhaustion sub-markers (4 px steps, rightmost → leftmost)
const EXH_X = [89, 85, 81, 77, 73, 69, 65, 61, 57, 53, 49, 45, 41, 37, 33, 29, 25, 21, 17, 13];
const Y = -32;

const pad2 = (n: number) => String(n).padStart(2, '0');

// Data control — preserved-title pattern.
// Captures every title that starts with UPDATE_STRING.
// Exposes #sat, #exh, #hun, #fnut, #fsat as computed view bindings read by sibling icons.
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
            binding_type: 'view',
            source_property_name: `(not (#hud_title_text_string = #preserved_text) and not ((#hud_title_text_string - '${UPDATE_STRING}') = #hud_title_text_string))`,
            target_property_name: '#visible',
        },
        {
            binding_type: 'view',
            source_property_name: `(#preserved_text - '${UPDATE_STRING}')`,
            target_property_name: '#texto',
        },
        // sat: offset 9
        {
            binding_type: 'view',
            source_property_name: "('%.2s' * (#texto - ('%.9s' * #texto)))",
            target_property_name: '#sat',
        },
        // exh: offset 12
        {
            binding_type: 'view',
            source_property_name: "('%.2s' * (#texto - ('%.12s' * #texto)))",
            target_property_name: '#exh',
        },
        // hun: offset 15
        {
            binding_type: 'view',
            source_property_name: "('%.2s' * (#texto - ('%.15s' * #texto)))",
            target_property_name: '#hun',
        },
        // fnut: offset 18
        {
            binding_type: 'view',
            source_property_name: "('%.2s' * (#texto - ('%.18s' * #texto)))",
            target_property_name: '#fnut',
        },
        // fsat: offset 21
        {
            binding_type: 'view',
            source_property_name: "('%.2s' * (#texto - ('%.21s' * #texto)))",
            target_property_name: '#fsat',
        },
    ],
};

// Three-binding pattern for all icons:
//   1. read #show_survival_ui into local scope
//   2. evaluate data visibility expression from data_control_hunger sibling
//   3. AND both → #visible
// resolve_sibling_scope: true is required because the icon is a direct sibling of
// data_control_hunger (same parent), not a descendant — MCUI needs the hint to look "outward".
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

const controls: Array<Record<string, object>> = [{ data_control_hunger: dataControlHunger }];

// ── Saturation icons (combined current/preview) ──────────────────────────────
// When fnut = '00': show based on #sat (normal mode)
// When fnut ≠ '00': show based on #fsat (food preview phase)
for (let i = 0; i < 10; i++) {
    const n = i + 1;
    const x = SAT_X[i];
    const t = pad2(2 * n - 1); // threshold string, e.g. '01', '03', '05' … '19'
    const fullExpr = `((#fnut = '00') and (#sat > '${t}')) or (not (#fnut = '00') and (#fsat > '${t}'))`;
    const halfExpr = `((#fnut = '00') and (#sat = '${t}')) or (not (#fnut = '00') and (#fsat = '${t}'))`;
    controls.push({ [`sat_full_${n}`]: icon('textures/ui/saturation_full', 3, x, fullExpr) });
    controls.push({ [`sat_half_${n}`]: icon('textures/ui/saturation_half', 3, x, halfExpr) });
}

// ── Exhaustion markers ────────────────────────────────────────────────────────
for (let i = 0; i < 20; i++) {
    const n = i + 1;
    const x = EXH_X[i];
    const t = pad2((n - 1) * 2); // threshold 0, 2, 4 … 38
    controls.push({
        [`exh_${n}`]: icon('textures/ui/hunger_exhaustion', 0, x, `(#exh > '${t}')`, 0.5),
    });
}

// ── Ghost hunger preview icons (food delta) ───────────────────────────────────
// Reuse saturation textures at 0.5 alpha (golden tint = food preview convention).
// Visible only during preview phase (fnut ≠ '00') at positions the player doesn't
// currently have filled (hun < threshold) but would be filled after eating (fnut ≥ threshold).
for (let i = 0; i < 10; i++) {
    const n = i + 1;
    const x = SAT_X[i]; // same x positions as the vanilla hunger hearts
    const tFull = pad2(2 * n - 1); // fnut must be > this for a full ghost heart
    const tFullHun = pad2(2 * n);  // hun must be < this (slot currently unfilled)
    const tHalf = pad2(2 * n - 1); // for half ghost: fnut exactly equals this
    const fullExpr = `(not (#fnut = '00') and (#fnut > '${tFull}') and (#hun < '${tFullHun}'))`;
    const halfExpr = `(not (#fnut = '00') and (#fnut = '${tHalf}') and (#hun < '${tHalf}'))`;
    controls.push({ [`ghost_full_${n}`]: icon('textures/ui/saturation_full', 2, x, fullExpr, 0.5) });
    controls.push({ [`ghost_half_${n}`]: icon('textures/ui/saturation_half', 2, x, halfExpr, 0.5) });
}

const output = {
    namespace: 'sweepnslash_hunger',
    hunger_overlay_panel: {
        type: 'panel',
        size: ['100%', '100%'],
        anchor_from: 'center',
        anchor_to: 'center',
        controls,
    },
};

await Deno.writeTextFile('./hunger_overlay.json', JSON.stringify(output, null, 2));
console.log('Generated hunger_overlay.json');
