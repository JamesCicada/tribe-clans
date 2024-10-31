const { AttachmentBuilder, Message } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const MessageCommand = require("../../structure/MessageCommand");
const config = require("../../config");
const clansDb = require("../../models/clan");
const { ActionRowBuilder } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const { ButtonBuilder } = require("discord.js");

module.exports = new MessageCommand({
  command: {
    name: "delete",
    description: "delete a Clan.",
    aliases: [],
  },
  /**
   *
   * @param {DiscordBot} client
   * @param {Message} message
   * @param {string[]} args
   */
  run: async (client, message, args) => {
    if (!message.member.permissions.has("Administrator"))
      return message.react("🤡");
    const command = message;
    message = await message.reply({
      content: "Please wait...",
    });
    const role =
      message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    try {
      // Check if all data is given
      if (!role) {
        command.react("❌");
        await message.edit({
          content: `Input invalid. usage: \`\`\`.c delete <roleId>\`\`\``,
        });
        return;
      }
      // Check if given data is actually valid
      const clan = await clansDb.findOne({ roleId: role.id });
      if (!clan) {
        command.react("❌");
        await message.edit({
          content: "No clan found.",
        });
        return;
      }
      const embed = new EmbedBuilder().setDescription(
        `
        # Are you sure you want to delete this clan?
        Name: ${role.name}
        Role: <@&${clan.roleId}>
        Leader: <@${clan.leader}>
        Coleaders: ${clan.coleaders.join(", ")}
        Members: ${clan.members.length} members
        Voice Channel: <#${clan.voiceId}>
        Text Channel: <#${clan.textId}>
        `
      );
      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("delete")
          .setLabel("Delete")
          .setStyle(4),
        new ButtonBuilder().setCustomId("cancel").setLabel("Cancel").setStyle(4)
      );
      await message.edit({
        embeds: [embed],
        components: [actionRow],
      });
      const filter = (i) => i.user.id === command.author.id;
      const collector = message.channel.createMessageComponentCollector({
        filter,
        time: 30000,
      });

      collector.on("collect", async (i) => {
        if (i.customId === "cancel") {
          await i.update({
            content: "Cancelled.",
            components: [],
            embeds: [],
          });
          collector.stop();
          return;
        }
        if (i.customId === "delete") {
          await i.update({
            content: "Deleting clan...",
            components: [],
            embeds: [],
          });
          await clansDb.deleteOne({ roleId: role.id });
          await message.edit({
            content: "Clan deleted.",
            embeds: [],
            components: [],
          });
          collector.stop();
        }
      });

      collector.on("end", async (collected) => {
        if (collected.size === 0) {
          await message.edit({
            content: "Timed out.",
            components: [],
            embeds: [],
          });
        }
      });
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
