const express = require("express");
const bodyParser = require("body-parser");
const app = express();
let port = process.env.PORT || 1337;

require("dotenv").config();

const Discord = require("discord.js");
const { Client } = require("discord.js");
const client = new Client();

// Middleware
app.use(bodyParser.json());

//database
const mongoose = require("mongoose");

//models
const whitelistModel = require("../models/whitelistModel.js");
const blacklistModel = require("../models/blacklistModel.js");

//MONGOOSE DB CONFIG
const mongoURI = process.env.MONGO_URI;

// connect to mongo using mongoose
mongoose
  .connect(mongoURI, { useNewUrlParser: true })
  .then(() => console.log("MongoDB is connected via mongoose..."))
  .catch((err) => console.log(err));

// Create mongo connection
mongoose.set("useNewUrlParser", true);
mongoose.set("useUnifiedTopology", true);
const db = mongoose.connection;

db.on("error", console.error.bind(console, "Connection Error"));

// global variables
let whiteList = [];
let blackList = [];

// connected to discord server
client.on("ready", () => {
  console.log("Bot is ready");

  //fetching whitelist words
  whitelistModel.find({}).then((words) => {
    words.map((word) => {
      whiteList.push(word.word);
    });
  });

  //fetching blacklist words
  blacklistModel.find({}).then((words) => {
    words.map((word) => {
      blackList.push(word.word);
    });
  });
  //setting rich presence for bot
  client.user.setActivity("}help | Mod for SG Uni");
});

