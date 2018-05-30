// the *Handler name was because closure compiler wouldn't rename it if it was just *

class Controls {
  constructor () {
    this.keysDown = {}
    this.mouse = {
      x: 0,
      y: 0
    }
  }

  onkeydownHandler (e) {
    e = e || window.event
    if (!this.keysDown[String.fromCharCode(e.keyCode).toLowerCase()]) {
      this.keysDown[String.fromCharCode(e.keyCode).toLowerCase()] = true
    }
  }

  onkeyupHandler (e) {
    e = e || window.event
    if (this.keysDown[String.fromCharCode(e.keyCode).toLowerCase()]) {
      this.keysDown[String.fromCharCode(e.keyCode).toLowerCase()] = false
    }
  }

  onblurHandler () {
    this.keysDown = {}
    this.mouse = {
      x: 0,
      y: 0
    }
  }

  onmousemoveHandler (e) {
    this.mouse = {
      x: e.clientX,
      y: e.clientY
    }
  }

  mouseupHandler () {
    this.keysDown[1] = false
  }

  mousedownHandler () {
    this.keysDown[1] = true
  }

  setup () {
    window.onkeydown = this.onkeydownHandler.bind(this)
    window.onkeyup = this.onkeyupHandler.bind(this)
    window.onblur = this.onblurHandler.bind(this)
    window.onmousemove = this.onmousemoveHandler.bind(this)
    window.onmouseup = this.mouseupHandler.bind(this)
    window.onmousedown = this.mousedownHandler.bind(this)
  }
}

module.exports = new Controls()
