const { FakeSocket, FakePlayerTracker } = require('./base')

function randInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

const getNewMinion = (gameServer, owner) => {
  let socket = new FakeSocket(gameServer)
  let playerTracker = new FakePlayerTracker(gameServer, socket)

  playerTracker.botOwner = owner

  playerTracker.shipType = 'Minion'
  playerTracker.updateAI = navigate

  playerTracker.isBot = false // used to get world view

  socket.PlayerTracker = playerTracker

  return socket
}

const navigate = (playerTracker) => {
  let targetShip = playerTracker.botOwner.PlayerTracker.Ship

  if (!playerTracker.Ship && targetShip && targetShip.minionPowerupUse) {
    if (playerTracker.gameServer.tickRate <= 19 && Math.random() > 0.5) {
      return // lag preventation
    }

    playerTracker.joinGame(`${playerTracker.botOwner.PlayerTracker.name}'s Minion`)

    playerTracker.Ship.type = new Types.ShipType(playerTracker.Ship.type) // deep copy
    playerTracker.Ship.type.isBot = true

    playerTracker.Ship.Vector2.x = targetShip.Vector2.x + randInt(-50, 50)
    playerTracker.Ship.Vector2.y = targetShip.Vector2.y + randInt(-50, 50)

    targetShip.minionPowerupUse = false
  }

  if (playerTracker.Ship && !playerTracker.botOwner.PlayerTracker.Ship) {
    if (playerTracker.gameServer.tick ^ 25 === 0) { // lag preventation
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

  for (let index = 0; index < playerTracker.viewNodes.length; index++) {
    const visibleNode = playerTracker.viewNodes[index]

    if (!visibleNode.isShip) continue
    if (visibleNode.isBullet) continue
    if (visibleNode.type.isItem) continue
    if (visibleNode.type.type === playerTracker.shipType) continue
    if (visibleNode.nodeId === playerTracker.Ship.nodeId) continue
    if (visibleNode.nodeId === targetShip.nodeId) continue

    targetShip = visibleNode
    break
  }

  if (distance(playerTracker.Ship) > 1500) { // don't let minions go too far
    targetShip = playerTracker.botOwner.PlayerTracker.Ship
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
  }

  if (distance(playerTracker.Ship) < 1500) {
    b = 0.05
  }

  let endX = (targetX - startX) * b
  let endY = (targetY - startY) * b

  playerTracker.mouse.x = endX
  playerTracker.mouse.y = endY

  if (targetShip === playerTracker.botOwner.PlayerTracker.Ship) {
    playerTracker.keysDown['attack'] = false
  }
}

module.exports = getNewMinion
