class Styles {
  constructor () {
    this.lerp = 0.9

    this.Ships = [
      '#a04141', '#ce8631', '#9ec654', '#74a5cb', '#c96c9e', // http://www.color-hex.com/color-palette/36665
      '#1692f4', '#7cee35', '#d66cff' // http://www.color-hex.com/color-palette/22807
    ]
    this.Rocks = {
      Stone: ['#454545', '#3e352a', '#747474', '#241919', '#514a38'] // http://www.color-hex.com/color-palette/30872
    }

    this.Bullets = [ // http://www.color-hex.com/color-palette/36715
      '#bddbaa', '#80d0e1', '#972898', '#cb55cd', '#9eed24'
    ]

    this.background = '#242a31'
    this.debugTextColour = '#F0F8FF'
    this.tileColour = '#bcd2d0'
    this.tileWidth = 0.5
    this.tileSize = 40

    this.borderLineWidth = 15
    this.borderLineColour = '#d42036'
    this.outerBorderLineWidth = 1500
    this.outerBorderLineColour = this.background

    this.healthScale = 3.5
    this.healthLineWidth = 6
    this.healthDamage = '#e44424' // http://www.color-hex.com/color-palette/2546
    this.healthGreen = '#40bf00' // http://www.color-hex.com/color-palette/2546

    this.shipLineWidth = 7
    this.shipShadeColor = 0.3

    this.rockShadeColor = 0.3
    this.rockLineWidth = 7
  }

  shadeColor (color, percent) {
    let f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = f >> 16, G = f >> 8 & 0x00FF, B = f & 0x0000FF
    return '#' + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + (Math.round((t - B) * p) + B)).toString(16).slice(1)
  }
}

module.exports = new Styles()
