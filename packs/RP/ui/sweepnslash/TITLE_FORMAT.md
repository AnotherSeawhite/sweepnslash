# Sweep 'N Slash — HUD Title Data Protocol

The scripting layer sends one Bedrock title per game tick (20 Hz) using `player.onScreenDisplay.setTitle(title, { stayDuration: 0 })`. The RP captures it via the **preserved-title pattern** (see below).

## Title format

Prefix: `_sweepnslash|`  
Full string (after prefix, field widths shown):

```
{mode:3}|{ready:1}|{pixel:2}|{sat:2}|{exh:2}|{hun:2}|{fnut:2}|{fsat:2}|{side:1}|{h_cur:5}|{h_max:5}|{c_cur:5}|{c_max:5}|{l_cur:5}|{l_max:5}|{f_cur:5}|{f_max:5}|{o_cur:5}|{o_max:5}
```

| Field | Offset | Width | Values | Description |
|---|---|---|---|---|
| mode | 0 | 3 | `crs`/`htb`/`sub`/`non` | Cooldown indicator display mode |
| ready | 4 | 1 | `t`/`f` | Attack ready flash |
| pixel | 6 | 2 | `00`–`16` | Cooldown fill level, zero-padded |
| sat | 9 | 2 | `00`–`20` | Current saturation (rounded) |
| exh | 12 | 2 | `00`–`38` | Exhaustion × 10 (rounded) |
| hun | 15 | 2 | `00`–`20` | Current hunger |
| fnut | 18 | 2 | `00`–`20` | Predicted hunger after eating; `00` = no preview |
| fsat | 21 | 2 | `00`–`20` | Predicted saturation after eating |
| side | 24 | 1 | `r`/`l` | Armor overlay side |
| h_cur | 26 | 5 | `____0`–`_2031` | Head current durability (`_`-padded) |
| h_max | 32 | 5 | `____0`–`_2031` | Head max durability; `____0` = empty |
| c_cur/c_max | 38/44 | 5 | — | Chest |
| l_cur/l_max | 50/56 | 5 | — | Legs |
| f_cur/f_max | 62/68 | 5 | — | Feet |
| o_cur/o_max | 74/80 | 5 | — | Offhand |

## Extraction formula

```
'%.Ns' * (#texto - ('%.Xs' * #texto))
```

Extracts N chars starting at byte offset X from `#texto` (title with prefix removed).  
Example — pixel: `'%.2s' * (#texto - ('%.6s' * #texto))`

## Preserved-title pattern

Each data binding control (0×0 panel) captures sweepnslash titles:

1. `{ binding_name: '#hud_title_text_string' }` — always reflects current title.
2. `{ ..., binding_name_override: '#preserved_text', binding_condition: 'visibility_changed' }` — updates `#preserved_text` only when the element's `#visible` changes.
3. A view binding sets `#visible = (title changed from last captured value) AND (title starts with prefix)`.

Because `stayDuration: 0` causes the title to expire each frame, `#visible` toggles `true → false → true` every tick, continuously firing `visibility_changed` and keeping `#preserved_text` current.

## `resolve_sibling_scope: true`

Elements that reference a **sibling** data binding control via `source_control_name` must include `resolve_sibling_scope: true`. Without it, MCUI looks for a **child** of the current element by that name, not a sibling.
