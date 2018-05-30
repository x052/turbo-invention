const http = require('http')
const WebSocket = require('ws')
const QuadNode = require('quad-node')

const https = require('https') // ssl
const path = require('path')
const fs = require('fs')

const Networking = require('./src/Networking')
const updateNodes = require('./src/updateNodes')

global.logger = require('./src/Logger')()
global.Vector2 = require('../shared/Vector2')
global.Styles = require('../shared/Styles')
global.Types = new (require('../shared/Types'))(global.Styles)
global.Rotation = require('../shared/Rotation')

global.RockGen = require('../shared/RockGen')
global.ShipGen = require('../shared/ShipGen')

global.Rock = require('./src/Rock')
global.Ship = require('./src/Ship')

global.PlayerTracker = require('./src/PlayerTracker')

const getNewSeeker = require('./ai/Seeker')
const getNewMinion = require('./ai/Minion')
const idStore = require('./src/idStore')

class GameServer {
  constructor () {
    this.startTime = Date.now()
    this.stepDateTime = this.startTime
    this.timeStamp = 0
    this.timeStep = 40
    this.tick = 0

    this.tickcounter = 0
    this.tickRate = 25
    this.lastTickRateMesure = +Date.now()

    this.mainLoopBind = null
    this.timerLoopBind = null

    this.run = false

    this.lastPlayerId = 1
    this.lastNodeId = 1

    this.activeBonusItems = 0

    this.botClients = []
    this.clients = []
    this.Rocks = []
    this.Ships = []

    this.httpServer = null
    this.wsServer = null

    this.leaderboard = []

    this.socketCount = 0
    this.isDraining = false

    this.Networking = new Networking(this)

    this.config = {
      serverPort: 8081,
      sslServerPort: 8082,
      wsOptions: {
        server: null,
        perMessageDeflate: false,
        maxPayload: 4096
      },
      serverMaxConnections: 40,
      borderWidth: 5000,
      borderHeight: 5000,
      playerInc: 100,
      serverTimeout: 30000,
      playerDisconnectTime: 5000,
      maxRocks: 0,
      botsPerPlayer: 0,
      maxMinionsPerPlayer: 1,
      healthItemsEnabled: true,
      useSsl: true
    }

    this.setBorder(this.config.borderWidth, this.config.borderHeight, 0)

    let width = (this.config.borderWidth + (this.config.serverMaxConnections * this.config.playerInc))
    let height = this.config.borderHeight + (this.config.serverMaxConnections * this.config.playerInc)
    let hw = width / 2
    let hh = height / 2
    this.quadTree = new QuadNode(
      {
        minx: -hw,
        miny: -hh,
        maxx: hw,
        maxy: hh,
        width: width,
        height: height,
        centerx: 0,
        centery: 0
      }, 64, 32)
  }

  startServerDrain () {
    this.isDraining = true
  }

  stop () {
    this.run = false
  }

  start (app) {
    if (this.config.useSsl) {
      logger.log('TLS supported')

      var dirSsl = path.join(path.dirname(module.filename), '../ssl')
      var pathKey = path.join(dirSsl, 'privkey.pem')
      var pathCert = path.join(dirSsl, 'cert.pem')
      var pathChain = path.join(dirSsl, 'chain.pem')

      var options = {
        key: fs.readFileSync(pathKey, 'utf8'),
        cert: fs.readFileSync(pathCert, 'utf8'),
        ca: fs.readFileSync(pathChain, 'utf8')
      }

      this.httpServer = https.createServer(options, app)
      this.httpServer.listen(this.config.sslServerPort, '0.0.0.0', this.onHttpServerOpen.bind(this))
    } else {
      logger.log('TLS not supported')
      this.httpServer = http.createServer(app)
      this.httpServer.listen(this.config.serverPort, '0.0.0.0', this.onHttpServerOpen.bind(this))
    }

    this.config.wsOptions.server = this.httpServer

    this.wsServer = new WebSocket.Server(this.config.wsOptions)
    this.wsServer.on('connection', this.onClientSocketOpen.bind(this))

    this.timerLoopBind = this.timerLoop.bind(this)
    this.mainLoopBind = this.mainLoop.bind(this)

    this.run = true
  }

