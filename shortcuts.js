// shortcuts.js
// requires main.js
// Listen for and manage shortcuts

const keysDown = {};
const SHORTCUTS = {
  resetLevel: {
    keys: ["alt", "l"],
    action: function() {
      resetClick();
    },
  },
  runCode: {
    keys: ["control", "enter"],
    action: function() {
      runCodeClick();
    },
  }
}; 

function arrsEqual(a, b) {
  if (a.length != b.length) return false;

  for (let i in a) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

window.addEventListener("keydown", (ev) => {
  keysDown[ev.key.toLowerCase()] = 1;
 
  const keysDownArr = Object.keys(keysDown);
  Object.keys(SHORTCUTS).forEach(k => {
    if (arrsEqual(SHORTCUTS[k].keys, keysDownArr))
      SHORTCUTS[k].action();
  })
});

window.addEventListener("keyup", (ev) => {
  delete keysDown[ev.key.toLowerCase()];
});
