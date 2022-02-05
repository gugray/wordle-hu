const t = {
  error: function(msg) {
    console.log("Error: " + msg);
    throw "Test failed.";
  }
};

if (!window.test) {
  window.test = function () {
    if (!window.tests) {
      console.log("Done: window.tests array not declared");
      return;
    }
    if (window.tests.length == 0) {
      console.log("Done: window.tests array has no functions");
      return;
    }
    for (const test of window.tests) {
      console.log("Executing: " + test.name);
      try {
        test(t);
      } catch (e) {
        console.log(e);
      }
    }
  };
}

if (!window.tests) window.tests = [];
