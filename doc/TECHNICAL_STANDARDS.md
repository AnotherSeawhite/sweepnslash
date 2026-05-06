# Technical Standards
This document explains the technical standards and development scope about what is desired, what is not and why.

## Vision & Scope
Sweep 'N Slash is an add-on, not a mod. The primary goal is to bring The Combat Update's aspects into Bedrock Edition, not to mimic Java Edition. While there are certainly many features that this add-on could benefit from, it will not consider that are not related with The Combat Update.

## Technical Constraints
Because add-ons do not have the same freedom as modding, we adhere to the following technical boundaries:
- API Compliance: We only use official hooks from Scripting API and documented entry points. Features requiring "hacky" workarounds or destructive overwriting of core files are considered out of scope.
  - `player.json` is an exception for this, since the add-on as whole is based around 'disabling vanilla combat'.
- Zero-Regression: Any new feature must not negatively affect performance or alter gameplay in a way that could affect Bedrock experience.
- Maintenance Sustainability: Features that require constant maintenance to remain functional is not desired unless necessary.

Following is a list of examples. Broad categories are "Yes (Desired)", "Maybe" and "No" :


### Parity

#### Attack animations: Desired but will not add for now
This is one of the features that we really want, but the  maintenance cost of current "best" method is too high, as it requires us to add attachments for every single items.

#### Ability to use items in Offhand: Not from this add-on
Adding Offhand support for mobile users is very tricky. It is simply not possible for us to implement it in a way that everyone would like.

Mojang developers are considering implementation of Offhand support. But it hasn't been fully planned yet. According to one of the Mojangsters in Bedrock Add-Ons Discord server:
>"This is just very early investigations into the problem space and needs to prepare for planning. Nothing being worked on yet."
>— Anjku

#### Holding interact (right-click) for shield: No
Shield in Java Edition requires holding interact to use, while Bedrock Edition uses sneaking. The reason why Bedrock uses sneaking is mainly due to the environment that many players are in: Touchscreen.
  - For Tap-to-Interact, holding interact is not feasible in this control scheme.
  - For Action Buttons, it can be overwhelming since touchscreen control does not have as much freedom as other control methods.

#### Sweeping Edge enchantment: Desired
This is very desired, but unless Bedrock gets official custom enchantment, it will not be added. Until then, all the sweep attacks will have Sweeping Edge I property by default.

#### Techniques from JE in general: No
Many techniques from Java Edition are mainly exploits of system, one of them being "Attribute Swapping". Most of player actions in Java Edition are client authoritative, and player's attack damage is dictated by what player is holding. However, Bedrock does not do this. Attacking and swapping at the same tick will cause the game to force swap player's selected slot to previous one and void the attack.

On top of that, the add-on works by directly getting data-driven, user-specified stats of an item from memory, which wouldn't work well.


### Other Things

#### AppleSkin: Being worked on
The add-on has Saturation Healing feature. Due to the nature of this add-on, other AppleSkin add-on generally causes conflict and does not work, so we decided to make our own.


TODO: Write more
