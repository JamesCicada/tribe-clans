const { AttachmentBuilder, Message } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const MessageCommand = require("../../structure/MessageCommand");
const config = require("../../config");
const clansDb = require("../../models/clan");
const { EmbedBuilder } = require("discord.js");

module.exports = new MessageCommand({
  command: {
    name: "clan",
    description: "Finds a clan by roleId.",
    aliases: [],
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
    const role =
      message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    const roleId = role?.id;
    try {
      const clan = await clansDb.findOne({ roleId: roleId });
      if (!clan) {
        await message.edit({
          content: "No clan found.",
        });
        return;
      }
      const embed = new EmbedBuilder()
        .setDescription(
          `
        ## **${role.name}** Clan Info

        > Role: <@&${clan.roleId}>

        > Leader: <@${clan.leader}>
        
        > Coleaders: ${clan.coleaders.map((id) => `<@${id}>`).join(", ")}
        
        > Members: ${clan.members.length} members
        
        > Voice Channel: <#${clan.voiceId}>
        
        > Text Channel: <#${clan.textId}>
        `
        )
        .setColor(0x0099ff);
      await message.edit({ embeds: [embed] });
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
