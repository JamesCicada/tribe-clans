const { AttachmentBuilder, Message } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const MessageCommand = require("../../structure/MessageCommand");
const config = require("../../config");
const clansDb = require("../../models/clan");
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require("discord.js");
module.exports = new MessageCommand({
  command: {
    name: "coleader",
    description: "Promotes a member to co-leader.",
    aliases: ["cl", "co-leader"],
  },
  /**
   *
   * @param {DiscordBot} client
   * @param {Message} message
   * @param {string[]} args
   */
  run: async (client, message, args) => {
    const reply = await message.reply({
      content: "Please wait...",
    });
    const action = args[0];
    if (!["add", "remove"].includes(action)) {
      reply.edit({
        content: "Invalid action. Usage: `.c coleader <add/remove> <memberId>`",
      });
    }
    const member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[1]);
    try {
      const clan = await clansDb.findOne({
        members: message.member.id,
      });
      if (!clan) {
        await reply.edit({
          content: "No clan found.",
        });
        return;
      }
      if (action === "add") {
        if (
          !clan.coleaders.includes(message.member.id) &&
          clan.leader != message.member.id
        ) {
          await reply.edit({
            content:
              "To invite a member, You must be a co-leader or the leader of the clan.",
          });
          return;
        }
        if (clan.coleaders.includes(member.id)) {
          await reply.edit({
            content: "Member is already in the clan.",
          });
          return;
        }
        if(!clan.members.includes(member.id)){
          await reply.edit({
            content: "Member is not in the clan.",
          });
          return;
        }
        await clansDb.findOneAndUpdate(
          {
            members: message.member.id,
          },
          {
            $push: {
              coleaders: member.id,
            },
          }
        );
        await reply.edit({
          content: "Member added to the clan.",
        });
      } else if (action === "remove") {
        if (
          !clan.coleaders.includes(message.member.id) &&
          clan.leader != message.member.id
        ) {
          await reply.edit({
            content:
              "To invite a member, You must be a co-leader or the leader of the clan.",
          });
          return;
        }
        if (!clan.coleaders.includes(member.id)) {
          await reply.edit({
            content: "Member is not in the clan.",
          });
          return;
        }
        await clansDb.findOneAndUpdate(
          {
            members: message.member.id,
          },
          {
            $pull: {
              coleaders: member.id,
            },
          }
        );
        await reply.edit({
          content: "Member removed from the clan.",
        });
      }
      await client.logToChannel({
        color: action === "add" ? "Green" : "Red",
        description: `
        **Clan:** ${clan.name}

        **Action:** ${action}

        **Member:** <@${member.id}>

        **Responsible:** <@${message.member.id}>
        `,
      });
    } catch (err) {
      await reply.edit({
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
