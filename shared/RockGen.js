let Vector2 = require('./Vector2') // closure compiler hack

module.exports = ((Rock) => {
  const MathVar = Math

  Rock.points = []
  let xrand = 0
  let yrand = 0

  xrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  yrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  Rock.points.push(new Vector2(xrand, yrand + 3 * Rock.size))
  xrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  yrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  Rock.points.push(new Vector2(xrand - 1 * Rock.size, yrand + 2 * Rock.size))
  xrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  yrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  Rock.points.push(new Vector2(xrand - 2 * Rock.size, yrand + 2 * Rock.size))
  xrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  yrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  Rock.points.push(new Vector2(xrand - 3 * Rock.size, yrand + Rock.size))
  xrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  yrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  Rock.points.push(new Vector2(xrand - 4 * Rock.size, yrand))
  xrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  yrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  Rock.points.push(new Vector2(xrand - 1 * Rock.size, yrand - 3 * Rock.size))
  xrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  yrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  Rock.points.push(new Vector2(xrand + 2 * Rock.size, yrand - 4 * Rock.size))
  xrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  yrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  Rock.points.push(new Vector2(xrand + 2 * Rock.size, yrand - 3 * Rock.size))
  xrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  yrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  Rock.points.push(new Vector2(xrand + 4 * Rock.size, yrand - 2 * Rock.size))
  xrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  yrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  Rock.points.push(new Vector2(xrand + 4 * Rock.size, yrand + Rock.size))
  xrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  yrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  Rock.points.push(new Vector2(xrand + 3 * Rock.size, yrand + 2 * Rock.size))
  xrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
  yrand = MathVar.round(MathVar.random() * Rock.size - Rock.size / 2)
})
