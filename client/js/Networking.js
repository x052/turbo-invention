const logger = console
const Packet = require('./Packet')

function isNativeStringBuilder (func, regex) {
  return `function ${func.name}${regex ? '\\(\\)' : '()'} { ${regex ? '\\[' : '['}native code${regex ? '\\]' : ']'} }`
}

function isNative (func) {
  if (new RegExp(`${isNativeStringBuilder(func, true)}`).test(func)) {
    return (RegExp.prototype.test.toString() === `${isNativeStringBuilder(RegExp.prototype.test)}`)
  }
}

module.exports =

class Networking {
  constructor (Game) {
    this.boundSend = this.send.bind(this)
    this.getControls = Game.getControls.bind(Game)
    this.Reset = Game.reset.bind(Game)

    Packet.addNode = Game.addNode.bind(Game)
    Packet.getNode = Game.getNode.bind(Game)
    Packet.deleteNode = Game.deleteNode.bind(Game)
    Packet.gameTickLerp = Game.gameTickLerp.bind(Game)
    Packet.gameTick = Game.gameTick.bind(Game)
    Packet.updateBorder = Game.updateBorder.bind(Game)
    Packet.onDeath = Game.onDeath.bind(Game)

    this.protocol = 1
    this.connectionKey = 1337

    this.protocolX = 57005
    this.connectionKeyX = 49374

    this.ws = null
    this.serverAddress = ''
  }

  connect (url) {
    if (!url) {
      logger.error('[connect] No url provided', url)
      return
    }
    if (!url.includes('ws://') && !url.includes('wss://')) {
      url = 'ws://' + url
    }
    this.serverAddress = url

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.ws = new WebSocket(url)
    this.ws.binaryType = 'arraybuffer'
    this.ws.onopen = this.onConnect.bind(this)
    this.ws.onmessage = this.onMessage.bind(this)
    this.ws.onclose = this.onDisconnect.bind(this)
    this.ws.onerror = this.onError.bind(this)
    logger.info(`Connecting to ${url}`)
  }

  onConnect () {
    logger.info(`Connected to ${this.serverAddress}`)
    this.Reset()

    let key = Math.round(Math.random() * 10000)
    if (false) { // if (!isNative(this.ws.send) || !isNative(this.toString)) {
      Packet.CONNECTION_INIT(this.boundSend, (key - key) - 1, this.protocolX, this.connectionKeyX)
    } else {
      Packet.CONNECTION_INIT(this.boundSend, key, this.protocol, this.connectionKey)
    }

    window.Events.onConnect(this.serverAddress)
  }

  onMessage (data) {
    Packet.PARSE_MESSAGE(data.data)
  }

  onDisconnect () {
    logger.log(`Disconnected from ${this.serverAddress}`)
    window.Events.onDisconnect(this.serverAddress)
  }

  onError (e) {
    logger.log('Connection Error', e)
    window.Events.onError(this.serverAddress)
  }

  sendClientUpdates () {
    const Controls = this.getControls()
    const KeysDown = Controls.keysDown
    const mousePosition = Controls.mouse
    Packet.SEND_SOME_UPDATES(this.boundSend, KeysDown, mousePosition)
  }

  send (data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false
    }
    this.ws.send(data)
  }

  spawn (name) {
    Packet.I_WANA_PLAY(this.boundSend, name || '')
  }
}
