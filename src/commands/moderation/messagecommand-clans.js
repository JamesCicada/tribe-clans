const { AttachmentBuilder, Message } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const MessageCommand = require("../../structure/MessageCommand");
const config = require("../../config");
const clansDb = require("../../models/clan");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");

module.exports = new MessageCommand({
  command: {
    name: "clans",
    description: "Gives a list of all clans.",
    aliases: [],
  },
  /**
   *
   * @param {DiscordBot} client
   * @param {Message} message
   * @param {string[]} args
   */
  run: async (client, message, args) => {
    let replyMessage = await message.reply({
      content: "Please wait...",
    });
    
    try {
      const clans = await clansDb.find();
      let currentPage = 0;

      const updateEmbed = (page) => {
        const maxPage = Math.ceil(clans.length / 5);
        const embed = new EmbedBuilder()
          .setColor("DarkButNotBlack")
          .setTitle("Clan List")
          .setDescription(`Page ${page + 1} of ${maxPage}`)
          .addFields(
            clans.slice(page * 5, page * 5 + 5).map((clan, index) => {
              const clanRole = message.guild.roles.cache.get(clan.roleId);
              return {
                name: `${page * 5 + index + 1}. ${clanRole?.name || "No Role"}`,
                value: `Role: <@&${clanRole?.id || "None"}>\nID: \`${clan.clanId}\``,
                inline: false,
              };
            })
          )
          .setFooter({ text: `Showing clans ${page * 5 + 1}-${Math.min(clans.length, (page + 1) * 5)} out of ${clans.length}` });

        return embed;
      };

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("previous-page")
          .setEmoji("⏪")
          .setStyle("Primary")
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId("next-page")
          .setEmoji("⏩")
          .setStyle("Primary")
          .setDisabled(currentPage === Math.ceil(clans.length / 5) - 1)
      );

      await replyMessage.edit({
        content: null,
        embeds: [updateEmbed(currentPage)],
        components: [buttons],
      });

      const filter = (i) => i.user.id === message.author.id;
      const collector = replyMessage.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on("collect", async (i) => {
        if (i.customId === "previous-page" && currentPage > 0) {
          currentPage--;
        } else if (i.customId === "next-page" && currentPage < Math.ceil(clans.length / 5) - 1) {
          currentPage++;
        }

        await i.update({
          embeds: [updateEmbed(currentPage)],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("previous-page")
                .setEmoji("⏪")
                .setStyle("Primary")
                .setDisabled(currentPage === 0),
              new ButtonBuilder()
                .setCustomId("next-page")
                .setEmoji("⏩")
                .setStyle("Primary")
                .setDisabled(currentPage === Math.ceil(clans.length / 5) - 1)
            ),
          ],
        });
      });

      collector.on("end", async () => {
        await replyMessage.edit({ components: [] });
      });
    } catch (err) {
      console.error(err);
      await replyMessage.edit({
        content: "Something went wrong.",
        files: [
          new AttachmentBuilder(Buffer.from(`${err}`, "utf-8"), {
            name: "error.txt",
          }),
        ],
      });
    }
  },
}).toJSON();
