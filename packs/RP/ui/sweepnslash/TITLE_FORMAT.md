# Sweep 'N Slash - HUD Title Data

The scripting layer sends one Bedrock title per game tick (20 Hz) using `player.onScreenDisplay.setTitle(title, { stayDuration: 0 })`. The RP captures it via the **preserved-title pattern** (see below).

## Title format

Prefix: `_sweepnslash:`  
Full string (after prefix, field widths shown):

```
{mode:3}:{ready:1}:{pixel:2}:{sat:2}:{exh:2}:{hun:2}:{fnut:2}:{fsat:2}:{falpha:3}:{h_cur:5}:{h_max:5}:{c_cur:5}:{c_max:5}:{l_cur:5}:{l_max:5}:{f_cur:5}:{f_max:5}:{o_cur:5}:{o_max:5}:{arrow:5}:{aslot:2}:{show:4}:{warn:6}
```

| Field       | Offset | Width | Values                  | Description                                                                  |
| ----------- | ------ | ----- | ----------------------- | ---------------------------------------------------------------------------- |
| mode        | 0      | 3     | `crs`/`htb`/`sub`/`non` | Cooldown indicator display mode                                              |
| ready       | 4      | 1     | `t`/`f`                 | Attack ready flash                                                           |
| pixel       | 6      | 2     | `00`–`16`               | Cooldown fill level, zero-padded                                             |
| sat         | 9      | 2     | `00`–`20`               | Current saturation (rounded)                                                 |
| exh         | 12     | 2     | `00`–`38`               | Exhaustion \* 10 (rounded)                                                   |
| hun         | 15     | 2     | `00`–`20`               | Current hunger                                                               |
| fnut        | 18     | 2     | `00`–`20`               | Predicted hunger after eating; `00` = no preview                             |
| fsat        | 21     | 2     | `00`–`20`               | Predicted saturation after eating                                            |
| falpha      | 24     | 3     | `000`–`100`             | Ghost flash alpha \* 100 (player-capped)                                     |
| h_cur       | 28     | 5     | `00000`–`02031`         | Head current durability (`0`-padded, not `_`)                                |
| h_max       | 34     | 5     | `00000`–`02031`         | Head max durability; `00000` = empty or unbreakable                          |
| c_cur/c_max | 40/46  | 5     | —                       | Chest                                                                        |
| l_cur/l_max | 52/58  | 5     | —                       | Legs                                                                         |
| f_cur/f_max | 64/70  | 5     | —                       | Feet                                                                         |
| o_cur/o_max | 76/82  | 5     | —                       | Offhand                                                                      |
| arrow       | 88     | 5     | `____0`–`__10k`         | Total projectile count for held shooter; `____0` = none                      |
| aslot       | 94     | 2     | `00`–`99`               | Slot of first found projectile: `00`–`35` inventory, `36` offhand, `99` none |
| show        | 97     | 4     | `tttf` etc.             | Overlay visibility flags `[armor][offhand][arrow][food]`, each `t`/`f`       |
| warn        | 102    | 6     | `ffffff` etc.           | Warning flags `[h][c][l][f][o][ammo]`, each `t`/`f`                          |

## Extraction formula

```
'%.Ns' * (#texto - ('%.Xs' * #texto))
```

Extracts N chars starting at byte offset X from `#texto` (title with prefix removed).  
Example — pixel: `'%.2s' * (#texto - ('%.6s' * #texto))`

## Durability field padding

Durability fields (`h_cur`…`o_max`) use **`0`-padding** (not `_`). The bar only renders when `cur ≠ max`.

| Condition                         | cur sent | max sent |
| --------------------------------- | -------- | -------- |
| Empty slot                        | `00000`  | `00000`  |
| Equipped, no durability component | `00000`  | `00000`  |
| Equipped, full durability         | `00NNN`  | `00NNN`  |
| Equipped, damaged                 | `00CCC`  | `00MMM`  |

## `show` flag semantics

| Index | Overlay | `t` when                                                             |
| ----- | ------- | -------------------------------------------------------------------- |
| 0     | armor   | `armorMode=always` OR (`armorMode=auto` AND any armor slot occupied) |
| 1     | offhand | `offhandMode=always` OR (`offhandMode=auto` AND offhand occupied)    |
| 2     | arrow   | `arrowMode=always` OR (`arrowMode=auto` AND shooter in main hand)    |
| 3     | food    | `hungerOverlay` player property is `true`                            |

## `warn` flag semantics

Equipment slots (`[h][c][l][f][o]`) warn when `max > 0 AND cur/max < equipWarnThreshold/100`.
Ammo (`[ammo]`) warns when `showOverlay=true AND count < ammoWarnThreshold`.
All flags are `f` when `projectileWarnings` is disabled.

## Arrow count format

| Range     | Example | Result  |
| --------- | ------- | ------- |
| 0–999     | 42      | `___42` |
| 1000–9949 | 1500    | `_1.5k` |
| ≥9950     | 10000   | `__10k` |

For durability extraction, strip leading zeros: `(value - '0')`.
For `arrow`/`aslot`/`show`/`warn`, use extracted string directly.
