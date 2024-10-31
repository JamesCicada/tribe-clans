const { AttachmentBuilder, Message } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const MessageCommand = require("../../structure/MessageCommand");
const config = require("../../config");
const clansDb = require("../../models/clan");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");
module.exports = new MessageCommand({
  command: {
    name: "member",
    description: "Add or remove a member from the clan.",
    aliases: ["m"],
  },
  /**
   *
   * @param {DiscordBot} client
   * @param {Message} message
   * @param {string[]} args
   */
  run: async (client, message, args) => {
    const command = message;
    message = await message.reply({
      content: "Please wait...",
    });
    const action = args[0];
    const member =
      command.mentions.members.first() ||
      command.guild.members.cache.get(args[1]);
    try {
      const clan = await clansDb.findOne({
        members: command.member.id,
      });
      if (!clan) {
        await message.edit({
          content: "No clan found.",
        });
        return;
      }

      if (!["add", "remove"].includes(action)) {
        await message.edit({
          content: "Invalid action. Usage: `.c member <add/remove> <memberId>`",
        });
        return;
      }
      if (
        !clan.coleaders.includes(command.member.id) &&
        clan.leader != command.member.id
      ) {
        await message.edit({
          content:
            "To invite a member, You must be a co-leader or the leader of the clan.",
        });
        return;
      }
      const role = message.guild.roles.cache.get(clan.roleId);
      if (!member) {
        await message.edit({
          content: "No member found.",
        });
        return;
      }
      if (action === "add") {
        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("accept")
            .setLabel("Accept")
            .setStyle("Success"),
          new ButtonBuilder()
            .setCustomId("decline")
            .setLabel("Decline")
            .setStyle("Danger")
        );
        await message.edit({
          content: `${member}, Do you accept the invitation to join ${role.name} clan?`,
          components: [actionRow],
        });

        const filter = (i) => i.user.id === member.id;
        const collector = message.channel.createMessageComponentCollector({
          filter,
          max: 1,
          time: 60000,
        });
        collector.on("collect", async (i) => {
          if (i.customId == "accept") {
            await member.roles.add(clan.roleId);
            await message.edit({
              content: `${member} has joined ${role.name} clan.`,
              components: [],
            });
            await clansDb.findOneAndUpdate(
              { roleId: clan.roleId },
              { $push: { members: member.id } }
            );
          } else if (i.customId == "decline") {
            await message.edit({
              content: `${member} has declined the invitation to join ${role.name} clan.`,
              components: [],
            });
          }
        });

        collector.on("end", async (collected) => {
          if (!collected.size) {
            await message.edit({
              content: `Invitation timed out.`,
              components: [],
            });
          }
        });
      } else if (action === "remove") {
        await member.roles.remove(clan.roleId);
        await message.edit({
          content: `${member} has left ${role.name} clan.`,
        });
        await clansDb.findOneAndUpdate(
          { roleId: clan.roleId },
          { $pull: { members: member.id } }
        );
      }
    } catch (err) {
      await message.edit({
        content: "Something went wrong.",
        files: [
          new AttachmentBuilder(Buffer.from(`${err}`, "utf-8"), {
            name: "output.ts",
          }),
        ],
      });
    }
  },
}).toJSON();
