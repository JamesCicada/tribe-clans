const { Schema, model } = require("mongoose");

const clanSchema = new Schema({
  clanId: String,
  leader: String,
  coleaders: [String],
  members: [String],
  roleId: String,
  voiceId: String,
  textId: String,
});

module.exports = model("Clan", clanSchema);
