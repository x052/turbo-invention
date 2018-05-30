class RockType {
  constructor (objData) {
    this.type = objData.type

    this.value = objData.value || 0
    this.defaultSize = objData.defaultSize || 0
    this.colourList = objData.colourList || ['white']
    this.rotationSpeed = objData.rotationSpeed || 3
  }
}

class ShipType {
  constructor (objData) {
    this.type = objData.type

    this.cost = objData.cost || 0
    this.size = objData.size || 10
    this.colourList = objData.colourList || ['white']
    this.maxSpeed = objData.maxSpeed || 30
    this.health = objData.health || 100
    this.bulletType = objData.bulletType || 'b'

    this.canCollide = false
    this.isItem = false
  }

  onAdd (bullet, gameServer) {

  }

  shouldHit (ship, collisionTarget) {
    return false
  }

  onHit (bullet, collisionTarget, gameServer) {

  }
}

class BulletType {
  constructor (objData) {
    this.type = objData.type

    this.spread = objData.spread || 0.5
    this.fireSpeed = objData.fireSpeed || 80

    this.size = objData.size || 10
    this.colourList = objData.colourList || ['white']
    this.maxSpeed = objData.maxSpeed || 30
    this.damage = objData.damage || 30
  }

  shouldRemove (stepDateTime, bullet) {
    return stepDateTime - bullet.startTime >= 5000
  }

  onAdd (bullet, gameServer) {

  }

  onHit (bullet, collisionTarget, gameServer) {
    collisionTarget.health -= bullet.type.damage
    bullet.bulletOwner.lbScore += bullet.type.damage
  }

  shouldHit (bullet, collisionTarget) {
    if (collisionTarget.isRock) return false
    if (collisionTarget.isBullet) return false
    if (collisionTarget.pID === bullet.bulletOwner.pID) return false
    if (collisionTarget.type.isItem) return false

    return true
  }
}

