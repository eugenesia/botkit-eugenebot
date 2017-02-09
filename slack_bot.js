/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node slack_bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it is running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

'use strict';

// Config and credentials.
const config = require('./config');

const os = require('os');
const Botkit = require('./lib/Botkit.js');

const spotify = require('./spotify');

const apiai = require('botkit-middleware-apiai')({
  token: config.apiaiToken,

  // or false. If true, the middleware don't send the bot reply/says to api.ai
  skip_bot: false,
});

const controller = Botkit.slackbot({
  debug: config.debug,
});

// Spawn the Slack bot.
const bot = controller.spawn({
  token: config.slackToken,
}).startRTM();

controller.middleware.receive.use(apiai.receive);


// Search Spotify for songs.
controller.hears(['search spotify for (.+)'], 'direct_message,direct_mention,mention', function(bot, message) {

  // Search term e.g. 'love'
  let query = message.match[1];
  spotify.searchTracks(query, function(err, tracks) {
    if (err) {
      console.log('Error searching spotify', err);
      return;
    }

    // Create a reply with attachments.
    let replyWithAttachments = {
      text: 'Found Spotify tracks with text "' + query + '":',
      attachments: [],
    };

    tracks.forEach(function(track, index) {
      // Add a new attachment.
      replyWithAttachments.attachments.push({
        title: track.artistName,
        title_link: track.trackUrl,
        thumb_url: track.thumbUrl,
        text: '<' + track.trackUrl + '|' + track.trackName + '>',
        footer: track.albumName,
      });
    });

    bot.reply(message, replyWithAttachments);
  });
});


// Search for FAQs by search term.
const faqHelper = require('./faq');

controller.hears('search faqs? for (.+)', 'direct_message,direct_mention,mention',
  (bot, message) => {

    let term = message.match[1];
    // Replace mentions e.g. @username.
    term = term.replace(/<@\w+>/g, '');

    bot.reply(message, `Searching FAQ for ${term}`);
    faqHelper.search(term, (err, result) => {

      let reply = '';

      if (err) {
        reply = 'Sorry, there was an error: \n>>> \n' + err.toString();
      }
      else {
        let total = result.searchRecords.length;

        reply = `${total} FAQs found. Showing up to top 5 results:\n\n`
          // Blockquote the article details.
          + '>>> \n';

        // Append details of first 5 records.
        for (let i=0; i<Math.min(total, 5); i++) {

          let record = result.searchRecords[i];

          reply += `*ArticleNumber:* ${record.ArticleNumber}\n`
            + `*Title:* ${record.Title}\n`
            + `*Summary:* ${record.Summary}\n\n`;
        }
      }

      bot.reply(message, reply);
    });
  }
);

// Find a single FAQ by ArticleNumber.
const sanitizeHtml = require('sanitize-html');
controller.hears('(find|show) faqs? ([0-9]{1,9})', 'direct_message,direct_mention,mention',
  (bot, message) => {

    let articleNum = message.match[2];
    bot.reply(message, `Finding FAQ ${articleNum}`);

    faqHelper.findByArticleNumber(articleNum, (err, result) => {

      let reply = '';

      if (result.totalSize > 0) {

        // Grab the first record as we are only expecting one FAQ.
        let record = result.records[0];

        // Strip HTML from Solution.
        let solution = sanitizeHtml(record.Solution__c, {
          allowedTags: [],
          parser: {
            // Decode entities as Slack allows them.
            decodeEntities: true,
          },
        });

        reply = `>>> \n *ArticleNumber:* ${record.ArticleNumber}\n`
          + `*Title:* ${record.Title}\n`
          + `*Summary:* ${record.Summary}\n\n`
          + `*Solution:*\n ${solution}`;
      }
      else {
        reply = "Sorry, FAQ doesn't exist.";
      }
      bot.reply(message, reply);
    });
  }
);





/* note this uses example middlewares defined above */


/*
controller.hears(['hello', 'hi', 'hey'], 'direct_message,direct_mention,mention', function(bot, message) {

  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'robot_face',
  }, function(err, res) {
    if (err) {
      bot.botkit.log('Failed to add emoji reaction :(', err);
    }
  });


  controller.storage.users.get(message.user, function(err, user) {
    if (user && user.name) {
      bot.reply(message, 'Hello ' + user.name + '!!');
    } else {
      bot.reply(message, 'Hello.');
    }
  });
});
*/

controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
  var name = message.match[1];
  controller.storage.users.get(message.user, function(err, user) {
    if (!user) {
      user = {
        id: message.user,
      };
    }
    user.name = name;
    controller.storage.users.save(user, function(err, id) {
      bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
    });
  });
});

