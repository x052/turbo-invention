const CLIENT_DEBUG = false

const Vector2 = require('../../shared/Vector2')

const Controls = require('./Controls')
const Canvas = require('./Canvas')
const Networking = require('./Networking')

const MainMenu = require('./MainMenu')

const Rock = require('./Rock')

Canvas.setup()
Controls.setup()

class Game {
  constructor () {
    this.Networking = new Networking(this)

    this.startTime = Date.now()
    this.timeStamp = 0
    this.lastUpdate = Date.now()
    this.lastGameTick = 0
    this.previousUpdate = 1

    this.mainLoopBind = null
    this.timerLoopBind = null

    this.run = false

    this.view = new Vector2(0, 0)
    this.Nodes = {}
    this.sortedNodes = []
    this.shouldResortNodes = false // to give the overlap effect

    this.border = {
      minx: 0,
      miny: 0,
      maxx: 0,
      maxy: 0
    }

    this.overlayVisible = true

    // you died screen
    this.killer = ''
    this.hasDied = false

    // debug features
    this.fps = 0
    this.fpsCounter = 0
    this.lastFpsCounter = Date.now()
    this.gameTicks = 0
    this.gameTickCounter = 0
  }

  stop () {
    this.run = false
  }

  start () {
    this.mainLoopBind = this.mainLoop.bind(this)
    this.timerLoopBind = this.timerLoop.bind(this)
    this.run = true

    setTimeout(this.timerLoopBind, 0)
  }

  reset () {
    this.view = new Vector2(0, 0)
    this.Nodes = {}
    this.sortedNodes = []
  }

  resortNodes () {
    this.sortedNodes = []
    const nodeIds = Object.keys(this.Nodes)

    for (var i = 0; i < nodeIds.length; i++) {
      this.sortedNodes.push(this.Nodes[nodeIds[i]])
    }

    this.sortedNodes.sort((a, b) => {
      // we want rocks to appear over other stuff
      let aSize = a instanceof Rock ? a.size * 3 : a.size
      let bSize = b instanceof Rock ? b.size * 3 : b.size

      if (aSize === bSize) {
        return a.id - b.id
      } else {
        return aSize - bSize
      }
    })

    this.shouldResortNodes = false
  }

  timerLoop () {
    if (this.run) {
      this.previousUpdate = this.lastUpdate
      this.lastUpdate = Date.now()
      this.elapsedTime = this.lastUpdate - this.previousUpdate

      this.mainLoopBind()
    }

    if (this.overlayVisible) { // reduce frame rate, more coinhive money
      let timerLoopBind = this.timerLoopBind

      setTimeout(() => {
        timerLoopBind()
      }, 80)
    } else {
      window.requestAnimationFrame(this.timerLoopBind)
    }
  }

  mainLoop () {
    if (this.fpsCounter ^ 4 === 0) {
      const overlayElement = document.getElementById('menuContainer')
      this.overlayVisible = overlayElement.style.display === 'flex'
    }

    if ((1000 / this.gameTicks || 25) / 4 ^ this.fpsCounter) {
      this.Networking.sendClientUpdates()
    }

    if (this.lastUpdate - this.lastFpsCounter >= 1000) {
      this.lastFpsCounter = this.lastUpdate
      this.fps = this.fpsCounter
      this.fpsCounter = 0
      this.gameTicks = this.gameTickCounter
      this.gameTickCounter = 0

      if (this.gameTicks === 0) {
        window.Events.onError()
      }
    }
    this.fpsCounter++

    if (this.shouldResortNodes) {
      this.resortNodes()
    }

    this.centerView()
    this.draw()

    if (CLIENT_DEBUG) {
      Canvas.ctx.save()
      Canvas.debugDrawText(`V: ${__webpack_hash__.toUpperCase()} FPS: ${this.fps} GT/S: ${this.gameTicks} Nodes: ${Object.keys(this.Nodes).length}`)
      Canvas.ctx.restore()
    }
  }

