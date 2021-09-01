require('dotenv').config()
const Discord = require('discord.js');
const bot = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] })
const axios = require('axios')

const TOKEN = process.env.TOKEN
const leagueId = process.env.LEAGUE_ID

bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`)
})

bot.on('message', async (msg) => {
  if (msg.content.startsWith('!score')) {
    const param = msg.content.substr(msg.content.indexOf(' ')+1)
    if (param !== '!score' && param.length > 0) {
      const scores = await getSpecificScore(param)
      msg.channel.send(scores)
    } else {
      const scores = await getAllScores()
      msg.channel.send(scores)
    }
  }

  if (msg.content.startsWith('!standings')) {
    const standings = await getStandings()
    msg.channel.send('```'+standings+'```')
  }

  if (msg.content.startsWith('!player')) {
    const param = msg.content.substr(msg.content.indexOf(' ')+1)
    if (param !== '!player' && param.length > 0) {
      const player = await getPlayer(param)

      if (player) {
        let fields = []
        if (player.proPlayer.news && player.proPlayer.news.length > 0) {
          player.proPlayer.news.forEach((article) => {
            fields.push({
              name: article.title,
              value: `${article.contents} ${(article.url) ? '[read more]('+article.url+')' : ''}`,
              inline: false,
            })
          })
        }

        if (player.viewingActualStats && player.viewingActualStats.length > 0) {
          let stats = ''
          player.viewingActualStats.forEach(stat => {
            stats = stats + `${(stat.value && stat.value.formatted) ? stat.value.formatted : 0 } ${stat.category.namePlural}\n`
          })
          fields.push({
            name: 'Stats',
            value: stats,
            inline: false,
          })
        }

        msg.channel.send({
          embeds: [{
            color: 3447003,
            title: player.proPlayer.nameFull,
            thumbnail: { url: player.proPlayer.headshotUrl },
            description: (player.owner && player.owner.name) ? player.owner.name : 'Unowned' + ' | ' + player.proPlayer.proTeamAbbreviation + ' - ' + player.proPlayer.position,
            fields: fields,
            timestamp: new Date(),
            footer: {
              icon_url: '',
              text: ""
            }
          }]
        });
      } else {
        msg.channel.send('Please include a valid player name.')
      }
    } else {
      msg.channel.send('Please include a valid player name.')
    }
  }
});

async function getAllScores () {
  const scores = await axios.get(`https://www.fleaflicker.com/api/FetchLeagueScoreboard?sport=NFL&league_id=${leagueId}&season=2021`)

  let response = ''
  scores.data.games.forEach(game => {
    let string = '```' + `${game.home.name} - ${game.homeScore.score.formatted}\nYTP: ${(game.homeScore.yetToPlay) ? game.homeScore.yetToPlay : 0 } | PROJ: ${(game.homeScore.projected) ? game.homeScore.projected.formatted : 0}\n\n${game.away.name} - ${game.awayScore.score.formatted}\nYTP: ${(game.awayScore.yetToPlay) ? game.awayScore.yetToPlay : 0 } | PROJ: ${(game.awayScore.projected) ? game.awayScore.projected.formatted : 0}` + '```'
    response = response + string
  })
  return response
}

async function getSpecificScore(teamName) {
  const scores = await axios.get(`https://www.fleaflicker.com/api/FetchLeagueScoreboard?sport=NFL&league_id=${leagueId}&season=2021`)
  
  let data = scores.data.games.filter(game => {
    if (game.home.name.toLowerCase() === teamName.toLowerCase() || game.away.name.toLowerCase() === teamName.toLowerCase()) {
      return game
    }
  })

  if (data.length > 0) {
    let response = ''
    data.forEach(game => {
      let string = '```' + `${game.home.name} - ${game.homeScore.score.formatted}\nYTP: ${(game.homeScore.yetToPlay) ? game.homeScore.yetToPlay : 0 } | PROJ: ${(game.homeScore.projected) ? game.homeScore.projected.formatted : 0}\n\n${game.away.name} - ${game.awayScore.score.formatted}\nYTP: ${(game.awayScore.yetToPlay) ? game.awayScore.yetToPlay : 0 } | PROJ: ${(game.awayScore.projected) ? game.awayScore.projected.formatted : 0}` + '```'
      response = response + string;
    })
    return response;
  } else {
    return 'Team name not found'
  }
}

async function getStandings() {
  const standings = await axios.get(`https://www.fleaflicker.com/api/FetchLeagueStandings?sport=NFL&league_id=${leagueId}&season=2021`)
  let response = ''
  
  standings.data.divisions[0].teams.forEach((team, i) => {
    response = response + `${i+1}. ${team.name} (${team.recordOverall.formatted})\n`
  })

  return response
}

// This just sends the first queried player back, iterate through them if you want to send back the entire array
async function getPlayer(name) {
  const response = await axios.get(`https://www.fleaflicker.com/api/FetchPlayerListing?sport=NFL&league_id=${leagueId}&sort_season=2021&filter.query=${name.replace(' ', '%20')}`)
  return response.data.players[0]
}