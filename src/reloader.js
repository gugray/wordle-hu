const lastReloadCheckKey = "lastReloadCheck";
const hashesUrl = "version.html";
const minWaitMinutes = 60;

class Reloader {
  constructor() {
    this.lastChecked = null;
    let lastCheckedStr = localStorage.getItem(lastReloadCheckKey);
    try {
      this.lastChecked = Date.parse(lastCheckedStr);
    }
    catch {}
    this.combinedHash = null
    let reHash = new RegExp("\\?v=(.+)$");

    let elmAppScript = document.getElementById("app-js");
    m = reHash.exec(elmAppScript.src);
    if (m) this.combinedHash = m[1];

    let elmLinkCss = document.getElementById("app-css");
    let m = reHash.exec(elmLinkCss.href);
    if (m && this.combinedHash != null) this.combinedHash += "\n" + m[1];

    this.checkHash();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") this.checkHash();
    });
  }

  async checkHash() {
    if (this.combinedHash == null) return;
    if (this.lastChecked != null) {
      let minutes = (new Date() - this.lastChecked) / 1000 / 60;
      if (minutes < minWaitMinutes) return;
    }
    this.lastChecked = new Date();
    localStorage.setItem(lastReloadCheckKey, this.lastChecked.toString());
    let resp = await fetch(hashesUrl, {cache: "no-store"});
    if (!resp.ok) return;
    let onlineHash = await resp.text();
    if (onlineHash.length != 65) return;
    if (onlineHash == this.combinedHash) return;
    location.reload();
  }
}

export {Reloader};