  draw () {
    if (this.overlayVisible) {
      return MainMenu.draw(Canvas, this.fps)
    }

    if (this.hasDied) {
      return Canvas.drawDeathMenu(this.killer, this)
    }

    Canvas.ctx.save()
    Canvas.clear()
    Canvas.drawGrid(this.view)

    Canvas.ctx.translate(Canvas.canvas.width / 2, Canvas.canvas.height / 2)
    Canvas.ctx.scale(this.defaultScale(), this.defaultScale())
    Canvas.ctx.translate(-this.view.x, -this.view.y)

    Canvas.drawBoarder(this)

    const NodeKeys = Object.keys(this.sortedNodes)
    for (var i = 0; i < NodeKeys.length; i++) {
      this.sortedNodes[NodeKeys[i]].draw(Canvas.ctx, this.lastUpdate, this.lastGameTick, this.gameTicks)
    }

    Canvas.ctx.restore()
  }

  centerView () {
    let sumX = 0
    let sumY = 0
    let visibleShipCount = 0

    const NodeKeys = Object.keys(this.Nodes)
    for (let i = 0; i < NodeKeys.length; i++) {
      if (this.Nodes[NodeKeys[i]].isOwned) {
        sumX += this.Nodes[NodeKeys[i]].Vector2.x
        sumY += this.Nodes[NodeKeys[i]].Vector2.y
        visibleShipCount++
      }
    }

    if (Math.abs(this.view.x - sumX) >= 500) {
      this.view.x = sumX
    }
    if (Math.abs(this.view.y - sumY) >= 500) {
      this.view.y = sumY
    }

    if (visibleShipCount) {
      let fpsC = 10
      this.view.x *= fpsC
      this.view.y *= fpsC
      this.view.x += sumX / visibleShipCount
      this.view.y += sumY / visibleShipCount
      this.view.x /= fpsC + 1
      this.view.y /= fpsC + 1
    }
  }

  gameTickLerp () {
    const NodeKeys = Object.keys(this.Nodes)

    for (let i = 0; i < NodeKeys.length; i++) {
      const Rock = this.Nodes[NodeKeys[i]]
      if (Rock.isRock) {
        Rock.Rotation.rotate()
        Rock.Rotation.speedDecay()
      }
    }

    for (let i = 0; i < NodeKeys.length; i++) {
      let Node = this.Nodes[NodeKeys[i]]

      if (Node.alpha <= 0.1) { // remove dead nodes after animation
        delete this.Nodes[NodeKeys[i]]
        this.shouldResortNodes = true
      }

      if (Math.abs(Node.Velocity.x) + Math.abs(Node.Velocity.y) < 0.1) continue

      Node.Vector2.add(Node.Velocity)
      let x = Node.Vector2.x
      let y = Node.Vector2.y

      x = Math.max(x, this.border.minx)
      y = Math.max(y, this.border.miny)

      x = Math.min(x, this.border.maxx / 2)
      y = Math.min(y, this.border.maxy / 2)

      Node.Vector2.x = x
      Node.Vector2.y = y
    }
  }

  defaultScale () {
    return Math.max(Canvas.canvas.width / 1920, Canvas.canvas.height / 1080)
  }

  getNode (nodeId) {
    return this.Nodes[nodeId]
  }

  addNode (node) {
    this.shouldResortNodes = true
    this.Nodes[node.nodeId] = node
  }

  deleteNode (nodeId) {
    this.Nodes[nodeId].isDying = true
  }

  updateBorder (border) {
    let isFirstBorder = Canvas.lastBorder.minx === Canvas.lastBorder.maxx

    if (isFirstBorder) {
      Canvas.lastBorder = border
    }

    this.border = border
  }

  getControls () {
    return Controls
  }

  gameTick () {
    this.lastGameTick = Date.now()
    this.gameTickCounter++
  }

  onDeath (killer) {
    this.killer = killer
    this.hasDied = true
  }
}

module.exports = new Game()
