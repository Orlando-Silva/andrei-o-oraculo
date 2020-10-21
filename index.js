const Discord = require("discord.js");
const config = require("./configs/environment.json");

const client = new Discord.Client();
const prefix = config.PREFIX
const token = config.TOKEN

var onAChannel = false;
var voiceChannel = null;



client.on("message", async message => { 

    if (!messageIsACommand(message)) {
        return
    }

    const command = extractCommandFromMessage(message)

    switch (command) {
        case 'andreilord':
            predict(message)
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

randomize = () => Math.random() >= 0.5

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
    //message.channel.send('Abram alas pro **ANDREI LORD**!')
  
    voiceChannel.join().then(connection => {
      
        var dispatcher = randomize() 
            ? connection.play('./sounds/sim.mp3')
            : connection.play('./sounds/nao.mp3')
        
        console.log('audio ended')
        dispatcher.on("finish", end => {
            console.log("Audio ended")
            leave()
        });

    })
    .catch(console.error)
}

client.login(token)