  timerLoop () {
    let start = +Date.now()

    this.mainLoopBind()

    let end = +Date.now()
    let elapsed = end - start

    this.tickcounter++
    if (start - this.lastTickRateMesure >= 1000) {
      this.lastTickRateMesure = start
      this.tickRate = this.tickcounter
      this.tickcounter = 0
    }

    setTimeout(this.timerLoopBind, this.timeStep - elapsed)
  }

  mainLoop () {
    this.stepDateTime = Date.now()
    this.tick++
    if (this.tick >= 1000) this.tick = 1

    if (this.tick % 25 === 0) {
      this.setBorder(this.config.borderWidth, this.config.borderHeight, this.clients.length)
    }

    if (this.tick % 100 === 0) {
      this.updateLeaderboard()
    }

    this.spawnItems()
    this.updateRocks()
    this.updateBullets()

    this.updateShips()

    this.updateClients()
  }

  onHttpServerOpen () {
    setTimeout(this.timerLoopBind, 1)
    logger.info(`Listening on port ${this.config.useSsl ? this.config.sslServerPort : this.config.serverPort}`)
  }

  onServerSocketError (error) {
    logger.error(`WebSocket: ${error.code} - ${error.message}`)
    switch (error.code) {
      case 'EADDRINUSE':
        logger.error(`Server could not bind to port ${this.config.serverPort}!`)
        break
      case `EACCES`:
        logger.error(`Please make sure you are running the server with root privileges.`)
        break
    }
    process.exit(1)
  }

  getStats () {
    return {
      players: this.socketCount,
      nodes: this.Ships.length + this.Rocks.length,
      border: this.border,
      uptime: +Date.now() - this.startTime,
      startTime: this.startTime,
      tickRate: this.tickRate
    }
  }

  onClientSocketOpen (ws) {
    ws.on('error', function () {
      ws.close()
    })

    if (this.config.serverMaxConnections > 0 && this.socketCount >= this.config.serverMaxConnections) {
      console.log('Server full, bye bye client')
      return ws.close(1000, 'Server full')
    }
    ws.isConnected = true
    ws.remoteAddress = ws._socket.remoteAddress
    ws.remotePort = ws._socket.remotePort
    ws.lastAliveTime = Date.now()

    ws.PlayerTracker = new PlayerTracker(this, ws)

    ws._send = ws.send
    ws.send = function (data) {
      ws._send(data, (error) => {
        if (error) {
          console.log(error)
        }
      })
    }

    function onMessage (message) {
      this.onClientSocketMessage(ws, message)
    }

    function onClose (message) {
      this.onClientSocketClose(ws, message)
    }

    ws.on('message', onMessage.bind(this))
    ws.on('close', onClose.bind(this))

    this.socketCount++
    this.clients.push(ws)

    for (let index = 0; index < this.config.botsPerPlayer; index++) {
      this.botClients.push(getNewSeeker(this, ws))
    }

    for (let index = 0; index < this.config.maxMinionsPerPlayer; index++) {
      this.botClients.push(getNewMinion(this, ws))
    }
  }

  onClientSocketMessage (ws, message) {
    if (message.length === 0 || message.length > 256) {
      logger.log('killing socket, bad packet')
      return ws.close(1000)
    }
    try {
      this.Networking.onClientSocketMessage(ws, message)
    } catch (e) {
      console.error(e)
    }
  }

  onClientSocketClose (ws, code) {
    for (let i = 0; i < this.botClients.length; i++) {
      let botClient = this.botClients[i]

      if (botClient.PlayerTracker.botOwner.PlayerTracker.pID === ws.PlayerTracker.pID) {
        if (botClient.PlayerTracker && botClient.PlayerTracker.Ship) {
          this.removeShip(botClient.PlayerTracker.Ship)
          botClient.PlayerTracker.Ship = null
        }

        this.botClients.splice(i, 1)
        i--
      }
    }

    if (ws.PlayerTracker && ws.PlayerTracker.Ship) {
      this.removeShip(ws.PlayerTracker.Ship)
    }
    if (!this.socketCount < 1) this.socketCount--
  }

