const { Schema, model } = require("mongoose");

const clanSchema = new Schema({
  leader: String,
  coleaders: [String],
  members: [String],
  roleId: String,
  voiceId: String,
  textId: String,
});

module.exports = model("Clan", clanSchema);