client.on("message", (message) => {
  // ***
  // maki reply function
  // ***

  // specific for maki. It will find the messages that maki deletes
  // and ping the admin team if the word is whitelisted
  if (message.author.id === "563434444321587202" && message.embeds[0]) {
    // message author is maki and message consist of embeds

    // variable to determine if the blacklisted word is detected
    let detectedBlackListWord = false;

    let messageType = message.embeds[0].author.name;
    let makiMessage = message.embeds[0].fields.filter((each) => {
      return each.name === "**Message**";
    });

    blackList.map((word) => {
      let reg = new RegExp(`\\b${word}\\b`);

      if (
        makiMessage[0] &&
        makiMessage[0].value.toString().toLowerCase().match(reg)
      ) {
        detectedBlackListWord = true;
      }
    });

    let roleMod = "";
    let roleAdmin = "";

    if (messageType === "Message deleted" && detectedBlackListWord) {
      // gettting the roles to ping
      message.guild.roles.cache.map((role) => {
        if (role.name === "Admins") {
          roleAdmin = role.toString();
        } else if (role.name === "Moderators") {
          roleMod = role.toString();
        }
      });
      // seraching for channel to send message to
      let channelId = "";

      // note that the channel has to be named 'message-logs'
      client.channels.cache.map((channel) => {
        if (channel.name === "message-logs") {
          channelId = channel.id;
        }
      });
      // sending the message
      client.channels
        .fetch(channelId)
        .then((ch) => {
          ch.send(
            `${message.author.tag} deleted a message from blacklist words: ${makiMessage[0].value} ${roleAdmin} ${roleMod}`
          );
        })
        .catch((err) => console.log(err));
    }
  }

  // ***
  // spam mute function
  // ***

  // adding to white list
  if (
    message.content.startsWith("}") &&
    message.member.hasPermission("KICK_MEMBERS")
  ) {
    const [CMD_NAME, ...args] = message.content
      .trim()
      .substring("}".length)
      .split(/\s+/);
    if (CMD_NAME === "addWhite") {
      if (args.length === 0)
        return message.reply("Indicate word to whitelist.");

      // forming the word with spaces
      let finalWhite = "";

      args.map((word, index) => {
        if (index === 0) {
          finalWhite += `${word}`;
        } else {
          finalWhite += ` ${word}`;
        }
      });

      // make sure word is not already in whitelist
      if (!whiteList.includes(finalWhite.toLowerCase())) {
        message.reply(`Added '${finalWhite.toLowerCase()}' to whitelist.`);
        // inserting it into the database
        whitelistModel.insertMany(
          { word: finalWhite.toLowerCase() },
          (err, result) => (err ? console.log(err) : console.log(result))
        );
        // pushing it to the state
        whiteList.push(finalWhite.toLowerCase());
      } else {
        message.reply("Word is already in whitelist.");
      }
    } else if (CMD_NAME === "addBlack") {
      if (args.length === 0)
        return message.reply("Indicate word to blacklist.");

      // forming the word with space
      let finalBlack = "";

      args.map((word, index) => {
        if (index === 0) {
          finalBlack += `${word}`;
        } else {
          finalBlack += ` ${word}`;
        }
      });

      // make sure word is not already in blacklist
      if (!blackList.includes(finalBlack.toLowerCase())) {
        message.reply(`Added '${finalBlack.toLowerCase()}' to blacklist.`);
        // insert into database
        blacklistModel.insertMany(
          { word: finalBlack.toLowerCase() },
          (err, result) => (err ? console.log(err) : console.log(result))
        );
        // updating the state
        blackList.push(finalBlack.toLowerCase());
      } else {
        message.reply("Word is already in blacklist.");
      }
    } else if (CMD_NAME === "delWhite") {
      if (args.length === 0) return message.reply("Indicate word to delete.");

      let finalWhite = "";

      args.map((word, index) => {
        if (index === 0) {
          finalWhite += `${word}`;
        } else {
          finalWhite += ` ${word}`;
        }
      });

      // make sure that the whitelist has the word
      if (whiteList.includes(finalWhite.toLowerCase())) {
        message.reply(`Removed '${finalWhite.toLowerCase()}' from whitelist.`);
        // remove from database
        whitelistModel.findOneAndDelete(
          { word: finalWhite.toLowerCase() },
          (err, result) =>
            err ? message.reply("Unable to remove word.") : console.log(result)
        );
        // update state
        whiteList.splice(whiteList.indexOf(finalWhite.toLowerCase()), 1);
      } else {
        message.reply("Word is not in whitelist.");
      }
    } else if (CMD_NAME === "delBlack") {
      if (args.length === 0) return message.reply("Indicate word to delete.");

      let finalBlack = "";

      args.map((word, index) => {
        if (index === 0) {
          finalBlack += `${word}`;
        } else {
          finalBlack += ` ${word}`;
        }
      });

      // make sure the the blacklist has the word
      if (blackList.includes(finalBlack.toLowerCase())) {
        message.reply(`Removed '${finalBlack.toLowerCase()}' from blacklist.`);
        // remove from database
        blacklistModel.findOneAndDelete(
          { word: finalBlack.toLowerCase() },
          (err, result) =>
            err ? message.reply("Unable to remove word.") : console.log(result)
        );
        // update state
        blackList.splice(blackList.indexOf(finalBlack.toLowerCase()), 1);
      } else {
        message.reply("Word is not in blacklist.");
      }
    } else if (CMD_NAME === "whitelist") {
      // forming the msg to display
      let wordsmsg = "";

      // clearing the state
      whiteList.length = 0;
      // update state from database
      whitelistModel
        .find({})
        .then((words) => {
          words.map((word) => {
            whiteList.push(word.word);
          });
        })
        .then(() => {
          whiteList.map((word) => {
            wordsmsg += ` '${word}',`;
          });

          message.reply(`Whitelisted Words: ${wordsmsg}`);
        })
        .catch((err) => console.log(err));
    } else if (CMD_NAME === "help") {
      message.reply(
        `Available commands below for Admin team: 

        - }whitelist => Opt out of auto-mute
        - }addWhite [WORD] => add to whitelist
        - }delWhite [WORD] => delete from whitelist
        - }blacklist => Ping Admin & Mods when Maki deletes the word
        - }addBlack [WORD] => add to blacklist
        - }delBlack [WORD] => delete from blacklist`
      );
    } else if (CMD_NAME === "blacklist") {
      // forming the message to display
      let wordsmsg = "";
      // clearing the state
      blackList.length = 0;
      // update the state from database
      blacklistModel
        .find({})
        .then((words) => {
          words.map((word) => {
            blackList.push(word.word);
          });
        })
        .then(() => {
          blackList.map((word) => {
            wordsmsg += ` '${word}',`;
          });

          message.reply(`Blacklisted Words: ${wordsmsg}`);
        })
        .catch((err) => console.log(err));
    } else {
      message.reply(` Wrong command. Use }help`);
    }
  }

  // this function can check whether the content of the message you pass is the same as this message
  let filter = (msg) => {
    return (
      msg.content.toLowerCase() === message.content.toLowerCase() && // check if the content is the same (sort of)
      msg.author === message.author &&
      !whiteList.includes(msg.content.toLowerCase())
    ); // check if the author is the same, message the same, is not a whitelisted word
  };

  message.channel
    .awaitMessages(filter, {
      maxMatches: 1, // you only need that to happen once
      time: 5 * 1000, // time is in milliseconds
    })
    .then((collected) => {
      // this function will be called when a message matches you filter
      if (collected.size === 2) {
        const user = message.author;
        // ensure that it is not by a bot
        if (user && !message.author.bot) {
          // Now we get the member from the user
          const member = message.guild.member(user);

          //cal diff in dates
          var startDate = new Date(member.joinedTimestamp);
          // current date
          var endDate = new Date();
          // get total seconds between the times
          var delta = Math.abs(endDate - startDate) / 1000;
          // calculate whole days
          var days = Math.floor(delta / 86400);

          // logs to mod logs channel if spam is detected by older user
          let channelId = "";

          client.channels.cache.map((channel) => {
            if (channel.name === "tur-mod-logs") {
              channelId = channel.id;
            }
          });
          client.channels.fetch(channelId).then((ch) => {
            ch.send(
              `${message.author.tag} is around ${days} days old in server and is caught spamming ${message.content}.`
            );
          });

          // If the member is in the guild
          if (member && days <= 1) {
            // mute
            let muteRoleId = null;

            message.guild.roles
              .fetch()
              .then((roles) => {
                let rolesInServer = roles.cache;
                rolesInServer.map((role) => {
                  if (role.name === "Muted") {
                    muteRoleId = role.id;
                  }
                });
              })
              .then(() => {
                if (muteRoleId) {
                  message.member.roles
                    .add(muteRoleId)
                    .then(() => {
                      // reply user with msg
                      message.reply(
                        "You have been muted for spamming messages. Please DM the admins / mods."
                      );
                      message.author.send(
                        "You have been muted for spamming messages. Please DM the admins / mods with a reason on why you are not in the wrong. You will be banned if no dms are received from you within 24 hours."
                      );

                      // logs to mod logs channel since user is muted
                      let channelId = "";

                      client.channels.cache.map((channel) => {
                        if (channel.name === "tur-mod-logs") {
                          channelId = channel.id;
                        }
                      });
                      client.channels
                        .fetch(channelId)
                        .then((ch) => {
                          // inside a command, event listener, etc.
                          const msgEmbed = new Discord.MessageEmbed()
                            .setColor("#0099ff")
                            .setTitle(`Member MUTED by Mod Bot.`)
                            .setAuthor(
                              "SGUniMod",
                              "https://i.imgur.com/iGpuxI8.png"
                            )
                            .setDescription(
                              `${
                                message.author.tag
                              } has been muted for spamming the message '${
                                message.content
                              }' for ${collected.size + 1} times or more. `
                            )
                            .addFields(
                              {
                                name: "Details",
                                value: "Below are the details of the mute: ",
                              },
                              {
                                name: "\u200b",
                                value: "\u200b",
                                inline: false,
                              },
                              {
                                name: "User Tag",
                                value: `${message.author.tag}`,
                                inline: true,
                              },
                              {
                                name: "User Id",
                                value: `${message.author.id}`,
                                inline: true,
                              },
                              {
                                name: "Is User a bot?",
                                value: `${message.author.bot}`,
                                inline: true,
                              },
                              {
                                name: "Message Content",
                                value: `${message.content}`,
                                inline: true,
                              },
                              {
                                name: "Last Message Id",
                                value: `${message.author.lastMessageID}`,
                                inline: true,
                              },
                              {
                                name: "Last Message Channel Id",
                                value: `${message.author.lastMessageChannelID}`,
                                inline: true,
                              },
                              {
                                name: "Message TimeStamp",
                                value: `${new Date(message.createdTimestamp)}`,
                                inline: true,
                              },
                              {
                                name: "Mentions In Message",
                                value: `Everyone: ${
                                  message.mentions.everyone
                                }, Users: ${
                                  message.mentions.users.size > 0
                                    ? message.mentions.users.map((user) => {
                                        return user;
                                      })
                                    : "false"
                                }, Roles: ${
                                  message.mentions.roles.size > 0
                                    ? message.mentions.roles.map((role) => {
                                        return role;
                                      })
                                    : "false"
                                }`,
                                inline: true,
                              },
                              {
                                name: "Message Embeds",
                                value: `${
                                  message.embeds.length > 0
                                    ? message.embeds.map((em) => {
                                        return em.url;
                                      })
                                    : "false"
                                }`,
                                inline: true,
                              },
                              {
                                name: "Message Attachments",
                                value: `${
                                  message.attachments.size > 0
                                    ? message.attachments.map((att) => {
                                        return att;
                                      })
                                    : "false"
                                }`,
                                inline: true,
                              }
                            )
                            .setTimestamp();
                          ch.send(msgEmbed);
                        })
                        .catch((err) => console.log(err));
                    })
                    .catch((err) => {
                      message.reply(
                        `Unable to mute user due to ${err.message}`
                      );
                      console.log(err);
                    });
                }
              })
              .catch((err) => console.log(err));
          } else {
            if (member) {
              return;
            } else {
              // The mentioned user isn't in this guild
              message.reply("That user isn't in this guild!");
            }
          }
        }
      }
    })
    .catch(console.error);
});

// connection to discord api
client.login(process.env.DISCORDJS_BOT_TOKEN);

// sending to client side on server
app.get("/", (req, res) => {
  res.send("Go away");
});

// listening to port
app.listen(port, () => {
  console.log(`app is listenning on port ${port}`);
});
