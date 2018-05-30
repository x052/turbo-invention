function preciseRound (num, decimals) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

class Rotation {
  constructor (rotation, rotationSpeed) {
    this.rotation = rotation || 0
    this.rotationSpeed = rotationSpeed || 0
  }

  rotate () {
    this.rotation += this.rotationSpeed
    if (this.rotation > 360) {
      this.rotation -= 360
    }

    if (this.rotation < 0) {
      this.rotation += 360
    }
  }

  speedDecay () {
    this.rotationSpeed -= (this.rotationSpeed / 1000)
    this.rotationSpeed = preciseRound(this.rotationSpeed, 5)
    if (Math.abs(this.rotationSpeed) < 0.1) this.rotationSpeed = 0
  }

  speedNum (num) {
    this.rotationSpeed += num
  }

  set (r, s) {
    this.rotation = r
    this.rotationSpeed = s
  }
}

module.exports = Rotation
