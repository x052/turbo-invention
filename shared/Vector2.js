class Vector2 {
  constructor (x, y) {
    this.x = x
    this.y = y
  }

  set (Vector2) {
    this.x = Vector2.x
    this.y = Vector2.y
  }

  setArray (arr) {
    this.x = arr[0]
    this.y = arr[1]
  }

  setCoords (x, y) {
    this.x = x
    this.y = y
  }

  clone () {
    return new Vector2(this.x, this.y)
  }

  mag () {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  add (Vector2) {
    this.x += Vector2.x
    this.y += Vector2.y
  }

  addArray (arr) {
    this.x += arr[0]
    this.y += arr[1]
  }

  addCoords (x, y) {
    this.x += x
    this.y += y
  }

  sub (Vector2) {
    this.x -= Vector2.x
    this.y -= Vector2.y
  }

  subArray (arr) {
    this.x -= arr[0]
    this.y -= arr[1]
  }

  subCoords (x, y) {
    this.x -= x
    this.y -= y
  }

  mult (number) {
    this.x *= number
    this.y *= number
  }

  scale (number) {
    this.mult(number)
  }

  multVec (Vector2) {
    this.x *= Vector2.x
    this.y *= Vector2.y
  }

  div (number) {
    this.x /= number
    this.y /= number
  }

  divVec (Vector2) {
    this.x /= Vector2.x
    this.y /= Vector2.y
  }

  dist (Vector2) {
    var dx = this.x - Vector2.x
    var dy = this.y - Vector2.y
    return Math.sqrt(dx * dx + dy * dy)
  }
}

module.exports = Vector2
