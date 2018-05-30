const packetId = {
  // in
  ONDEATH: 0xDEAD,
  BORDER: 0xB0DE,
  NODE_UPDATES: 0x1CE,
  UPDATES: {
    Vector2: 0x0,
    rotation: 0x1,
    Velocity: 0x2,
    type: 0x3,
    size: 0x4,
    points: 0x5,
    health: 0x6
  },
  LEADERBOARD: 0x1EAD,
  // out
  CONNECTION_INIT: 0xC001,
  I_WANA_PLAY: 0x2BAD,
  SEND_SOME_UPDATES: 0x0
}

module.exports = packetId