controller.hears(['what is my name', 'who am i'], 'direct_message,direct_mention,mention', function(bot, message) {

  controller.storage.users.get(message.user, function(err, user) {
    if (user && user.name) {
      bot.reply(message, 'Your name is ' + user.name);
    } else {
      bot.startConversation(message, function(err, convo) {
        if (!err) {
          convo.say('I do not know your name yet!');
          convo.ask('What should I call you?', function(response, convo) {
            convo.ask('You want me to call you `' + response.text + '`?', [
              {
                pattern: 'yes',
                callback: function(response, convo) {
                  // since no further messages are queued after this,
                  // the conversation will end naturally with status == 'completed'
                  convo.next();
                }
              },
              {
                pattern: 'no',
                callback: function(response, convo) {
                  // stop the conversation. this will cause it to end with status == 'stopped'
                  convo.stop();
                }
              },
              {
                default: true,
                callback: function(response, convo) {
                  convo.repeat();
                  convo.next();
                }
              }
            ]);

            convo.next();

          }, {'key': 'nickname'}); // store the results in a field called nickname

          convo.on('end', function(convo) {
            if (convo.status == 'completed') {
              bot.reply(message, 'OK! I will update my dossier...');

              controller.storage.users.get(message.user, function(err, user) {
                if (!user) {
                  user = {
                    id: message.user,
                  };
                }
                user.name = convo.extractResponse('nickname');
                controller.storage.users.save(user, function(err, id) {
                  bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                });
              });

            } else {
              // this happens if the conversation ended prematurely for some reason
              bot.reply(message, 'OK, nevermind!');
            }
          });
        }
      });
    }
  });
});


controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function(bot, message) {

  bot.startConversation(message, function(err, convo) {

    convo.ask('Are you sure you want me to shutdown?', [
      {
        pattern: bot.utterances.yes,
        callback: function(response, convo) {
          convo.say('Bye!');
          convo.next();
          setTimeout(function() {
            process.exit();
          }, 3000);
        }
      },
      {
        pattern: bot.utterances.no,
        default: true,
        callback: function(response, convo) {
          convo.say('*Phew!*');
          convo.next();
        }
      }
    ]);
  });
});


controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
  'direct_message,direct_mention,mention', function(bot, message) {

    var hostname = os.hostname();
    var uptime = formatUptime(process.uptime());

    bot.reply(message,
      ':robot_face: I am a bot named <@' + bot.identity.name +
       '>. I have been running for ' + uptime + ' on ' + hostname + '.');
  });



// Choose a random praise for a name.
function randomPraise(name) {
  // List of praises to be used after a name.
  var praiseSuffixes = [
    ' is awesome!',
    ' is pretty cool!',
    ' is fantastic!',
    ' really makes my day!',
    ' is extraordinary!',
    ' est tres cool!',
  ];

  var index = Math.floor(Math.random() * praiseSuffixes.length);

  return name + praiseSuffixes[index];
}


// Look for user names and praise them.
controller.hears(['(what do you think of|do you like|how is) (doris|daeus|shyam|nicolo)'],
  'direct_message,direct_mention,mention', function(bot, message) {
  var name = message.match[2];
  // Capitalize first letter.
  name = name.charAt(0).toUpperCase() + name.slice(1);
  bot.reply(message, randomPraise(name));
});


// Look for user mentions and praise them, with mentions.
controller.hears(['(what do you think of|do you like|how is) (<@U04AB2TDH>|<@U0K1YQ4AW>|<@U28LLA857>|<U04D8P9SK>)'], 'direct_message,direct_mention,mention', function(bot, message) {
  var userid = message.match[2];
  bot.reply(message, randomPraise(userid));
});


// Reply to hello/welcome messages.
controller.hears(['Default Welcome Intent'], 'direct_message,direct_mention,mention', apiai.hears, function(bot, message) {
  console.log(JSON.stringify(message));
  console.log('hello');
  // bot.reply(message, 'Hello!');
  bot.reply(message, message.fulfillment.speech);
});


controller.hears(['Happy new year'], 'direct_message,direct_mention,mention', apiai.hears, function(bot, message) {
  bot.reply(message, message.fulfillment.speech);
});


// Pass other messages to cleverbot.

const cleverbotIo = require('cleverbot.io');

const cleverbot = new cleverbotIo(
  config.cleverbot.apiUser, config.cleverbot.apiKey
);

cleverbot.setNick('Eugene Bot');
cleverbot.create(function (err, session) {
  if (err) {
    console.log('cleverbot create fail.');
  }
  else {
    console.log('cleverbot create success.');
  }
});

controller.hears('.*','direct_message,direct_mention,mention',function(bot,message) {  
  var msg = message.text;
  cleverbot.ask(msg, function (err, response) {
    if (!err) {
      bot.reply(message, response);
    }
    else {
      console.log('cleverbot err: ' + err);
    }
  });
});


//
// Functions
//

function formatUptime(uptime) {
  var unit = 'second';
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'minute';
  }
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'hour';
  }
  if (uptime != 1) {
    unit = unit + 's';
  }

  uptime = uptime + ' ' + unit;
  return uptime;
}
