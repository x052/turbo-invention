class FakePlayerTracker extends global.PlayerTracker {
  constructor (gameServer, socket) {
    super(gameServer, socket)

    this.isBot = true
  }

  onDeath (killer) {}

  onKill (killed) {
    if (this.Ship) {
      let newHealth = this.Ship.health + (this.Ship.type.health / 10)
      this.Ship.health = Math.min(this.Ship.type.health, newHealth)
    }
  }

  updateAI () {}

  update () {
    this.updateCenter()
    this.updateViewBox()
    this.updateVisibleNodes()

    this.updateAI(this)

    if (this.Ship && this.Ship.shouldRemove) {
      if (this.Ship.quadItem) {
        this.gameServer.removeShip(this.Ship)
      }
      this.Ship = null
    }

    if (this.Ship) {
      var s = this.setTargetVelocity()
      this.updateShipAndRotation()

      if (this.keysDown['attack']) {
        this.handleShoot(s)
      }
    }
  }
}

class FakeSocket {
  constructor (gameServer) {
    this.isConnected = true
    this.remoteAddress = 'BOT'
    this.remotePort = 'BOT'
    this.lastAliveTime = Date.now()
  }

  on () {} // event emitters
  send () {
    console.error(`[send] called on FakeSocket`)
  }
  close () {}
}

module.exports = {
  FakeSocket,
  FakePlayerTracker
}
