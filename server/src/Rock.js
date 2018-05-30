const Vector2 = require('../../shared/Vector2')
const Rotation = require('../../shared/Rotation')

class Rock {
  constructor (gameServer, type) {
    this.nodeId = gameServer.getNextNodeId()

    this.updateTick = gameServer.randomInt(0, 24)

    this.Vector2 = new Vector2(0, 0)
    this.Velocity = new Vector2(0, 0)
    this.type = type
    this.value = this.type.value
    this.rotation = new Rotation(0, 1)
    this.size = this.type.defaultSize

    this.isShip = false
    this.isRock = true

    this.colour = this.type.colourList[(Math.random() * this.type.colourList.length) | 0]
    this.borderColour = this.colour
    this.fillColour = Styles.shadeColor(this.colour, Styles.rockShadeColor)
    RockGen(this)
  }

  setPointList (pointList) {
    this.points = pointList
  }

  setPos (x, y) {
    this.Vector2.setCoords(x, y)
  }

  setVel (x, y) {
    this.Vector2.setCoords(x, y)
  }
}

module.exports = Rock
