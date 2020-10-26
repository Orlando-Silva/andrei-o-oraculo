const Discord = require("discord.js");
const request = require('request');
const config = require("./configs/environment.json");
const predict = require('./predict.js');

const client = new Discord.Client();
const prefix = config.PREFIX
const token = config.TOKEN
const adviceEndpoint = config.ADVICE_URL

client.on("message", async message => { 

    if (!messageIsACommand(message)) {
        return
    }

    const command = extractCommandFromMessage(message)

    switch (command) {
        case 'teste':
            predict.makeAPrediction(message)
            break
        case 'conselho':
            requestAdvice(message)
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

requestAdvice = message  => {

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


