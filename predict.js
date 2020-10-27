const config = require("./configs/environment.json");
const fs = require('fs');

var onAChannel = false
var voiceChannel = null

module.exports = {

    makeAPrediction(message, onAChannel) {

        const cantRequest = !canRequestAPrediction(message.member, message)

        if(cantRequest) {
            return
        }
    
        onAChannel = true
        voiceChannel = message.member.voice.channel
    
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


getAllEasterEggs = () => {
    var easterEggs = []

    fs.readdirSync(config.EASTER_EGG_DIR).forEach(file => {
        easterEggs.push(file)
    });

    return easterEggs
}

getVariations = () => {
    var variations = []

    fs.readdirSync(config.VARIATION_DIR).forEach(file => {
        variations.push(file)
    });

    return variations
}

leaveChannel = () => {
    onAChannel = false
    voiceChannel.leave()
    voiceChannel = null
}

playPrediction = connection => {

    if(Math.random() >= 0.95) {

        playVariation(connection)
    } 
    else {
        if(Math.random() >= 0.9) {       
            playNormalPredictionWithIntroduction(connection)
        } 
        else {
            playNormalPrediction(connection)
        }   
    }
}

playNormalPredictionWithIntroduction = connection => {
    var introduction = './sounds/introduction.ogg'

    var dispatcher = connection.play(introduction)

    dispatcher.on("finish", end => {
        playNormalPrediction(connection);
    });
}


playNormalPrediction = connection => {
    var prediction = Math.random() >= 0.5  
        ? './sounds/sim.mp3'
        : './sounds/nao.mp3'

    var dispatcher = connection.play(prediction)

    dispatcher.on("finish", end => {
        leaveChannel();
    });
}

playVariation = connection => {
    
    var variations =  getVariations()

    var randomVariation = variations[Math.floor(Math.random() * variations.length)]

    var dispatcher =  connection.play(`${config.VARIATION_DIR}${randomVariation}`)

    dispatcher.on("finish", end => {
        leaveChannel();
    });
}

playSoundEasterEgg = connection => {

    var easterEggs =  getAllEasterEggs()

    var randomEgg = easterEggs[Math.floor(Math.random() * easterEggs.length)]

    var dispatcher =  connection.play(`${config.EASTER_EGG_DIR}${randomEgg}`)

    dispatcher.setVolume(0.35)

    dispatcher.on("finish", end => {
        leaveChannel();
    });
}

playPredictOrSoundEasterEgg = connection => {
    
    var shouldPlayPrediction = Math.random() <= 0.95

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
    else if(triggersPigEasterEgg(message)) {

        playPigEasterEgg(connection)
    }
    else {   
        playPredictOrSoundEasterEgg(connection)
    }     
}

playCuckEasterEgg = connection => {
    var dispatcher = connection.play('./sounds/eggs/rares/voce.m4a')

    dispatcher.on("finish", end => {
        leaveChannel();
    });
}

playGasEasterEgg = connection => {
    var dispatcher = connection.play('./sounds/eggs/rares/gais.m4a')

    dispatcher.on("finish", end => {
        leaveChannel();
    });
}

playPigEasterEgg = connection => {
    var dispatcher = connection.play('./sounds/eggs/rares/porquinho.ogg')

    dispatcher.on("finish", end => {
        leaveChannel();
    });
}

triggersAEasterEgg = message => triggersSoundEasterEgg(message)
    || triggersCuckEasterEgg(message)
    || triggersGasEasterEgg(message)
    || triggersPigEasterEgg(message)

triggersSoundEasterEgg = message => !message.content.endsWith("?")

triggersCuckEasterEgg = message => message.content.toLowerCase().includes("quem é corno")
    || message.content.toLowerCase().includes("quem e corno")

triggersGasEasterEgg = message => message.content.toLowerCase().includes("cade o gas")
    || message.content.toLowerCase().includes("cade o gás")
    || message.content.toLowerCase().includes("cadê o gás")
    || message.content.toLowerCase().includes("cade o gás")

triggersPigEasterEgg = message => message.content.toLowerCase().includes("faz o porquinho")

canRequestAPrediction = (member, message) => {
    
    if (!member) {
        return false
    }

    if (!member.voice.channel) {
        message.reply("Me ajuda a te ajudar brother. Tu tem que estar em um canal de voz pra mágica rolar.")
        return false
    }
    
    if (onAChannel) {
        message.reply("Tô ocupado em outro canal, calmae!")
        return false
    }

    return true
}