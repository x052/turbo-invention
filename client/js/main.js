require('./Events')

const UI = require('./UI')
const Game = require('./Game')
const MenuUI = new UI(Game)
MenuUI.boundSpawn = Game.Networking.spawn.bind(Game.Networking)
window['spawn'] = MenuUI.spawn.bind(MenuUI)

Game.start()

let lastServerListUpdate = 0
let serverList = {}

let lastConnectedServer = ''

window.onload = findAndJoinServer

function findAndJoinServer () {
  let secure = window.location.protocol === 'https:' ? 'wss://' : 'ws://'

  let wantServerListUpdate = Date.now() - lastServerListUpdate > 1 * 60 * 1000
  if (wantServerListUpdate) {
    updateServerList()
    return
  }

  const serverDomains = Object.keys(serverList)

  let bestServer = serverDomains[0] // first server
  let bestScore = 9999
  const targetPlayers = 15

  for (let index = 0; index < serverDomains.length; index++) {
    let serverInfo = serverList[serverDomains[index]]
    let players = serverInfo['players'] + (Math.random() * (10) + -5)

    if (bestScore > players) {
      bestScore = players
      bestServer = serverDomains[index]
    }
  }

  lastConnectedServer = bestServer
  Game.Networking.connect(secure + bestServer)
}

function updateServerList () {
  lastServerListUpdate = +Date.now()
  let xmlHttp = new window.XMLHttpRequest()

  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
      serverList = JSON.parse(xmlHttp.responseText)
      findAndJoinServer()
    }
  }

  xmlHttp.onerror = function () {
    setTimeout(() => updateServerList(), 500)
  }

  let seversApiServer = Math.random() > 0.5 ? lastConnectedServer : window.location.origin

  xmlHttp.open('GET', seversApiServer + '/servers', true)
  xmlHttp.send(null)
}

window.Events.leaderBoardUpdate = (data) => {
  MenuUI.leaderBoardUpdate(data)
}

window.Events.onDeath = () => {
  // TODO: Toggle ui
  MenuUI.showUi()
}

window.Events.onSpawn = () => {
  // TODO: Toggle ui
  MenuUI.hideUi()
}

window.Events.onConnect = (serverAddress) => {
  // TODO: Connected UI, eg unlock spawn button etc
  // Game.Networking.spawn('I WANA PLAY')
}

window.Events.onDisconnect = (serverAddress) => {
  // TODO: Show UI, reconnect
  Game.reset()
  setTimeout(findAndJoinServer, 500)
  MenuUI.showUi()
}

window.Events.onError = (serverAddress) => {
  // TODO: Error UI, reconnect, check if online, move server etc
  MenuUI.showUi()
}
