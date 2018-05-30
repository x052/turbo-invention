const msgpack = require('msgpack-lite')
const SnappyJS = require('snappyjs')
const PACKET_ID = require('../../shared/PacketId.js')

function preciseRound (num, decimals) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

function vectorToArray (Vector) {
  return [Vector.x, Vector.y]
}

function vectorListToArray (VectorList) {
  const arrayList = []
  VectorList.forEach((Vector) => {
    arrayList.push(vectorToArray(Vector))
  })

  return arrayList
}

function getCacheNode (ws, node) {
  return {
    size: node.size,
    type: node.type,
    Vector2: {
      x: preciseRound(node.Vector2.x, 0),
      y: preciseRound(node.Vector2.y, 0)
    },
    Velocity: {
      x: preciseRound(node.Velocity.x, 1),
      y: preciseRound(node.Velocity.y, 1)
    },
    rotation: {
      rotation: preciseRound(node.rotation.rotation, 2),
      rotationSpeed: preciseRound(node.rotation.rotationSpeed, 2)
    },
    points: node.points,
    health: node.health
  }
}

function getObjectNode (ws, node) {
  let objectNode = [
    true, // isNewNode
    vectorToArray(node.Vector2), // Vector2
    vectorToArray(node.Velocity), // Velocity
    node.type.type, // type
    [ preciseRound(node.rotation.rotation, 2),
      preciseRound(node.rotation.rotationSpeed, 2) ], // rotation
    node.size, // size
    node.colour, // colour
    vectorListToArray(node.points), // points
    node.nodeId, // nodeId
    node.health
  ]

  if (node.points.length === 0) { // isShip
    objectNode.push(node.pID === ws.PlayerTracker.pID) // isOwned
  }
  return objectNode
}

function compareCacheUpdates (ws, cacheNode, node, nodeId, updateTick, gameTick) { // delta encoding
  const objectNode = [
    nodeId // nodeId
  ]

  let updateVector2 = cacheNode.Vector2.x !== node.Vector2.x ||
   cacheNode.Vector2.y !== node.Vector2.y

  let updateVelocity = cacheNode.Velocity.x !== node.Velocity.x ||
    cacheNode.Velocity.y !== node.Velocity.y

  if (updateVelocity && !node.isRock) { // Velocity
    objectNode.push(PACKET_ID.UPDATES.Velocity)
    objectNode.push(node.Velocity.x)
    objectNode.push(node.Velocity.y)

    if (updateVector2 && gameTick) { // Vector2
      objectNode.push(PACKET_ID.UPDATES.Vector2)
      objectNode.push(node.Vector2.x)
      objectNode.push(node.Vector2.y)
    }
  }

  if (objectNode.length !== 6 && node.pID === ws.PlayerTracker.pID &&
     updateVector2) {
    objectNode.push(PACKET_ID.UPDATES.Vector2)
    objectNode.push(node.Vector2.x)
    objectNode.push(node.Vector2.y)
  }

  let updateType = cacheNode.type !== node.type
  if (updateType) { // type
    objectNode.push(PACKET_ID.UPDATES.type)
    objectNode.push(node.type)
  }

  let updateRotation = gameTick % 25 === updateTick ||
    Math.abs(cacheNode.rotation.rotation - node.rotation.rotation) >= 3 ||
    Math.abs(cacheNode.rotation.rotationSpeed - node.rotation.rotationSpeed) >= 0.01

  if (updateRotation) {
    objectNode.push(PACKET_ID.UPDATES.rotation)
    objectNode.push(node.rotation.rotation)
    objectNode.push(node.rotation.rotationSpeed)
  }

  let updateSize = cacheNode.size !== node.size
  if (updateSize) { // size
    objectNode.push(PACKET_ID.UPDATES.size)
    objectNode.push(node.size)
  }

  let updateHealth = cacheNode.health !== node.health
  if (updateHealth) { // size
    objectNode.push(PACKET_ID.UPDATES.health)
    objectNode.push(node.health)
  }

  let updatePoints = false
  if (updatePoints) { // points
    objectNode.push(PACKET_ID.UPDATES.points)
    objectNode.push(node.points)
  }

  return objectNode
}

function cleanCatcheNodes (wsCacheNodes, usedCatcheNodes) {
  const deleteNodes = []
  const NodeKeys = Object.keys(wsCacheNodes)

  for (var i = 0; i < NodeKeys.length; i++) {
    const nodeId = NodeKeys[i]
    if (!usedCatcheNodes[nodeId]) {
      delete wsCacheNodes[nodeId]
      deleteNodes.push(nodeId)
    }
  }

  return deleteNodes
}

function sendNodeUpdates (ws, nodeList, gameTick) {
  if (!ws.PlayerTracker.Ship) {
    nodeList = []
  }

  if (!ws.cachedNodes) {
    ws.cachedNodes = {}
  }
  let usedCatcheNodes = {}
  const buffer = []

  // packet id
  buffer.push(PACKET_ID.NODE_UPDATES)

  // for nodeList, add to buffer
  for (let i = 0; i < nodeList.length; i++) {
    const node = nodeList[i]

    if (!node) return
    let nodeId = node.nodeId
    const cachedNode = getCacheNode(ws, node)

    if (!ws.cachedNodes[nodeId]) { // new node
      let newNodeBuffer = getObjectNode(ws, node)
      buffer.push(newNodeBuffer)
    } else { // update node
      let updates = compareCacheUpdates(ws, ws.cachedNodes[nodeId], cachedNode,
        nodeId, node.updateTick, gameTick)

      if (updates.length > 1) {
        buffer.push(updates)
      }
    }

    ws.cachedNodes[nodeId] = cachedNode
    usedCatcheNodes[nodeId] = true
  }

  const deleteNodes = cleanCatcheNodes(ws.cachedNodes, usedCatcheNodes)
  deleteNodes.forEach((nodeId) => {
    buffer.push(nodeId)
  })

  const encodedMessage = msgpack.encode(buffer)
  const compressed = SnappyJS.compress(encodedMessage)

  return compressed
}

module.exports = sendNodeUpdates