  onClientSocketError (ws, error) {
    console.log('err')
    console.log('err', ws, error)
  }

  setBorder (width, height, connectedPlayers) {
    let wSize = connectedPlayers * this.config.playerInc
    wSize += this.botClients.length * 4

    width += (wSize / 2)
    height += (wSize / 2)

    let hw = width / 2
    let hh = height / 2
    this.border = {
      minx: -hw,
      miny: -hh,
      maxx: hw,
      maxy: hh,
      width: width,
      height: height,
      centerx: 0,
      centery: 0
    }

    this.config.maxRocks = Math.floor((width + height) / 250)
  }

  getNextNodeId () {
    return idStore.getNextNodeId()
  }

  getNewPlayerId () {
    return idStore.getNewPlayerId()
  }

  randomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  spawnItems () {
    let wantedBonusItems = (this.border.width * this.border.height) / (1000 * 1000)
    let bonusItems = ['SpeedItem', 'HealthItem', 'DistractionItem', 'MinionItem']

    while (this.activeBonusItems < wantedBonusItems) {
      let bonusItem = bonusItems[Math.floor(Math.random() * bonusItems.length)]
      let node = new Ship(this.getNextNodeId(), -1, bonusItem)

      node.randomColour()
      node.setPos(this.randomInt(this.border.minx, this.border.maxx),
        this.randomInt(this.border.miny, this.border.maxy))

      node.rotation.rotationSpeed = 3
      this.addShip(node)
    }

    while (this.Rocks.length < this.config.maxRocks) {
      let node = new Rock(this, Types.rocks.Stone)
      node.setPos(this.randomInt(this.border.minx, this.border.maxx),
        this.randomInt(this.border.miny, this.border.maxy))
      node.rotation.rotationSpeed = this.randomInt(-3, 3)
      this.addRock(node)
    }
  }

  addRock (node) {
    var x = node.Vector2.x
    var y = node.Vector2.y
    var size = node.size
    node.quadItem = {
      node: node,
      x: x,
      y: y,
      size: size,
      bound: { minx: x - size, miny: y - size, maxx: x + size, maxy: y + size }
    }
    this.quadTree.insert(node.quadItem)

    this.Rocks.push(node)
  }

  addShip (node) {
    node.type.onAdd(node, this)

    var x = node.Vector2.x
    var y = node.Vector2.y
    var size = node.size

    node.quadItem = {
      node: node,
      x: x,
      y: y,
      size: size,
      bound: { minx: x - size, miny: y - size, maxx: x + size, maxy: y + size }
    }
    this.quadTree.insert(node.quadItem)

    this.Ships.push(node)
  }

  removeRock (node) {
    if (node.quadItem == null) {
      throw new TypeError('GameServer.removeRock: attempt to remove invalid node!')
    }

    idStore.removeNodeId(node.quadItem.nodeId)

    node.isRemoved = true
    this.quadTree.remove(node.quadItem)
    node.quadItem = null

    // Remove from main nodes list
    var index = this.Rocks.indexOf(node)
    if (index !== -1) {
      this.Rocks.splice(index, 1)
    }
  }

  removeShip (node) {
    // Remove from main nodes list
    var index = this.Ships.indexOf(node)
    if (index !== -1) {
      this.Ships.splice(index, 1)
    }

    var item = node.quadItem
    if (item == null) {
      console.error(`GameServer.removeShip: quadItem is null!`)
    }

    idStore.removeNodeId(node.nodeId)

    node.isRemoved = true
    this.quadTree.remove(item)
    node.quadItem = null

    node = null
  }

  updateNodeQuad (node) {
    var item = node.quadItem
    if (item == null) {
      throw new TypeError(`GameServer.updateNodeQuad: quadItem is null!`)
    }

    var x = node.Vector2.x
    var y = node.Vector2.y
    var size = node.size
    // check for change
    if (item.x === x && item.y === y && item.size === size) {
      return
    }
    // update quad tree
    item.x = x
    item.y = y
    item.size = size
    item.bound.minx = x - size
    item.bound.miny = y - size
    item.bound.maxx = x + size
    item.bound.maxy = y + size
    this.quadTree.update(item)
  }

