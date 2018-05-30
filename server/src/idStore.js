// Stores all node ids to avoid the ids getting to large (large packet size, lag, etc)

let nodeIdMap = {}
let playerIdMap = {}

class idStore {
  static getNextNodeId () {
    let nodeId = 1
    let currentDate = Date.now()

    while (nodeIdMap[nodeId]) { // find unused id
      if (typeof nodeIdMap[nodeId] !== 'boolean') {
        if (currentDate - nodeIdMap[nodeId] >= 10000) {
          delete nodeIdMap[nodeId]
          break
        }
      }

      nodeId++
    }

    nodeIdMap[nodeId] = true

    return nodeId
  }

  static removeNodeId (nodeId) {
    nodeIdMap[nodeId] = Date.now()
  }

  static getNewPlayerId () {
    const timeoutInterval = 60 * 60 * 1000 // 1 hour
    let playerId = 1
    let currentDate = Date.now()

    while (playerIdMap[playerId]) { // find unused id
      if (currentDate - playerIdMap[playerId] >= timeoutInterval) {
        delete playerIdMap[playerId]
      }
      playerId++
    }

    playerIdMap[playerId] = +Date.now()

    return playerId
  }
}

module.exports = idStore
