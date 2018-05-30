let Vector2 = require('./Vector2') // closure compiler hack

module.exports = (Ship) => {
  let ShipsPoints = {}

  addShipPoints('SpeedItem', [ // hexagon
    new Vector2(5, -9),
    new Vector2(-5, -9),
    new Vector2(-10, 0),
    new Vector2(-5, 9),
    new Vector2(5, 9),
    new Vector2(10, 0)
  ])

  cloneShipPoints('MinionItem', 'SpeedItem')
  cloneShipPoints('DistractionItem', 'SpeedItem')

  addShipPoints('HealthItem', [// Bonus health
    new Vector2(0, -10),
    new Vector2(-10, 0),
    new Vector2(0, 10),
    new Vector2(10, 0)
  ])

  addShipPoints('b', [ // bullet
    new Vector2(0, 0),
    new Vector2(Ship.size, 0),
    new Vector2(Ship.size, Ship.size),
    new Vector2(0, Ship.size),
    new Vector2(0, 0)
  ])

  cloneShipPoints('sb', 'b')

  addShipPoints('Default', [
  // triangle
    new Vector2(Ship.size * 1.5, 0), // pointed top
    new Vector2(0 - Ship.size, 0 - Ship.size),
    new Vector2(0 - Ship.size, Ship.size),
    new Vector2(Ship.size * 1.5, 0) // pointed top
  // end triangle
  ])

  cloneShipPoints('Minion', 'Default')
  cloneShipPoints('Seeker', 'Default')

  function addShipPoints (name, points) {
    ShipsPoints[name] = points
  }

  function cloneShipPoints (name, targetName) {
    ShipsPoints[name] = ShipsPoints[targetName]
  }

  if (!Ship.points) Ship.points = []
  Ship.points = ShipsPoints[Ship.type.type]
  if (!Ship.points) {
    Ship.points = ShipsPoints.Default
    console.warn(`Can't find ${Ship.type.type}`)
  }
}