  updateShips () {
    // updates ships special properties

    for (var index = 0; index < this.Ships.length; index++) {
      var Ship = this.Ships[index]
      if (Ship.isBullet) continue
      if (Ship.shouldRemove) continue
      if (!Ship.type.canCollide) continue

      if (Ship.type.isItem) {
        let x = Ship.Vector2.x
        let y = Ship.Vector2.y
        x = Math.max(x, this.border.minx)
        y = Math.max(y, this.border.miny)
        x = Math.min(x, this.border.maxx)
        y = Math.min(y, this.border.maxy)

        if (x !== Ship.Vector2.x || y !== Ship.Vector2.y) {
          this.activeBonusItems--
          this.removeShip(Ship)
          continue
        }
      }

      if (Ship.rotation.rotationSpeed > 0) {
        Ship.rotation.rotate()
      }

      const collisions = this.getCollisions(Ship)
      for (let index = 0; index < collisions.length; index++) {
        const collisionTarget = collisions[index]

        if (collisionTarget.isBullet) continue
        if (collisionTarget.shouldRemove) continue

        if (!Ship.type.shouldHit(Ship, collisionTarget)) continue

        Ship.type.onHit(Ship, collisionTarget, this)

        this.removeShip(Ship)
        break
      }
    }
  }

  updateLeaderboard () {
    // Update leaderboard with the gamemode's method
    this.leaderboard = []

    // Get client with largest score if gamemode doesn't have a leaderboard
    var clients = []
    for (let index = 0; index < this.clients.length; index++) {
      const client = this.clients[index]

      clients.push({
        name: client.PlayerTracker.name,
        score: client.PlayerTracker.lbScore
      })
    }

    // Use sort function
    clients.sort(function (a, b) {
      return b.score - a.score
    })

    this.leaderboard = clients.slice(0, 10)
  }

  updateClients () {
    if (this.isDraining) {
      for (let i = 0; i < this.clients.length; i++) {
        const client = this.clients[i]

        if (!client.PlayerTracker.Ship) {
          logger.log(`Closing socket ${client.PlayerTracker.pID}, not ingame`)

          client.PlayerTracker.socket.close()
          var index = this.clients.indexOf(client)
          if (index > -1) this.clients.splice(index, 1)
        } else if (Math.random() > 0.85) {
          this.botClients.push(getNewSeeker(this, client))
        }
      }
    }

    for (let i = 0; i < this.botClients.length; i++) {
      let botClient = this.botClients[i]

      botClient.PlayerTracker.update()
    }

    for (let i = 0; i < this.clients.length; i++) {
      const client = this.clients[i]
      client.PlayerTracker.checkConnection()
      if (client.PlayerTracker.isRemoved) {
        if (client.PlayerTracker.Ship && !client.PlayerTracker.Ship.quadItem) {
          client.PlayerTracker.Ship = null
        }
        client.PlayerTracker.update()
        client.PlayerTracker.socket.close()
        var index = this.clients.indexOf(client)
        if (index > -1) this.clients.splice(index, 1)
      } else {
        if (client.PlayerTracker.Ship && this.tick % 25 === 0) { // health regen
          let newHealth = client.PlayerTracker.Ship.health + (client.PlayerTracker.Ship.type.health / 60)
          client.PlayerTracker.Ship.health = Math.min(client.PlayerTracker.Ship.type.health, newHealth)
        }

        client.PlayerTracker.update()
      }
    }

    for (let i = 0; i < this.clients.length; i++) {
      const client = this.clients[i]

      this.Networking.sendBorder(client.PlayerTracker.socket)
      this.Networking.sendLeaderboard(client.PlayerTracker.socket)

      if (!client.PlayerTracker.socket.hasInit) {
        continue
      }
      if (!client.PlayerTracker.socket ||
         client.PlayerTracker.socket.readyState !== WebSocket.OPEN ||
          !client.PlayerTracker.socket.hasInit) {
        continue
      }

      let buffer = updateNodes(client.PlayerTracker.socket,
        client.PlayerTracker.viewNodes, this.tick)
      client.PlayerTracker.socket.send(buffer)
    }

    for (let i = 0; i < this.Ships.length; i++) {
      var Ship = this.Ships[i]

      if (Ship.shouldRemove) {
        this.removeShip(Ship)
        Ship = null
      }
    }
  }

