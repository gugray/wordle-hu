import {DisplayMode, ColorScheme, Settings} from "./settings.js";
import {Reloader} from "./reloader.js";
import {LetterState, LetterInfo, Gamestate} from "./gamestate.js";
import {History} from "./history.js";
import {Warning} from "./warning.js";
import {Keyboard} from "./keyboard.js";
import {Grid} from  "./grid.js";
import {Words} from "./words.js";
import confetti from "canvas-confetti";

let theReloader = new Reloader();
let theSettings = new Settings();
let theWords;
let theHistory;
let theApp;

setDarkLightClass();

document.addEventListener('DOMContentLoaded', () => {

  let timeVal = new Date().getTime();
  if (timeVal % 10 == 0)
    plausible("szofejto");

  theWords = new Words();
  theHistory = new History(theWords);
  theApp = new App(false);
});

// OK Save hashes and trigger reload
// OK Sampled analytics thru Plausible event
// OK Text: nothing collected
// Counter on new day: "quiz ready"?
// Repeating letters fix

const T = {
  title: "Szó reggelt! Napi szófejtő.",
  tooFewLetters: "Kevés betű",
  unknownWord: "Ismeretlen szó\n(Vagy ragozott alak? Tulajdonnév?)",
  puzzleSuccess: "A ${day}. napi rejtvényt megfejtetted!",
  puzzleFail: "A ${day}. napi rejtvény kifogott rajtad.",
  shareClipboard: "Az eredmény a vágólapon!",
  shareText: "Szó reggelt!\n{day}. napi fejtés: 6/{guesses}\n\n",
}

class App {
  constructor(testing) {
    this.gamestate = null;
    if (testing) this.initForTest();
    else this.initFromHistory();

    this.warning = new Warning(document.getElementsByTagName("aside")[0]);
    this.keyboard = new Keyboard(document.getElementById("keyboard"), this.gamestate);
    this.grid = new Grid(document.getElementById("grid"), this.gamestate);
    this.keyboard.onLetter(e => this.onLetter(e));
    this.keyboard.onBack(e => this.onBack());
    this.keyboard.onEnter(e => this.onEnter());
    this.gamestate.onGamestateChanged(() => this.onGamestateChanged());

    this.initPopup();
    this.initShare();
    this.initSettings();

    if (this.gamestate.isFinished()) this.showStatus();
    else if (!theHistory.hasPlayed()) this.showInfo();
  }

  initPopup() {
    let elmPopup = document.getElementsByTagName("article")[0];
    document.getElementById("showInfo").addEventListener("click", () => {
      this.showInfo();
    });
    document.getElementById("showSettings").addEventListener("click", () => {
      this.showSettings();
    });
    if (this.gamestate.isFinished()) {
      document.getElementById("showStatus").classList.add("visible");
    }
    document.getElementById("showStatus").addEventListener("click", () => {
      if (!this.gamestate.isFinished()) return;
      this.showStatus();
    });
    elmPopup.addEventListener("click", (e) => {
      if (e.target.tagName != "BUTTON" || !e.target.classList.contains("close")) return;
      this.closePopup();
    });
  }

