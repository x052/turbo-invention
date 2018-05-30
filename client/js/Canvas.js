const Styles = require('../../shared/Styles')

class Canvas {
  constructor () {
    this.canvas = null
    this.ctx = null

    this.onDeadMenuCounter = 0
    this.lastBorder = {
      minx: 0,
      miny: 0,
      maxx: 0,
      maxy: 0
    }
  }

  resizeCanvas () {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  setup () {
    this.canvas = document.createElement('canvas')
    document.body.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')
    this.resizeCanvas()
    window.addEventListener('resize', this.resizeCanvas.bind(this), false)
  }

  clear () {
    this.ctx.fillStyle = Styles.background
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  debugDrawText (text) {
    this.ctx.font = '20px serif'
    this.ctx.fillStyle = Styles.debugTextColour
    this.ctx.fillText(text, 10, 50)
  }

  drawGrid (view) {
    this.ctx.save()

    this.ctx.strokeStyle = Styles.tileColour
    this.ctx.lineWidth = Styles.tileWidth
    this.ctx.globalAlpha = 0.2

    this.ctx.beginPath()

    var x = -0.5 + (-view.x + this.canvas.width / 2) % Styles.tileSize
    for (; x <= this.canvas.width; x += Styles.tileSize) {
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, this.canvas.height)
    }

    var y = -0.5 + (-view.y + this.canvas.height / 2) % Styles.tileSize
    for (; y <= this.canvas.height; y += Styles.tileSize) {
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(this.canvas.width, y)
    }
    this.ctx.stroke()
    this.ctx.restore()
  }

  drawBoarder (Game) {
    this.ctx.save()

    let border = {
      minx: Game.border.minx,
      miny: Game.border.miny,
      maxx: Game.border.maxx,
      maxy: Game.border.maxy
    }

    // smoothing
    border.minx = (this.lastBorder.minx * 9 + border.minx) / 10
    border.miny = (this.lastBorder.miny * 9 + border.miny) / 10
    border.maxx = (this.lastBorder.maxx * 9 + border.maxx) / 10
    border.maxy = (this.lastBorder.maxy * 9 + border.maxy) / 10

    this.lastBorder = {
      minx: border.minx,
      miny: border.miny,
      maxx: border.maxx,
      maxy: border.maxy
    }

    let lw = Styles.borderLineWidth
    let lwh = lw / 2

    this.ctx.beginPath()
    this.ctx.lineWidth = lw
    this.ctx.strokeStyle = Styles.borderLineColour
    this.ctx.globalAlpha = 1

    border.minx -= lwh
    border.miny -= lwh
    border.maxx += lwh + lwh
    border.maxy += lwh + lwh

    this.ctx.strokeRect(border.minx, border.miny,
      border.maxx, border.maxy)

    lw = Styles.outerBorderLineWidth
    lwh = lw / 2

    this.ctx.beginPath()
    this.ctx.lineWidth = lw
    this.ctx.strokeStyle = Styles.outerBorderLineColour
    this.ctx.globalAlpha = 0.6

    border.minx -= lwh
    border.miny -= lwh
    border.maxx += lwh + lwh
    border.maxy += lwh + lwh

    this.ctx.strokeRect(border.minx, border.miny,
      border.maxx, border.maxy)

    this.ctx.restore()
  }

  drawDeathMenu (killer, Game) {
    let textAlign = this.ctx.textAlign

    this.ctx.font = this.canvas.height / 10 + 'px roboto'
    this.ctx.textAlign = 'center'
    this.ctx.lineWidth = 1
    this.ctx.globalAlpha = (this.onDeadMenuCounter / 120)
    this.ctx.fillStyle = Styles.debugTextColour
    this.ctx.strokeStyle = 'black'
    this.ctx.fillText(`${killer} killed you!`, this.canvas.width / 2, this.canvas.height / 4)
    this.ctx.strokeText(`${killer} killed you!`, this.canvas.width / 2, this.canvas.height / 4)
    this.ctx.textAlign = textAlign

    if (this.onDeadMenuCounter > 120) {
      this.onDeadMenuCounter = 0
      window.Events.onDeath()
      Game.hasDied = false
      return false
    }

    this.onDeadMenuCounter++
    return true
  }
}

module.exports = new Canvas()
