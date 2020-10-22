const Discord = require("discord.js");
const request = require('request');
const config = require("./configs/environment.json");
const fs = require('fs');

const client = new Discord.Client();
const prefix = config.PREFIX
const token = config.TOKEN
const adviceEndpoint = config.ADVICE_URL

var onAChannel = false;
var voiceChannel = null;

const eggsList = ["banido.mp3", "cavalo.mp3","pog.mp3", "mega-gay-zone.mp3"]

client.on("message", async message => { 

    if (!messageIsACommand(message)) {
        return
    }

    const command = extractCommandFromMessage(message)

    switch (command) {
        case 'andreilord':
            predict(message)
            break
        case 'conselho':
            advice(message)
            break
        case 'eitaporra':
            leave()
            break
        default:
          message.reply("Não entendi, porra, manda de novo.")
    } 

});                                      

messageIsACommand = message => message.content.startsWith(prefix)

extractCommandFromMessage = message => message.content.slice(prefix.length)
    .split(' ')
    .shift()
    .toLowerCase()

randomize = () => Math.random()

leave = () => {
    onAChannel = false
    voiceChannel.leave()
    voiceChannel = null
}

predict = message => {

    member = message.member

    if (!member) {
      return
    }

    if (!member.voice.channel) {
      message.reply("Me ajuda a te ajudar brother. Tu tem que estar em um canal de voz pra mágica rolar.")
      return
    }
    
    if (onAChannel) {
      message.reply("Tô ocupado em outro canal, calmae!")
      return
    }
  
    onAChannel = true
    voiceChannel = member.voice.channel
  
    voiceChannel.join().then(connection => {
      
        if(triggersNormalEasterEgg(message)) {

            var randomNumber = randomize()

            if(randomNumber <= 0.9) {
                playNormalPredict(connection);    
            } else {
                var randomEgg =  eggsList[Math.floor(Math.random() * eggsList.length)]

                var dispatcher =  connection.play(`./sounds/eggs/${randomEgg}`)

                dispatcher.setVolume(0.35)

                dispatcher.on("finish", end => {
                    leave();
                });
            }

        } else {

            if(triggersUltraRareEasterEgg(message)) {
                var dispatcher =  connection.play('./sounds/eggs/gais.m4a')

                dispatcher.on("finish", end => {
                    leave();
                });

            } else if(triggersRareEasterEgg(message)) {
                var dispatcher = connection.play('./sounds/eggs/voce.m4a')

                dispatcher.on("finish", end => {
                    leave();
                });
            }  else {
                playNormalPredict(connection);
            } 
        }

    })
    .catch(console.error)
}

playNormalPredict = connection => {

    var dispatcher = randomize() >= 0.5
        ? connection.play('./sounds/sim.mp3')
        : connection.play('./sounds/nao.mp3');

    dispatcher.on("finish", end => {
        leave();
    });
}

triggersNormalEasterEgg = message => !message.content.endsWith("?")

triggersRareEasterEgg = message => message.content.includes("quem é corno")

triggersUltraRareEasterEgg = message => message.content.includes("cade o gas")

advice = message  => {

    request(adviceEndpoint, { json: true }, (err, res, body) => {
        
        if (err) { 
            message.channel.send('**Gente, deu ruim, chama o Orlando :C**')
            return console.log(err)
        }

        message.channel.send(body.slip.advice);
        return
    });
}

client.login(token)


