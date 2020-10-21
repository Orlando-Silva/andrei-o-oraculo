const Discord = require("discord.js");
const WitSpeech = require('node-witai-speech');
const decode = require('./decodeOpus.js');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

var config = JSON.parse(fs.readFileSync("./settings.json", "utf-8"));

const bot_controller = config.bot_controller;
const prefix = config.prefix;
const discord_token = config.discord_token;
const content_type = config.content_type;

const client = new Discord.Client();
const recordingsPath = makeDir('./recordings');
var queue = [];
var isPlaying = false;
var dispatcher = null;
var voiceChannel = null;
var textChannel = null;
var listenConnection = null;
var listenReceiver = null;
var listenStreams = new Map();
var skipReq = 0;
var skippers = [];
var listening = false;


client.login(discord_token);

client.on('ready', handleReady.bind(this));

client.on('message', handleMessage.bind(this));

client.on('guildMemberSpeaking', function() {
  console.log('teste')
  handleSpeaking.bind(this)
} );

function handleReady() {
  console.log("I'm ready!");
}

function handleMessage(message) {
  if (!message.content.startsWith(prefix)) {
    return;
  }
  var command = message.content.toLowerCase().slice(1).split(' ');
  command = command[0];
  
  switch (command) {
    case 'leave':
      commandLeave();
      break;
    case 'listen':
      textChannel = message.channel;
      commandListen(message);
      break;
    case 'clear':
      commandReset();
      break;
    default:
      message.reply("Não entendi! Manda de novo.");
  }
}

function handleSpeech(member, speech) {
  var command = speech.toLowerCase().split(' ');
  if ((command[0] == 'play' && command[1] == 'list') || command[0] == 'playlist') {
    command = 'playlist';
  }
  else {
    command = command[0];
  }
  console.log("recebi: isso" + command)

  switch (command) {
    case 'listen':
      break;
    case 'play':
      console.log("Yep, It's Working my dude!");
      break;
    default:
      console.log("O porra!");
      break;
  }
}

function handleSpeaking(member, speaking) {
  // Close the writeStream when a member stops speaking
  if (!speaking && member.voiceChannel) {
    
    let stream = listenStreams.get(member.id);

    if (stream) {
      listenStreams.delete(member.id);

      stream.end(err => {
        if (err) {
          console.error(err);
        }

        let basename = path.basename(stream.path, '.opus_string');
        let text = "default";
        
        // decode file into pcm
        decode.convertOpusStringToRawPCM(stream.path,
          basename,
          (function() {
            processRawToWav(
              path.join('./recordings', basename + '.raw_pcm'),
              path.join('./recordings', basename + '.wav'),
              (function(data) {
                console.logI(`data has ${data}`)
                if (data != null) {
                  handleSpeech(member, data._text);
                }
              }).bind(this))
          }).bind(this));
      });
    }
  }
}

function commandListen(message) {
  member = message.member;
  if (!member) {
    return;
  }
  if (!member.voice.channel) {
    message.reply(" you need to be in a voice channel first.")
    return;
  }
  if (listening) {
    message.reply(" a voice channel is already being listened to!");
    return;
  }

  listening = true;
  voiceChannel = member.voice.channel;
  textChannel.send('Listening in to **' + voiceChannel.name + '**!');

  var recordingsPath = path.join('.', 'recordings');
  makeDir(recordingsPath);

  voiceChannel.join().then((connection) => {
    
    let receiver = connection.receiver;

    connection.on('speaking', (user, speaking) => {
        console.log('speaking:');

        if (speaking) {

            const audioStream = receiver.createStream(user, {mode: 'pcm'});
            audioStream.on('data', (chunk) => {
                audioStream.pipe(fs.createWriteStream('user_audio2'));
            });
        }
    });

    connection.on('failed', (error) => {
      console.log('failed:' + error);
    });

    connection.on('debug', (error) => {
      console.log('debug:' + error);
    });

    listenConnection = connection;
 
    //listenReceiver.set(member.voiceChannelId, receiver);
    listenReceiver = receiver;
    

  }).catch(console.error);
}

function commandStop() {
  if (listenReceiver) {
    listening = false;
    listenReceiver.destroy();
    listenReceiver = null;
    textChannel.send("Stopped listening!");
  }
}

function commandLeave() {
  listening = false;
  queue = []
  if (dispatcher) {
    dispatcher.end();
  }
  dispatcher = null;
  commandStop();
  if (listenReceiver) {
    listenReceiver.destroy();
    listenReceiver = null;
  }
  if (listenConnection) {
    listenConnection.disconnect();
    listenConnection = null;
  }
  if (voiceChannel) {
    voiceChannel.leave();
    voiceChannel = null;
  }
}

function processRawToWav(filepath, outputpath, cb) {
  fs.closeSync(fs.openSync(outputpath, 'w'));
  var command = ffmpeg(filepath)
    .addInputOptions([
      '-f s32le',
      '-ar 48k',
      '-ac 1'
    ])
    .on('end', function() {
      // Stream the file to be sent to the wit.ai
      var stream = fs.createReadStream(outputpath);

      // Its best to return a promise
      var parseSpeech =  new Promise((ressolve, reject) => {
      // call the wit.ai api with the created stream
      WitSpeech.extractSpeechIntent(WIT_API_KEY, stream, content_type,
      (err, res) => {
          if (err) return reject(err);
          ressolve(res);
        });
      });

      // check in the promise for the completion of call to witai
      parseSpeech.then((data) => {
        console.log("you said: " + data._text);
        cb(data);
        //return data;
      })
      .catch((err) => {
        console.log(err);
        cb(null);
        //return null;
      })
    })
    .on('error', function(err) {
        console.log('an error happened: ' + err.message);
    })
    .addOutput(outputpath)
    .run();
}

function makeDir(dir) {
  try {
    fs.mkdirSync(dir);
  } catch (err) {}
}

function reduceTrailingWhitespace(string) {
  for (var i = string.length - 1; i >= 0; i--) {
    if (string.charAt(i) == ' ') string = string.slice(0, i);
    else return string;
  }
  return string;
}

function getRandomItem(arr) {
  var index = Math.round(Math.random() * (arr.length - 1));
  return arr[index];
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}