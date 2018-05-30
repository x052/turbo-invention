const Rock = require('./Rock')
const Ship = require('./Ship')

const Rotation = require('../../shared/Rotation')
const Vector2 = require('../../shared/Vector2')
const ShipGen = require('../../shared/ShipGen')

const Styles = require('../../shared/Styles')
const Types = new (require('../../shared/Types'))(Styles)

const PACKET = require('../../shared/PacketId.js')
const msgpack = require('msgpack-lite')
const SnappyJS = require('snappyjs')

const Packet = {
  // Game Externs
  addNode: () => {},
  getNode: () => {},
  deleteNode: () => {},
  gameTick: () => {},
  gameTickLerp: () => {},
  updateBorder: () => {},
  onDeath: () => {},
  // Internal
  scrambleKey: 0,
  lastClientUpdateSent: []
}

function arrayToVector (array) {
  return new Vector2(array[0], array[1])
}

function arrayListToVectorList (arrayList) {
  const VectorList = []
  arrayList.forEach((array) => {
    VectorList.push(arrayToVector(array))
  })

  return VectorList
}

Packet.PARSE_MESSAGE = function (Message) {
  Message = new Uint8Array(Message)
  Message = SnappyJS.uncompress(Message)
  Message = msgpack.decode(Message)

  let PacketId = Message[0]
  Message.shift()
  Packet[PacketId](Message)
}

Packet.ADD_A_NICE_NEW_NODE = function newNode (data) {
  const Data = {
    Vector2: data[0], // Vector2
    Velocity: data[1], // Velocity
    type: data[2], // type
    Rotation: data[3], // rotation
    size: data[4], // size
    colour: data[5], // colour
    points: data[6], // points
    nodeId: data[7], // nodeId,
    health: data[8] // health
  }

  let isShip = false
  if (!Data.nodeId) return
  if (Data.points.length === 0) {
    isShip = true
  }

  let Node
  if (isShip) {
    Node = new Ship(Types.ships[Data.type])
  } else {
    Node = new Rock(Types.rocks[Data.type])
  }
  Node.nodeId = Data.nodeId

  Node.Vector2 = arrayToVector(Data.Vector2)
  Node.Velocity = arrayToVector(Data.Velocity)
  const r = arrayToVector(Data.Rotation)
  Node.Rotation = new Rotation(r.x, r.y)

  Node.size = Data.size
  if (isShip) {
    ShipGen(Node)
    Node.health = Data.health
    Node.isOwned = data[data.length - 1] // isOwned
  } else {
    Node.points = arrayListToVectorList(Data.points)
  }

  Node.colour = Data.colour
  Node.borderColour = Data.colour
  Node.fillColour = Styles.shadeColor(Node.colour, Styles.rockShadeColor)

  Packet.addNode(Node)
}

Packet.UPDATE_SOME_NODE = function updateNode (data) {
  const nodeId = data[0]
  data.shift()

  let Node = Packet.getNode(nodeId)
  if (!Node) return

  while (typeof data[0] === 'number') {
    switch (data[0]) {
      case PACKET.UPDATES.Vector2:
        Node.Vector2.setCoords(data[1], data[2])
        data.shift()
        break
      case PACKET.UPDATES.Velocity:
        Node.Velocity.setCoords(data[1], data[2])
        Node.Rotation.rotation = Math.atan2(data[2], data[1])
        Node.Rotation.rotation = Node.Rotation.rotation * 180 / Math.PI
        data.shift()
        break
      case PACKET.UPDATES.type:
        Node.type = data[1]
        break
      case PACKET.UPDATES.rotation:
        Node.Rotation.set(data[1], data[2])
        data.shift()
        break
      case PACKET.UPDATES.size:
        Node.size = data[1]
        break
      case PACKET.UPDATES.health:
        Node.health = data[1]
        break
      case PACKET.UPDATES.points:
        Node.points = data[1]
    }
    data.shift()
    data.shift()
  }
}

Packet.BLAST_NODE_TO_BITS = function deleteNode (data) {
  Packet.deleteNode(data)
}

Packet[PACKET.ONDEATH] = function (data) {
  let killer = data[0]
  Packet.onDeath(killer)
}

Packet[PACKET.LEADERBOARD] = function (data) {
  window.Events.leaderBoardUpdate(data[0])
}

Packet[PACKET.BORDER] = function (data) {
  Packet.updateBorder({
    minx: data[0],
    miny: data[1],
    maxx: data[2],
    maxy: data[3]
  })
}

Packet[PACKET.NODE_UPDATES] = function (data) {
  Packet.gameTick()
  Packet.gameTickLerp()

  data.forEach((data) => {
    const isDeletedNode = typeof data === 'string'
    const isNewNode = data[0] === true
    const isUpdatedNode = typeof data[0] === 'number'

    if (isNewNode) {
      data.shift()
      Packet.ADD_A_NICE_NEW_NODE(data)
    }
    if (isUpdatedNode) Packet.UPDATE_SOME_NODE(data)
    if (isDeletedNode) Packet.BLAST_NODE_TO_BITS(data)
  })
}

Packet.CONNECTION_INIT = function (send, key, protocol, connectionKey) {
  Packet.scrambleKey = parseInt(`0x${__webpack_hash__}`)
  key += 0xA

  const data = [
    key * 2,
    PACKET.CONNECTION_INIT ^ ((key - 0x9) * 0xD),
    protocol ^ ((key - 0x9) * 0xE),
    (connectionKey + Packet.scrambleKey) ^ ((key - 0x9) * 0xF)
  ]
  send(data[0] === 9 * 2 ? msgpack.encode([protocol, connectionKey]) : msgpack.encode(data))
}

Packet.I_WANA_PLAY = function spawn (send, name) {
  const data = [
    PACKET.I_WANA_PLAY,
    name
  ]
  send(msgpack.encode(data))
}

Packet.SEND_SOME_UPDATES = function sendClientUpdates (send, KeysDown, mousePosition) {
  if (typeof window !== 'undefined') {
    var x = mousePosition.x - (window.innerWidth / 2)
    var y = mousePosition.y - (window.innerHeight / 2)
  } else {
    var x = mousePosition.x
    var y = mousePosition.y
    Packet.lastClientUpdateSent = []
  }

  const data = [
    PACKET.SEND_SOME_UPDATES,
    KeysDown['w'] || KeysDown['&'] || false,
    KeysDown['s'] || KeysDown['('] || false,
    KeysDown['a'] || KeysDown['%'] || false,
    KeysDown['d'] || KeysDown["'"] || false,
    KeysDown[' '] || KeysDown[String.fromCharCode(13)] || KeysDown[1] || false,
    Math.round(x / 10),
    Math.round(y / 10)
  ]
  if (JSON.stringify(Packet.lastClientUpdateSent) === JSON.stringify(data)) return
  Packet.lastClientUpdateSent = data
  send(msgpack.encode(data))
}

module.exports = Packet
