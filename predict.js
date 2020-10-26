const config = require("./configs/environment.json");
const fs = require('fs');

var onAChannel = false
var voiceChannel = null

getAllEasterEggs = () => {
    var easterEggs = []

    fs.readdirSync(config.EASTER_EGG_DIR).forEach(file => {
        easterEggs.push(file)
    });

    return easterEggs
}

leaveChannel = () => {
    onAChannel = false
    voiceChannel.leave()
    voiceChannel = null
}

playPrediction = connection => {

    var prediction = randomize() >= 0.5  
        ? './sounds/sim.mp3'
        : './sounds/nao.mp3'

    var dispatcher = connection.play(prediction)

    dispatcher.on("finish", end => {
        leaveChannel();
    });
}

playSoundEasterEgg = connection => {

    var easterEggs =  getAllEasterEggs()

    var randomEgg = easterEggs[Math.floor(Math.random() * easterEggs.length)]

    console.log(randomEgg)

    var dispatcher =  connection.play(`./sounds/eggs/${randomEgg}`)

    dispatcher.setVolume(0.35)

    dispatcher.on("finish", end => {
        leaveChannel();
    });
}

playPredictOrSoundEasterEgg = connection => {
    
    var shouldPlayPrediction = randomize() <= 0.95

    if(shouldPlayPrediction) {
        playPrediction(connection) 
    } 
    else {
        playSoundEasterEgg(connection)
    }
        
}

playAEasterEgg = (message, connection) => {

    if(triggersCuckEasterEgg(message)) {

        playCuckEasterEgg(connection)
    } 
    else if (triggersGasEasterEgg(message)) {
        
        playGasEasterEgg(connection)
    }
    else {   
        playPredictOrSoundEasterEgg(connection)
    }     
}

playCuckEasterEgg = connection => {
    var dispatcher = connection.play('./sounds/eggs/voce.m4a')

    dispatcher.on("finish", end => {
        leaveChannel();
    });
}

playGasEasterEgg = connection => {
    var dispatcher = connection.play('./sounds/eggs/gais.m4a')

    dispatcher.on("finish", end => {
        leaveChannel();
    });
}

triggersAEasterEgg = message => triggersSoundEasterEgg(message)
    || triggersCuckEasterEgg(message)
    || triggersGasEasterEgg(message)

triggersSoundEasterEgg = message => !message.content.endsWith("?")

triggersCuckEasterEgg = message => message.content.includes("quem é corno")

triggersGasEasterEgg = message => message.content.includes("cade o gas")

module.exports = {

    makeAPrediction(message, onAChannel) {

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
        
            if(triggersAEasterEgg(message)) {   
                playAEasterEgg(message, connection)
            } else {
                playPrediction(connection)
            }

        })
        .catch(console.error)
    }
}