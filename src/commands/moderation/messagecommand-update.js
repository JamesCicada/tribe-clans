const { AttachmentBuilder, Message } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const MessageCommand = require("../../structure/MessageCommand");
const config = require("../../config");
const clansDb = require("../../models/clan");

module.exports = new MessageCommand({
  command: {
    name: "update",
    description: "Update clan info.",
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
    const reply = await message.reply({
      content: "Please wait...",
    });
    const role =
      message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    const clans = await clansDb.findOne({ roleId: role.id });
    if (!clans) {
      await reply.edit({
        content: "No clan found.",
      });
      return;
    }
    const action = args[1];
    const validActions = ["vc", "text", "leader"];
    const newValue = args[2];
    try {
      if (!validActions.includes(action)) {
        await reply.edit({
          content:
            "Invalid action. usage ```.c update <roleId> <vc/text/leader>```",
        });
        return;
      }
      switch (action) {
        case "vc":
          const channel =
            message.mentions.channels.first() ||
            message.guild.channels.cache.get(newValue);
          if (!channel) {
            await reply.edit({
              content:
                "Invalid channel. usage ```.c update <roleId> <vc/text/leader>```",
            });
            return;
          }
          clans.voiceId = channel.id;
          await clans.save();
          await reply.edit({
            content: "Updated!",
          });
          break;
        case "text":
          const textChannel =
            message.mentions.channels.first() ||
            message.guild.channels.cache.get(newValue);
          if (!textChannel) {
            await reply.edit({
              content:
                "Invalid channel. usage ```.c update <roleId> <vc/text/leader>```",
            });
            return;
          }
          clans.textId = textChannel.id;
          await clans.save();
          await reply.edit({
            content: "Updated!",
          });
          break;
        case "leader":
          const member =
            message.mentions.members.first() ||
            message.guild.members.cache.get(newValue);
          if (!member) {
            await reply.edit({
              content:
                "Invalid member. usage ```.c update <roleId> <vc/text/leader>```",
            });
            return;
          }
          clans.leader = member.id;
          await clans.save();
          await reply.edit({
            content: "Updated!",
          });
          break;
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
