const { AttachmentBuilder, Message } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const MessageCommand = require("../../structure/MessageCommand");
const config = require("../../config");
const clansDb = require("../../models/clan");

module.exports = new MessageCommand({
  command: {
    name: "create",
    description: "Create a new Clan.",
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
    const ownerId =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);
    const role =
      message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    const voiceId = args[2];
    const textId = args[3];
    try {
      // Check if all data is given
      if (!ownerId || !role || !voiceId || !textId) {
        command.react("❌");
        await message.edit({
          content: `Input invalid. usage: \`\`\`.c create <ownerId> <roleId> <voiceId> <textId>\`\`\``,
        });
        return;
      }
      // Check if given data is actually valid
      // Check if ownerId is a guild member and not a member of other clans
      if (!ownerId.user || ownerId.user.bot) {
        command.react("❌");
        await message.edit({
          content: `Clan owner should be a guild member and not a bot.`,
        });
        return;
      }
      const isInClan = await clansDb.findOne({
        members: ownerId.id,
      });
      if (isInClan) {
        command.react("❌");
        await message.edit({
          content: `The clan owner can't be a member of another clan.`,
        });
        return;
      }
      // Check if roleId is a guild role and not a member of other clans
      if (!role.name) {
        command.react("❌");
        await message.edit({
          content: `Couldn't find the provided role.`,
        });
        return;
      }
      const isClanRole = await clansDb.findOne({
        roleId: role.id,
      });
      if (isClanRole) {
        command.react("❌");
        await message.edit({
          content: `The provided role is already in use.`,
        });
        return;
      }
      // Check if voiceId is a voice channel and not a member of other clans
      if (!message.guild.channels.cache.get(voiceId)) {
        command.react("❌");
        await message.edit({
          content: `Couldn't find the provided voice channel.`,
        });
        return;
      }
      const isClanVoice = await clansDb.findOne({
        voiceChannelId: voiceId,
      });
      if (isClanVoice) {
        command.react("❌");
        await message.edit({
          content: `The provided voice channel is already in use.`,
        });
        return;
      }
      // Check if textId is a text channel and not a member of other clans
      if (!message.guild.channels.cache.get(textId)) {
        command.react("❌");
        await message.edit({
          content: `Couldn't find the provided text channel.`,
        });
        return;
      }
      const isClanText = await clansDb.findOne({
        textChannelId: textId,
      });
      if (isClanText) {
        command.react("❌");
        await message.edit({
          content: `The provided text channel is already in use.`,
        });
        return;
      }
      const newClan = new clansDb({
        leader: ownerId.user.id,
        coleaders: [],
        members: [ownerId.user.id],
        roleId: role.id,
        voiceId: voiceId,
        textId: textId,
      });
      await newClan.save();
      await message.edit({
        content: `Clan created.`,
      });
      command.react("✅");
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
