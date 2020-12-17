const mongoose = require("mongoose");
mongoose.set("debug", true);

const whitelistSchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
    },
  },
  { collection: "whitelist_words" }
);

const whitelist = mongoose.model("whitelist", whitelistSchema);

module.exports = whitelist;
