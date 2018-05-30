const WebSocket = require('ws')
const Styles = require('../../shared/Styles')

module.exports =

class PlayerTracker {
  constructor (gameServer, socket) {
    this.gameServer = gameServer
    this.socket = socket

    this.shipType = 'Default'
    this.isBot = false

    this.pID = -1
    this.colour = '#ffffff'
    this.name = ''

    this.Ship = null

    this.mouse = {
      x: 0,
      y: 0
    }
    this.centerPos = {
      x: 0,
      y: 0
    }
    this.viewBox = {
      minx: 0,
      miny: 0,
      maxx: 500,
      maxy: 500,
      width: 500,
      height: 500,
      halfWidth: 0,
      halfHeight: 0
    }
    this.scale = 0

    this.connectedTime = 0

    this.hasInit = false

    if (this.gameServer) {
      this.connectedTime = this.gameServer.stepDateTime
      this.centerPos.x = this.gameServer.border.centerx
      this.centerPos.y = this.gameServer.border.centery
      this.pID = this.gameServer.getNewPlayerId()
    }

    this.lastShot = this.gameServer.stepDateTime
    this.fireSpeed = 0

    this.keysDown = {}
    this.targetVelocity = new Vector2(0, 0)

    this.viewNodes = []
    this.clientNodes = []

    this.lbScore = 0 // leaderboard
  }

  setName (name) {
    this.name = (name || 'Unknown').substring(0, 15) // sets default name to Unknown and tims it to 15 chars
  }

  joinGame (name) {
    if (this.Ship) return

    this.setName(name)
    let node = new Ship(this.gameServer.getNextNodeId(), this.pID, this.shipType)
    node.randomColour()
    node.setPos(this.gameServer.randomInt(this.gameServer.border.minx,
      this.gameServer.border.maxx),
    this.gameServer.randomInt(this.gameServer.border.miny,
      this.gameServer.border.maxy))
    this.gameServer.addShip(node)
    this.Ship = node
  }

  checkConnection () {
    if (this.socket.readyState !== WebSocket.OPEN) {
      // Mark to remove
      this.isRemoved = true
    }
  }

  randomColour () {
    this.colour = Styles.Ships[(Math.random() * Styles.Ships.length) | 0]
  }

  onDeath (killer) {
    this.lbScore = Math.round(this.lbScore / 4)
    this.gameServer.Networking.sendDeath(this.socket, killer)
  }

  onKill (killed) {
    if (this.Ship) {
      let newHealth = this.Ship.health + (this.Ship.type.health / 10)
      this.Ship.health = Math.min(this.Ship.type.health, newHealth)
    }
  }

  update () {
    if (this.Ship && this.Ship.shouldRemove) {
      if (this.Ship.quadItem) {
        this.gameServer.removeShip(this.Ship)
      }
      this.Ship = null
    } else

    if (this.Ship) {
      var s = this.setTargetVelocity()
      this.updateShipAndRotation()

      if (this.keysDown['attack']) {
        this.handleShoot(s)
      }
    }

    this.updateCenter()
    this.updateViewBox()

    this.updateVisibleNodes()
  }

  handleShoot (s) {
    if (this.gameServer.stepDateTime - this.lastShot >= this.fireSpeed) {
      let node = new Ship(this.gameServer.getNextNodeId(), -1, this.Ship.type.bulletType)

      if (Math.random() > 0.7) {
        node.colour = Styles.shadeColor(this.Ship.colour, Math.random())
      } else {
        node.randomColour()
      }
      node.setPos(this.Ship.Vector2.x - this.Ship.Velocity.x, this.Ship.Vector2.y - this.Ship.Velocity.y)

      node.rotation.rotation = this.Ship.rotation.rotation
      node.startTime = this.lastShot
      node.isBullet = true
      node.bulletOwner = this

      let b = node.type.maxSpeed / this.Ship.type.maxSpeed

      if (Math.abs(this.Ship.Velocity.x) + Math.abs(this.Ship.Velocity.y) < 1 ||
        s < 10) {
        node.Velocity.x = node.type.maxSpeed * Math.cos(this.Ship.rotation.rotation * Math.PI / 180.0)
        node.Velocity.y = node.type.maxSpeed * Math.sin(this.Ship.rotation.rotation * Math.PI / 180.0)
      } else {
        node.Velocity.x = (this.Ship.Velocity.x * b + this.targetVelocity.x * b) / 2
        node.Velocity.y = (this.Ship.Velocity.y * b + this.targetVelocity.y * b) / 2
      }

      node.Velocity.x += Math.random() * (node.type.spread - -node.type.spread) + -node.type.spread
      node.Velocity.y += Math.random() * (node.type.spread - -node.type.spread) + -node.type.spread

      this.gameServer.addShip(node)

      this.lastShot = this.gameServer.stepDateTime
      this.fireSpeed = node.type.fireSpeed
    }
  }

