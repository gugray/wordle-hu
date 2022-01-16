import {LetterState, LetterInfo, Gamestate} from "./gamestate.js";

class Grid {
  constructor(elm, gamestate) {
    this.elm = elm;
    this.gamestate = gamestate;
    this.updateView();
    this.updateLayout();
    window.addEventListener("resize", () => this.updateLayout());
  }

  updateLayout() {
    let height = this.elm.offsetHeight;
    let vpad = 4; // Padding at top and bottom, above and below grid
    let tileSpacing = height < 300 ? 2 : 4;
    this.elm.style.paddingTop = (vpad - tileSpacing) + "px";
    this.elm.style.paddingBottom = 2 * vpad + "px";
    let elmRows = this.elm.querySelectorAll(".row");
    for (const elmRow of elmRows) {
      elmRow.style.padding = tileSpacing + "px";
    }
    let elmTiles = this.elm.querySelectorAll(".tile");
    let tileSize = height / 5 - 2 * vpad;
    if (tileSize > elmTiles[0].offsetHeight)tileSize = elmTiles[0].offsetHeight
    for (const elmTile of elmTiles) {
      elmTile.style.width = tileSize + "px";
      elmTile.style.fontSize = Math.floor(elmTile.offsetHeight * 0.6) + "px";
      elmTile.style.marginLeft = tileSpacing + "px";
      elmTile.style.marginRight = tileSpacing + "px";
    }
    this.elm.style.visibility = "visible";
  }

  updateView() {
    let elmRows = this.elm.querySelectorAll(".row");
    for (let rowIx = 0; rowIx < elmRows.length; ++rowIx) {
      let elmKeys = elmRows[rowIx].children;
      let fr = null;
      if (rowIx < this.gamestate.finishedRows)
        fr = this.gamestate.getFinishedRow(rowIx);
      for (let colIx = 0; colIx < elmKeys.length; ++colIx) {
        let elmKey = elmKeys[colIx];
        elmKey.classList.remove("hit", "miss", "near", "filled");
        elmKey.innerHTML = "<span>&nbsp;</span>";
        if (rowIx >= this.gamestate.rows.length) continue;
        if (fr == null && colIx < this.gamestate.rows[rowIx].length) {
          elmKey.innerHTML = "<span>" + this.gamestate.rows[rowIx][colIx] + "</span>";
          elmKey.classList.add("filled");
          continue;
        }
        else if (fr != null) {
          elmKey.innerHTML = "<span>" + fr[colIx].letter + "</span>";
          if (fr[colIx].state == LetterState.RightPlace) elmKey.classList.add("hit");
          else if (fr[colIx].state == LetterState.WrongPlace) elmKey.classList.add("near");
          else if (fr[colIx].state == LetterState.WrongLetter) elmKey.classList.add("miss");
        }
      }
    }
  }
}

export {Grid};

