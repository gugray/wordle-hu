
const DisplayMode = {
  Light: "light",
  Dark: "dark",
};

const ColorScheme = {
  RedGreen: "red-green",
  BlueOrange: "blue-orange",
}

class Settings {

  constructor() {

    this.displayMode = DisplayMode.Light;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      this.displayMode = DisplayMode.Dark;

    this.colorScheme = ColorScheme.RedGreen;

    this.stgs = {};
    let stgsStored = localStorage.getItem("settings");
    if (stgsStored) {
      this.stgs = JSON.parse(stgsStored);
      if (this.stgs.displayMode) this.displayMode = this.stgs.displayMode;
      if (this.stgs.colorScheme) this.colorScheme = this.stgs.colorScheme;
    }
  }

  saveStgs() {
    localStorage.setItem("settings", JSON.stringify(this.stgs));
  }

  getDisplayMode() {
    return this.displayMode;
  }

  getColorScheme() {
    return this.colorScheme;
  }

  setDisplayMode(displayMode) {
    this.displayMode = displayMode;
    this.stgs.displayMode = displayMode;
    this.saveStgs();
  }

  setColorScheme(colorScheme) {
    this.colorScheme = colorScheme;
    this.stgs.colorScheme = colorScheme;
    this.saveStgs();
  }
}

export {DisplayMode, ColorScheme, Settings};
