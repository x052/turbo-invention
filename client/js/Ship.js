const Rotation = require('../../shared/Rotation')
const Vector2 = require('../../shared/Vector2')

const Styles = require('../../shared/Styles')

function lerp (y, x, m) {
  return m * y + (1.0 - m) * x
}

function angleLerp (start, end, amount) {
  let difference = Math.abs(end - start)
  if (difference > 180) {
    if (end > start) {
      start += 360
    } else {
      end += 360
    }
  }
  let value = lerp(start, end, amount)
  let rangeZero = 360
  if (value >= 0 && value <= 360) {
    return value
  }
  return (value % rangeZero)
}

class Ship {
  constructor (type) {
    this.Vector2 = new Vector2(0, 0)
    this.Velocity = new Vector2(0, 0)
    this.Rotation = new Rotation(0, 0)
    this.type = type
    this.size = this.type.size

    this.isRock = false
    this.isShip = true

    this.prev_x = 0
    this.prev_y = 0
    this.prev_rotation = 0

    this.health = this.type.health

    this.colour = this.type.colourList[(Math.random() * this.type.colourList.length) | 0]
    this.borderColour = this.colour
    this.fillColour = Styles.shadeColor(this.colour, Styles.shipShadeColor)

    this.isOwned = false

    this.isDying = false
    this.alpha = 1

    this.points = []
  }

  draw (ctx, lastUpdate, lastGameTick, gameTicks) {
    if (this.prev_x === 0) {
      this.prev_x = this.Vector2.x
      this.prev_y = this.Vector2.y
      this.prev_rotation = this.Rotation.rotation
    }

    let value = 0.8

    this.prev_x = lerp(this.prev_x, this.Vector2.x, value)
    this.prev_y = lerp(this.prev_y, this.Vector2.y, value)
    this.prev_rotation = angleLerp(this.prev_rotation, this.Rotation.rotation, value)

    ctx.save()
    ctx.translate(this.prev_x, this.prev_y)

    if (this.isDying) {
      this.alpha -= 0.1

      ctx.globalAlpha = this.alpha
    }

    // health bar
    if (this.health > 0) {
      ctx.save()

      let healthScale = Styles.healthScale * this.size

      let startX = -(healthScale / 2)
      let healthProgress = (this.health / this.type.health) * healthScale

      ctx.globalAlpha = 0.2
      ctx.lineWidth = Styles.healthLineWidth
      ctx.strokeStyle = Styles.tileColour
      ctx.strokeRect(startX, healthScale, healthScale, 10)

      ctx.globalAlpha = 0.6
      ctx.fillStyle = Styles.healthDamage
      ctx.fillRect(startX, healthScale, healthScale, 10)
      ctx.fillStyle = Styles.healthGreen
      ctx.fillRect(startX, healthScale, healthProgress, 10)

      ctx.restore()
    }

    // main ship
    ctx.rotate(this.prev_rotation * Math.PI / 180)
    ctx.beginPath()
    ctx.strokeStyle = this.borderColour
    ctx.lineWidth = Styles.shipLineWidth

    for (var i = 0; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y)
    }

    ctx.closePath()
    ctx.stroke()
    ctx.fillStyle = this.fillColour
    ctx.fill()

    ctx.restore()
  }
}

module.exports = Ship