  updateShipAndRotation () {
    this.Ship.Velocity.x += this.targetVelocity.x
    this.Ship.Velocity.x /= 2

    this.Ship.Velocity.y += this.targetVelocity.y
    this.Ship.Velocity.y /= 2

    this.Ship.Vector2.add(this.Ship.Velocity)

    this.Ship.rotation.rotation = Math.atan2(this.Ship.Velocity.y, this.Ship.Velocity.x)
    this.Ship.rotation.rotation = this.Ship.rotation.rotation * 180 / Math.PI

    let x = this.Ship.Vector2.x
    let y = this.Ship.Vector2.y

    x = Math.max(x, this.gameServer.border.minx)
    y = Math.max(y, this.gameServer.border.miny)

    x = Math.min(x, this.gameServer.border.maxx)
    y = Math.min(y, this.gameServer.border.maxy)

    this.Ship.Vector2.x = x
    this.Ship.Vector2.y = y

    this.gameServer.updateNodeQuad(this.Ship)
  }

  setTargetVelocity () {
    let s = 0

    if (this.keysDown['w']) {
      this.targetVelocity.y = -this.Ship.type.maxSpeed
    }
    if (this.keysDown['s']) {
      this.targetVelocity.y = this.Ship.type.maxSpeed
    }

    if (this.keysDown['a']) {
      this.targetVelocity.x = -this.Ship.type.maxSpeed
    }
    if (this.keysDown['d']) {
      this.targetVelocity.x = this.Ship.type.maxSpeed
    }

    if (!this.keysDown['w'] && !this.keysDown['s']) {
      this.targetVelocity.y = 0
    }
    if (!this.keysDown['a'] && !this.keysDown['d']) {
      this.targetVelocity.x = 0
    }

    if (this.keysDown['w'] && this.keysDown['s']) {
      this.targetVelocity.y = 0
    }
    if (this.keysDown['a'] && this.keysDown['d']) {
      this.targetVelocity.x = 0
    }

    if (Math.abs(this.targetVelocity.x) + Math.abs(this.targetVelocity.y) === 0) { // no keyboard controls are being used
      let angle = Math.atan2(this.mouse.y, this.mouse.x)

      let realMouseX = this.centerPos.x + (10 * this.mouse.x)
      let realMouseY = this.centerPos.y + (10 * this.mouse.y)

      let mouseOffset = Math.abs(realMouseX - this.centerPos.x) +
         Math.abs(realMouseY - this.centerPos.y)
      s = mouseOffset / this.Ship.type.maxSpeed
      s = Math.min(2 * s, this.Ship.type.maxSpeed)
      if (s < 10) {
        s = s / 2
      }

      this.targetVelocity.x = s * Math.cos(angle)
      this.targetVelocity.y = s * Math.sin(angle)
    }

    return s
  }

  updateCenter () {
    if (this.Ship) {
      this.setCenterPos(this.Ship.Vector2.x, this.Ship.Vector2.y)
    }
  }

  setCenterPos (x, y) {
    if (isNaN(x) || isNaN(y)) {
      throw new TypeError('PlayerTracker.setCenterPos: NaN')
    }

    this.centerPos.x = x
    this.centerPos.y = y
  }

  getScale () {
    if (this.Ship) return Math.pow(Math.min(64 / this.Ship.size, 1), 0.4)
    return 0.4
  }

  updateVisibleNodes () {
    if (this.isBot) return

    this.viewNodes = []
    var self = this

    this.gameServer.quadTree.find(this.viewBox, function (quadItem) {
      if (quadItem.node && typeof quadItem.node !== 'undefined') {
        self.viewNodes.push(quadItem.node)
      }
    })
  }

  updateViewBox () {
    var scale = this.getScale()
    scale = Math.max(scale, 0.15)
    this._scaleF += 0.1 * (scale - this._scaleF)
    if (isNaN(this._scaleF)) {
      this._scaleF = 1
    }
    var width = (1920 + 100) / this._scaleF
    var height = (1080 + 100) / this._scaleF
    var halfWidth = width / 2
    var halfHeight = height / 2
    this.viewBox = {
      minx: this.centerPos.x - halfWidth,
      miny: this.centerPos.y - halfHeight,
      maxx: this.centerPos.x + halfWidth,
      maxy: this.centerPos.y + halfHeight,
      width: width,
      height: height,
      halfWidth: halfWidth,
      halfHeight: halfHeight
    }
  }
}
