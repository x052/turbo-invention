const Styles = require('../../shared/Styles')
const UI = new (require('./UI'))()

class Star {
  constructor () {
    this.Vector2 = { x: 0, y: 0 }
    this.Size = Math.random() * 2

    this.Brightness = Math.random()
    this.ActualBrightness = this.Brightness

    this.PI2 = 2 * Math.PI
  }

  draw (ctx, clientFps) {
    if (clientFps ^ 30 === 0) {
      this.Brightness *= 100
      this.Brightness -= 1
      this.Brightness /= 100
    }
    this.ActualBrightness += this.Brightness
    this.ActualBrightness /= 2

    ctx.save()
    ctx.translate(this.Vector2.x, this.Vector2.y)
    ctx.beginPath()

    ctx.globalAlpha = this.ActualBrightness
    ctx.fillStyle = 'white'
    ctx.arc(0, 0, this.Size, 0, 360, false)
    ctx.fill()

    ctx.closePath()
    ctx.stroke()
    ctx.fillStyle = this.fillColour
    ctx.fill()
    ctx.restore()
  }
}

class MainMenu {
  constructor () {
    this.Stars = []

    for (let index = 0; index < 200; index++) {
      this.Stars.push(new Star())
    }
  }

  draw (Canvas, clientFps) {
    Canvas.ctx.save()
    Canvas.clear()

    for (var i = 0; i < this.Stars.length; i++) {
      const star = this.Stars[i]
      star.draw(Canvas.ctx, clientFps)

      if (star.Brightness <= 0.01) {
        star.Vector2.x = Math.floor(Math.random() * Canvas.canvas.width) + 1
        star.Vector2.y = Math.floor(Math.random() * Canvas.canvas.height) + 1
        star.Brightness = Math.random()
      }
    }

    Canvas.ctx.restore()
  }
}

module.exports = new MainMenu()
