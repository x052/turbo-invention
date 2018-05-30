module.exports =

class Ship {
  constructor (nodeId, pID, type, size) {
    this.pID = pID
    this.nodeId = nodeId

    this.updateTick = Math.floor(Math.random() * (24 - 0 + 1) + 0) // used for smoothing rotation
    this.colour = '#ffffff'
    this.Vector2 = new Vector2(0, 0)
    this.Velocity = new Vector2(0, 0)
    this.type = Types.ships[type]

    this.rotation = new Rotation(0, 0)
    this.size = size || this.type.size
    this.points = []

    this.isShip = true
    this.isRock = false

    this.health = pID >= 1 ? this.type.health : 0

    this.isBullet = false
    this.bulletOwner = -1

    this.lastDistractionUse = 0 // for distraction powerup
    this.minionPowerupUse = false // for minion powerup
  }

  setPos (x, y) {
    this.Vector2.setCoords(x, y)
  }

  setColour (colour) {
    this.colour = colour
  }

  randomColour () {
    this.colour = this.type.colourList[(Math.random() * this.type.colourList.length) | 0]
  }

  checkBorder (border) {
    var r = this.getSize() / 2
    var x = this.position.x
    var y = this.position.y
    x = Math.max(x, border.minx + r)
    y = Math.max(y, border.miny + r)
    x = Math.min(x, border.maxx - r)
    y = Math.min(y, border.maxy - r)
    if (x !== this.position.x || y !== this.position.y) {
      this.Position.setCoords(x, y)
    }
  }
}
