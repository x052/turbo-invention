class UI {
  constructor (Game) {
    this.boundSpawn = null
  }

  getElement (query) {
    return document.getElementById(query)
  }

  getElements (query) {
    return document.getElementsByClassName(query)
  }

  hideUi () {
    this.getElement('menuContainer').style.display = 'none'
    this.getElement('gameUiContainer').style.display = 'block'
  }

  showUi () {
    this.getElement('menuContainer').style.display = 'flex'
    this.getElement('gameUiContainer').style.display = 'none'
  }

  stripTags (string) {
    var lt = /</g
    var gt = />/g
    var ap = /'/g
    var ic = /"/g
    return string.toString().replace(lt, '&lt;').replace(gt, '&gt;').replace(ap, '&#39;').replace(ic, '&#34;')
  }

  leaderBoardUpdate (data) {
    let htmlString = ''

    for (let index = 0; index < data.length; index++) {
      const user = data[index]
      const isMyself = false
      const color = ''

      htmlString += "<div class='leaderboardItem'><div style='display:inline-block;float:left;' class='whiteText'>" + (index + 1) + ".</div> <div class='" + (isMyself ? 'leaderYou' : 'leader') + "' style='" + color + "'>" + this.stripTags(user['name']) + "</div><div class='leaderboardLapsNum'>" + user['score'] + '</div></div>'
    }

    this.getElement('leaderboardList').innerHTML = htmlString
  }

  toggleAdblocker (isBlockingAds) {
    if (isBlockingAds) {
      this.getElement('adblockerContainer').style.display = ''
    } else {
      this.getElement('adblockerContainer').style.display = 'none'
    }
  }

  spawn () {
    this.boundSpawn(this.getElement('userNameInput').value)
    this.hideUi()
  }
}

module.exports = UI
