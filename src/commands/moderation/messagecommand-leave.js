const { AttachmentBuilder, Message } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const MessageCommand = require("../../structure/MessageCommand");
const config = require("../../config");
const clansDb = require("../../models/clan");
const { EmbedBuilder } = require("discord.js");
const { ActionRowBuilder } = require("discord.js");
const { ButtonBuilder } = require("discord.js");

module.exports = new MessageCommand({
  command: {
    name: "leave",
    description: "Leave your clan.",
    aliases: ["l"],
  },
  /**
   *
   * @param {DiscordBot} client
   * @param {Message} message
   * @param {string[]} args
   */
  run: async (client, message, args) => {
    // if (!message.member.permissions.has("Administrator"))
    //   return message.react("🤡");
    const command = message;
    message = await message.reply({
      content: "Please wait...",
    });
    try {
      const clan = await clansDb.findOne({ members: command.member.id });
      if (!clan) {
        await message.edit({
          content: "No clan found.",
        });
        return;
      }
      const isLeader = clan.leader === command.member.id;
      if (isLeader) {
        await message.edit({
          content:
            "The leader cannot leave the clan, try to transfer leadership first.",
        });
        return;
      }
      const validRole = message.guild.roles.cache.get(clan.roleId);
      const embed = new EmbedBuilder().setColor("Yellow").setDescription(`
        Are you sure you want to leave ${validRole} clan?
        `);
      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setStyle(3).setCustomId("yes").setLabel("Yes"),
        new ButtonBuilder().setStyle(1).setCustomId("no").setLabel("No")
      );
      await message.edit({ embeds: [embed], components: [actionRow] });
      const filter = (i) => i.user.id === command.member.id;
      const collector = message.createMessageComponentCollector({
        filter,
        time: 15000,
      });

      collector.on("collect", async (i) => {
        if (i.user.id === command.member.id) {
          if (i.customId === "yes") {
            await clansDb.findOneAndUpdate(
              { members: command.member.id },
              { $pull: { members: command.member.id } }
            );
            await clansDb.findOneAndUpdate(
              { roleId: clan.roleId },
              { $pull: { coleaders: command.member.id } }
            );
            await message.edit({
              content: "You left the clan.",
              embeds: [],
              components: [],
            });
            command.member.roles.remove(clan.roleId, ['Left the clan.']);
          } else if (i.customId === "no") {
            await message.edit({
              content: "Cancelled.",
              embeds: [],
              components: [],
            });
          }
        }
      });
      collector.on("end", async (i) => {
          if(i.size == 0){
            await message.edit({
              content: "Timed out.",
              embeds: [],
              components: [],
            });
          }
      })
      client.logToChannel({
        color: "Red",
        description: `
        ${command.author.tag} (${command.author.id}) left the clan ${validRole} (${validRole.name})
        `,
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
