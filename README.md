<div align="center">
  <img src="https://raw.githubusercontent.com/AnotherSeawhite/sweepnslash/master/sweepnslash_logo.png" alt="Image" width="425" height="226" />

  [![CurseForge Downloads](https://cf.way2muchnoise.eu/full_1104407_downloads.svg)](https://www.curseforge.com/minecraft-bedrock/addons/sweep-n-slash)
  [![Minecraft - Version](https://img.shields.io/badge/Minecraft-v1.21.111_(Bedrock)-e04e14?label=Available%20For&labelColor=2d2d2d&color=e04e14)](https://www.curseforge.com/minecraft-bedrock/addons/sweep-n-slash/files/all)
  [![GitHub License](https://img.shields.io/github/license/AnotherSeawhite/sweepnslash)](https://github.com/AnotherSeawhite/sweepnslash/blob/main/LICENSE)
  [![Discord](https://badgen.net/discord/members/dAcghG992N?icon=discord)](https://discord.gg/dAcghG992N)
</div>

**Sweep 'N Slash** is a total conversion add-on that introduces some of the combat aspects from Java Edition's 1.9 Combat Update into Bedrock Edition.

# How It Works

Minecraft Bedrock Edition's entities are data-driven, consisting of "components." Some of the mob behaviors are hard-coded, but many components can be overwritten with behavior packs. Attack component is one of them.
By setting the player entity's attack component value to a very large negative number, you can disable players' attacks entirely. This allows behavior packs to replace combat. This add-on makes use of that to add 1.9 combat aspects.

The major drawback of this method is that since it's most likely a bug, it causes unintended behaviors. And since everything is handled in server-side, it's not performance-friendly for large servers. (It was tested only in the LAN multiplayer.)

Also, since Bedrock's Scripting API lacks in reading/writing entity/item attribute components, it is not possible to read attack damage component for item stats. All the item stats have to be defined manually.

# Cross-Compatibility

This project uses [MCPE-IPC](https://github.com/OmniacDev/MCBE-IPC) for Cross-compatibility. It allows the add-on to have item stats defined by receiving scriptevents of item data from external behavior packs. This eliminates the hassle of having to modify the add-on's internal data.
