const { FakeSocket, FakePlayerTracker } = require('./base')

const getNewSeeker = (gameServer, owner) => {
  let socket = new FakeSocket(gameServer)
  let playerTracker = new FakePlayerTracker(gameServer, socket)

  playerTracker.botOwner = owner

  playerTracker.shipType = 'Seeker'
  playerTracker.updateAI = navigate

  playerTracker.deaths = 0

  socket.PlayerTracker = playerTracker

  return socket
}

const navigate = (playerTracker) => {
  if (!playerTracker.Ship && playerTracker.botOwner.PlayerTracker.Ship) {
    if (playerTracker.gameServer.tickRate <= 19 && Math.random() > 0.5) {
      return // lag preventation
    }

    if (Math.random() < playerTracker.deaths / 60) { // testing
      playerTracker.shipType = 'Default'
      playerTracker.joinGame('Seeker v2')
    } else {
      playerTracker.shipType = 'Seeker'
      playerTracker.joinGame('Seeker')
    }

    playerTracker.deaths++

    playerTracker.Ship.type = new Types.ShipType(playerTracker.Ship.type) // deep copy
    playerTracker.Ship.type.isBot = true
  }

  if (playerTracker.Ship && !playerTracker.botOwner.PlayerTracker.Ship) {
    playerTracker.deaths = 0

    if (playerTracker.gameServer.tick ^ 25 === 0) {
      let newHealth = playerTracker.Ship.health - (playerTracker.Ship.type.health / 120)

      playerTracker.Ship.health = newHealth

      if (playerTracker.Ship.health <= 0) {
        playerTracker.gameServer.removeShip(playerTracker.Ship)
        playerTracker.Ship = null
      }
    }
  }

  if (!playerTracker.Ship || !playerTracker.botOwner.PlayerTracker.Ship) return

  const distance = (end) => {
    var r1 = playerTracker.botOwner.PlayerTracker.Ship.Vector2.x
    var c1 = playerTracker.botOwner.PlayerTracker.Ship.Vector2.y

    var r2 = end.Vector2.x
    var c2 = end.Vector2.y

    return Math.abs(r1 - r2) + Math.abs(c1 - c2)
  }

  const distance2 = (start, end) => {
    var r1 = start.Vector2.x
    var c1 = start.Vector2.y

    var r2 = end.Vector2.x
    var c2 = end.Vector2.y

    return Math.abs(r1 - r2) + Math.abs(c1 - c2)
  }

  let targetShip = playerTracker.botOwner.PlayerTracker.Ship
  let isDistracted = targetShip.lastDistractionUse

  if (playerTracker.gameServer.stepDateTime - targetShip.lastDistractionUse >= 2 * 1000) { // distraction only works for 2s
    targetShip.lastDistractionUse = 0
  }

  if (isDistracted) {
    return
  }

  playerTracker.keysDown = {}

  let startX = playerTracker.Ship.Vector2.x
  let startY = playerTracker.Ship.Vector2.y

  let targetX = 0
  let targetY = 0
  let b = 10

  targetX = targetShip.Vector2.x + (targetShip.Velocity.x * 5)
  targetY = targetShip.Vector2.y + (targetShip.Velocity.y * 5)

  if (distance(playerTracker.Ship) < 1000) {
    playerTracker.keysDown['attack'] = true

    b = 0.01
  }

  if (distance(playerTracker.Ship) < 1500) {
    b = 0.03
  }

  let endX = (targetX - startX) * b
  let endY = (targetY - startY) * b

  playerTracker.mouse.x = endX
  playerTracker.mouse.y = endY
}
module.exports = getNewSeeker
