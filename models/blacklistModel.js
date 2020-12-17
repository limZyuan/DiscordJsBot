const mongoose = require("mongoose");
mongoose.set("debug", true);

const blacklistSchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
    },
  },
  { collection: "blacklist_words" }
);

const blacklist = mongoose.model("blacklist", blacklistSchema);

module.exports = blacklist;
