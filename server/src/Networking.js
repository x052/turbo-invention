const WebSocket = require('ws')

const msgpack = require('msgpack-lite')
const SnappyJS = require('snappyjs')

const PACKET_ID = require('../../shared/PacketId.js')

class Networking {
  constructor (gameServer) {
    this.protocol = 1
    this.connectionKey = 1337

    this.gameServer = gameServer

    this.serverAddress = ''
  }

  onClientSocketMessage (ws, Message) {
    try {
      Message = msgpack.decode(Message)
    } catch (error) {
      ws.close()
    }

    if (!ws.hasInit) {
      let scrambleKey = Message[0] / 2
      let PacketId = Message[1] ^ ((scrambleKey - 0x9) * 0xD)
      let protocol = Message[2] ^ ((scrambleKey - 0x9) * 0xE)
      let connectionKey = Message[3] ^ ((scrambleKey - 0x9) * 0xF)

      scrambleKey = connectionKey - this.connectionKey
      connectionKey = connectionKey - scrambleKey

      if (PacketId === PACKET_ID.CONNECTION_INIT && protocol === this.protocol && connectionKey === this.connectionKey) {
        ws.hasInit = true
        logger.log(`Client Connected pID: ${ws.PlayerTracker.pID} Players: ${this.gameServer.socketCount}`)
      }
      return
    }

    let PacketId = Message[0]
    Message.shift()

    switch (PacketId) {
      case PACKET_ID.I_WANA_PLAY:
        ws.PlayerTracker.joinGame(Message[0])
        break
      case PACKET_ID.SEND_SOME_UPDATES:
        if (ws.PlayerTracker.Ship) {
          ws.PlayerTracker.keysDown['w'] = Message[0]
          ws.PlayerTracker.keysDown['s'] = Message[1]
          ws.PlayerTracker.keysDown['a'] = Message[2]
          ws.PlayerTracker.keysDown['d'] = Message[3]

          ws.PlayerTracker.keysDown['attack'] = Message[4]

          ws.PlayerTracker.mouse.x = Message[5]
          ws.PlayerTracker.mouse.y = Message[6]
        }
    }
  }

  sendLeaderboard (ws) {
    if (!ws || ws.readyState !== WebSocket.OPEN || !ws.hasInit) {
      return false
    }

    if (ws.cacheLB === JSON.stringify(this.gameServer.leaderboard)) {
      return false
    }

    const buffer = [
      PACKET_ID.LEADERBOARD,
      this.gameServer.leaderboard
    ]

    ws.cacheLB = JSON.stringify(this.gameServer.leaderboard)

    const encodedMessage = msgpack.encode(buffer)
    const compressed = SnappyJS.compress(encodedMessage)

    ws.send(compressed)
  }

  sendBorder (ws) {
    if (!ws || ws.readyState !== WebSocket.OPEN || !ws.hasInit) {
      return false
    }

    if (ws.cacheBorder === JSON.stringify(this.gameServer.border)) {
      return false
    }

    const buffer = [
      PACKET_ID.BORDER,
      this.gameServer.border.minx,
      this.gameServer.border.miny,
      this.gameServer.border.maxx * 2,
      this.gameServer.border.maxy * 2
    ]

    ws.cacheBorder = JSON.stringify(this.gameServer.border)

    const encodedMessage = msgpack.encode(buffer)
    const compressed = SnappyJS.compress(encodedMessage)

    ws.send(compressed)
  }

  sendDeath (ws, killer) {
    if (!ws || ws.readyState !== WebSocket.OPEN || !ws.hasInit) {
      return false
    }

    const buffer = [
      PACKET_ID.ONDEATH,
      killer
    ]

    const encodedMessage = msgpack.encode(buffer)
    const compressed = SnappyJS.compress(encodedMessage)

    ws.send(compressed)
  }
}

module.exports = Networking