class Types {
  constructor (Styles) {
    this.RockType = RockType
    this.ShipType = ShipType
    this.BulletType = BulletType

    this.rocks = {}
    this.ships = {}

    // Rocks
    this.addType(this.rocks, 'Stone', new RockType({
      type: 'Stone',
      value: 100,
      defaultSize: 10,
      colourList: Styles.Rocks.Stone,
      rotationSpeed: 0.06
    }))
    /* ... */

    // Ships
    this.addType(this.ships, 'Default', new ShipType({
      type: 'Default',
      cost: 0,
      size: 20,
      colourList: Styles.Ships,
      maxSpeed: 18,
      health: 200,
      bulletType: 'b'
    }))

    this.addType(this.ships, 'Minion', new ShipType({
      type: 'Minion',
      cost: 0,
      size: 17,
      colourList: Styles.Ships,
      maxSpeed: 18,
      health: 200,
      bulletType: 'sb'
    }))

    this.addType(this.ships, 'Seeker', new ShipType({
      type: 'Seeker',
      cost: 0,
      size: 15,
      colourList: Styles.Ships,
      maxSpeed: 18,
      health: 50,
      bulletType: 'sb'
    }))

    // Ingame Items
    function itemShouldHit (ship, collisionTarget) {
      if (collisionTarget.isRock) return false
      if (collisionTarget.isBullet) return false
      if (collisionTarget.type.isItem) return false
      if (collisionTarget.type.isBot) return false

      return true
    }

    function itemOnAdd (bullet, gameServer) {
      gameServer.activeBonusItems++
    }

    this.addType(this.ships, 'MinionItem', new ShipType({
      type: 'MinionItem',
      cost: 0,
      size: 20,
      colourList: [ '#817fa0' ],
      maxSpeed: 18,
      health: 0,
      bulletType: 'b'
    }))

    this.ships['MinionItem'].canCollide = this.ships['MinionItem'].isItem = true
    this.ships['MinionItem'].onAdd = itemOnAdd
    this.ships['MinionItem'].shouldHit = itemShouldHit

    this.ships['MinionItem'].onHit = (bullet, collisionTarget, gameServer) => {
      collisionTarget.minionPowerupUse = true

      gameServer.activeBonusItems--
      for (let index = 0; index < gameServer.clients.length; index++) {
        const client = gameServer.clients[index]

        if (client.PlayerTracker.pID === collisionTarget.pID) {
          client.PlayerTracker.lbScore += 100
          break
        }
      }
    }

    this.addType(this.ships, 'DistractionItem', new ShipType({
      type: 'DistractionItem',
      cost: 0,
      size: 20,
      colourList: [ '#facb56' ],
      maxSpeed: 18,
      health: 0,
      bulletType: 'b'
    }))

    this.ships['DistractionItem'].canCollide = this.ships['DistractionItem'].isItem = true
    this.ships['DistractionItem'].onAdd = itemOnAdd
    this.ships['DistractionItem'].shouldHit = itemShouldHit

    this.ships['DistractionItem'].onHit = (bullet, collisionTarget, gameServer) => {
      collisionTarget.lastDistractionUse = gameServer.stepDateTime

      gameServer.activeBonusItems--
      for (let index = 0; index < gameServer.clients.length; index++) {
        const client = gameServer.clients[index]

        if (client.PlayerTracker.pID === collisionTarget.pID) {
          client.PlayerTracker.lbScore += 100
          break
        }
      }
    }

    this.addType(this.ships, 'SpeedItem', new ShipType({
      type: 'SpeedItem',
      cost: 0,
      size: 20,
      colourList: [ '#6497b1' ],
      maxSpeed: 18,
      health: 0,
      bulletType: 'b'
    }))

    this.ships['SpeedItem'].canCollide = this.ships['SpeedItem'].isItem = true
    this.ships['SpeedItem'].onAdd = itemOnAdd
    this.ships['SpeedItem'].shouldHit = itemShouldHit

    this.ships['SpeedItem'].onHit = (bullet, collisionTarget, gameServer) => {
      collisionTarget.Velocity.x *= 25
      collisionTarget.Velocity.y *= 25

      gameServer.activeBonusItems--
      for (let index = 0; index < gameServer.clients.length; index++) {
        const client = gameServer.clients[index]

        if (client.PlayerTracker.pID === collisionTarget.pID) {
          client.PlayerTracker.lbScore += 100
          break
        }
      }
    }

    this.addType(this.ships, 'HealthItem', new ShipType({
      type: 'HealthItem',
      cost: 0,
      size: 20,
      colourList: [Styles.healthGreen],
      maxSpeed: 18,
      health: 0,
      bulletType: 'b'
    }))

    this.ships['HealthItem'].canCollide = this.ships['HealthItem'].isItem = true
    this.ships['HealthItem'].onAdd = itemOnAdd
    this.ships['HealthItem'].shouldHit = itemShouldHit

    this.ships['HealthItem'].onHit = (bullet, collisionTarget, gameServer) => {
      let newHealth = collisionTarget.health + (collisionTarget.type.health / 100) * 10
      collisionTarget.health = Math.min(collisionTarget.type.health, newHealth)

      gameServer.activeBonusItems--
      for (let index = 0; index < gameServer.clients.length; index++) {
        const client = gameServer.clients[index]

        if (client.PlayerTracker.pID === collisionTarget.pID) {
          client.PlayerTracker.lbScore += 100
          break
        }
      }
    }
    /* ... */

    // Bullets
    this.addType(this.ships, 'b', new BulletType({ // Default bullet
      type: 'b',
      size: 7,
      colourList: Styles.Bullets,
      maxSpeed: 26,
      spread: 0,
      fireSpeed: 80,
      damage: 15
    }))

    this.addType(this.ships, 'sb', new BulletType({ // Seeker's bullet
      type: 'sb',
      size: 5,
      colourList: Styles.Bullets,
      maxSpeed: 26,
      spread: 0,
      fireSpeed: 220,
      damage: 7
    }))
    /* ... */
  }

  addType (TypeClass, TypeName, Type) {
    TypeClass[TypeName] = Type
  }
}

module.exports = Types