  closePopup() {
    let elmPopup = document.getElementsByTagName("article")[0];
    let elmSections = elmPopup.querySelectorAll("section");
    elmSections.forEach(elm => elm.classList.remove("visible"));
    elmPopup.classList.remove("visible");
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }
  }

  initShare() {
    document.getElementById("shareGeneral").addEventListener("click", () => {
      let msg = T.shareText;
      msg = msg.replace("{day}", this.gamestate.dayIx);
      if (this.gamestate.isSolved())
        msg = msg.replace("{guesses}", this.gamestate.finishedRows);
      else msg = msg.replace("{guesses}", "X");
      let darkMode = theSettings.displayMode == DisplayMode.Dark;
      let constrastColors = theSettings.colorScheme == ColorScheme.BlueOrange;
      msg += this.gamestate.getShareText(darkMode, constrastColors);
      if (navigator.share) {
        navigator.share({
          title: T.title,
          text: msg,
        }).then(() => {}).catch();
      } else {
        navigator.clipboard.writeText(msg);
        this.warning.show(T.shareClipboard);
      }
    });
  }

  initSettings() {

    let elmDLSetting = document.getElementById("darkLightSetting");
    if (theSettings.getDisplayMode() == DisplayMode.Dark)
      elmDLSetting.classList.add("darkMode");
    else
      elmDLSetting.classList.add("lightMode");
    elmDLSetting.addEventListener("click", () => {
      if (elmDLSetting.classList.contains("darkMode")) {
        elmDLSetting.classList.remove("darkMode");
        elmDLSetting.classList.add("lightMode");
        theSettings.setDisplayMode(DisplayMode.Light);
        setDarkLightClass();
      }
      else {
        elmDLSetting.classList.remove("lightMode");
        elmDLSetting.classList.add("darkMode");
        theSettings.setDisplayMode(DisplayMode.Dark);
        setDarkLightClass();
      }
    });

    let elmCSSetting = document.getElementById("colorSchemeSetting");
    if (theSettings.getColorScheme() == ColorScheme.RedGreen) {
      elmCSSetting.querySelector("#colorsRedGreen").checked = true;
    }
    else {
      elmCSSetting.querySelector("#colorsBlueOrange").checked = true;
      document.documentElement.classList.add("contrast");
    }
    let radios = elmCSSetting.querySelectorAll("input[type=radio]");
    radios.forEach(radio => radio.addEventListener('change', (e) => {
      if (elmCSSetting.querySelector("#colorsRedGreen").checked) {
        document.documentElement.classList.remove("contrast");
        theSettings.setColorScheme(ColorScheme.RedGreen);
      }
      else {
        document.documentElement.classList.add("contrast");
        theSettings.setColorScheme(ColorScheme.BlueOrange);
      }
    }));

  }

  showSettings() {
    this.closePopup();
    let elmPopup = document.getElementsByTagName("article")[0];
    elmPopup.querySelector("#settingsPopup").classList.add("visible");
    elmPopup.classList.add("visible");
  }

  showInfo() {

    this.closePopup();
    let elmPopup = document.getElementsByTagName("article")[0];

    // Update version from hash in script URL
    let infoStr = "dbdb";
    let elmAppScript = document.getElementById("app-js");
    let reHash = new RegExp("\\?v=(.{4})");
    let m = reHash.exec(elmAppScript.src);
    if (m) infoStr = m[1];
    infoStr = "#" + this.gamestate.dayIx + " " + infoStr;
    elmPopup.querySelector("#info").innerText = infoStr;

    elmPopup.querySelector("#infoPopup").classList.add("visible");
    elmPopup.classList.add("visible");
  }

  showStatus() {

    this.closePopup();
    let elmPopup = document.getElementsByTagName("article")[0];

    let elmStatusMsg = document.getElementById("statusMsg");
    let elmTimeLeft = document.getElementById("timeLeft");
    let dayIx = this.gamestate.dayIx;
    let msg = this.gamestate.isSolved()
      ? T.puzzleSuccess.replace("${day}", dayIx)
      : T.puzzleFail.replace("${day}", dayIx)
    elmStatusMsg.innerText = msg;
    elmPopup.querySelector("#statusPopup").classList.add("visible");
    elmPopup.classList.add("visible");

    let darkMode = theSettings.displayMode == DisplayMode.Dark;
    let constrastColors = theSettings.colorScheme == ColorScheme.BlueOrange;
    elmPopup.querySelector("#sharePreview").innerHTML =
      "<span>" + this.gamestate.getShareText(darkMode, constrastColors) + "</span>";

    let nextDate = theHistory.nextGameDate();
    updateCounter();
    this.countdownIntervalId = setInterval(updateCounter, 50);

    function updateCounter() {
      let dateNow = new Date();
      let seconds = Math.floor((nextDate - (dateNow)) / 1000);
      let minutes = Math.floor(seconds / 60);
      let hours = Math.floor(minutes / 60);
      let days = Math.floor(hours / 24);
      hours = hours - (days * 24);
      minutes = minutes - (days * 24 * 60) - (hours * 60);
      seconds = seconds - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60);
      hours = String(hours).padStart(2, "0");
      minutes = String(minutes).padStart(2, "0");
      seconds = String(seconds).padStart(2, "0");
      elmTimeLeft.innerText = `${hours}​:${minutes}​:${seconds}`;
    }
  }

  onGamestateChanged() {
    this.keyboard.updateView();
    this.grid.updateView();
    theHistory.save();
  }

  onEnter() {
    let activeWord = this.gamestate.getActiveWord();
    if (activeWord == null) return;
    if (activeWord.length < 5) {
      this.warning.show(T.tooFewLetters);
      return;
    }
    if (!theWords.isAcceptableWord(activeWord)) {
      this.warning.show(T.unknownWord);
      return;
    }
    this.gamestate.commitWord();
    if (!this.gamestate.isFinished()) return;
    // Game just finished now
    if (this.gamestate.isSolved()) {
      setTimeout(doConfetti, 600);
    } else {
      this.warning.show(this.gamestate.solution.toUpperCase());
    }
    setTimeout(() => {
      document.getElementById("showStatus").classList.add("visible");
      this.showStatus();
    }, 2000);
  }

  onBack() {
    let activeWord = this.gamestate.getActiveWord();
    if (activeWord == null) return;
    if (activeWord.length == 0) return;
    this.gamestate.removeLetter();
  }

  onLetter(e) {
    let activeWord = this.gamestate.getActiveWord();
    if (activeWord == null) return;
    if (activeWord.length >= 5) return;
    this.gamestate.addLetter(e.detail);
  }

  initForTest() {
    let dayIx = theHistory.dayIndex();
    this.gamestate = new Gamestate(dayIx, theWords.getPuzzleWord(dayIx));
    // this.gamestate.rows[0] = "karéj";
    // this.gamestate.rows.push("habar");
    // this.gamestate.rows.push("lehet");
    // this.gamestate.rows.push("telex");
    // this.gamestate.rows.push("butus");
    // this.gamestate.rows.push("boto");
    // this.gamestate.finishedRows = 5;
  }

  initFromHistory() {
    this.gamestate = theHistory.currentGame();
  }
}

function doConfetti() {
  confetti();
  setTimeout(() => {
    confetti();
  }, 800);
}

function setDarkLightClass() {
  if (theSettings.getDisplayMode() == DisplayMode.Dark) {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  }
}