  updateRocks () {
    for (var index = 0; index < this.Rocks.length; index++) {
      var rock = this.Rocks[index]
      rock.rotation.rotate()
      rock.rotation.speedDecay()

      let x = rock.Vector2.x
      let y = rock.Vector2.y
      x = Math.max(x, this.border.minx)
      y = Math.max(y, this.border.miny)
      x = Math.min(x, this.border.maxx)
      y = Math.min(y, this.border.maxy)

      if (x !== rock.Vector2.x || y !== rock.Vector2.y) {
        this.removeRock(rock)
        continue
      }

      if (rock.rotation.rotationSpeed === 0) {
        this.removeRock(rock)
      }
    }

    if (this.Rocks.length > this.config.maxRocks) {
      this.removeRock(this.Rocks[0])
    }
  }

  updateBullets () {
    for (var index = 0; index < this.Ships.length; index++) {
      var bullet = this.Ships[index]
      if (bullet.isBullet) {
        /* Ok then... */

        bullet.Vector2.add(bullet.Velocity)
        let x = bullet.Vector2.x
        let y = bullet.Vector2.y

        x = Math.max(x, this.border.minx)
        y = Math.max(y, this.border.miny)

        x = Math.min(x, this.border.maxx)
        y = Math.min(y, this.border.maxy)

        bullet.Vector2.x = x
        bullet.Vector2.y = y

        this.updateNodeQuad(bullet)

        if (bullet.type.shouldRemove(this.stepDateTime, bullet)) {
          this.removeShip(bullet)
        } else {
          this.checkBulletCollision(bullet)
        }
      }
    }
  }

  getCollisions (node) {
    let width = node.type.size * 2
    let height = node.type.size * 2
    let halfWidth = width / 2
    let halfHeight = height / 2

    let startX = node.Vector2.x - node.Velocity.x
    let startY = node.Vector2.y - node.Velocity.y

    let endX = node.Vector2.x
    let endY = node.Vector2.y

    let viewBox = {
      minx: startX - halfWidth,
      miny: startY - halfHeight,
      maxx: endX + halfWidth,
      maxy: endY + halfHeight,
      width: width,
      height: height,
      halfWidth: halfWidth,
      halfHeight: halfHeight
    }

    let collisions = []

    this.quadTree.find(viewBox, function (quadItem) {
      if (quadItem.node && typeof quadItem.node !== 'undefined') {
        collisions.push(quadItem.node)
      }
    })

    return collisions
  }

  checkBulletCollision (bullet) {
    const collisions = this.getCollisions(bullet)

    for (let index = 0; index < collisions.length; index++) {
      const collisionTarget = collisions[index]

      if (!bullet.type.shouldHit(bullet, collisionTarget)) continue

      bullet.type.onHit(bullet, collisionTarget, this)

      if (collisionTarget.health <= 0) {
        collisionTarget.shouldRemove = true

        // killer and onDeath stuff
        let killer = null
        let killed = null

        for (let index = 0; index < this.clients.length; index++) {
          const client = this.clients[index]

          if (client.PlayerTracker.pID === collisionTarget.pID) {
            killed = client
            break
          }
        }

        killer = bullet.bulletOwner

        if (killer) {
          killer.onKill(killed ? killed.PlayerTracker.name || 'Unknown' : 'Unknown')
        }

        if (killed) {
          killed.PlayerTracker.onDeath(killer ? killer.name || 'Unknown' : 'Unknown')
        }
      }

      this.removeShip(bullet)
      break
    }
  }
}

module.exports = GameServer
