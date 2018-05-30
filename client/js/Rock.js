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

class Rock {
  constructor (type) {
    this.Vector2 = new Vector2(0, 0)
    this.Velocity = new Vector2(0, 0)
    this.type = type
    this.value = this.type.value
    this.Rotation = new Rotation(0, 0)
    this.size = this.type.defaultSize
    this.isRock = true
    this.isShip = false

    this.prev_x = 0
    this.prev_y = 0
    this.prev_rotation = 0

    this.colour = this.type.colourList[(Math.random() * this.type.colourList.length) | 0]
    this.borderColour = this.colour
    this.fillColour = Styles.shadeColor(this.colour, Styles.rockShadeColor)

    this.points = []

    this.isDying = false
    this.alpha = 1
  }

  draw (ctx, elapsedTime) {
    if (this.prev_x === 0) {
      this.prev_x = this.Vector2.x
      this.prev_y = this.Vector2.y
      this.prev_rotation = this.Rotation.rotation
    }

    this.prev_x = lerp(this.prev_x, this.Vector2.x, Styles.lerp)
    this.prev_y = lerp(this.prev_y, this.Vector2.y, Styles.lerp)
    this.prev_rotation = angleLerp(this.prev_rotation, this.Rotation.rotation, Styles.lerp)

    ctx.save()
    ctx.translate(this.prev_x, this.prev_y)

    if (this.isDying) {
      this.alpha -= 0.1

      ctx.globalAlpha = this.alpha
    }

    ctx.rotate(this.prev_rotation * Math.PI / 180)
    ctx.beginPath()
    ctx.strokeStyle = this.borderColour
    ctx.lineWidth = Styles.rockLineWidth
    ctx.moveTo(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y)

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

module.exports = Rock
