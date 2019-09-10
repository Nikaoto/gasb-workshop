// history.js
// Manages code history with localStorage

const history = []

// Populate history from previous session
const loadedHistory = window.localStorage.getItem("workshop-history")
if (loadedHistory !== undefined && loadedHistory !== null) {
  const parsedHistory = JSON.parse(loadedHistory)
  if (parsedHistory !== undefined && parsedHistory !== null) {
    parsedHistory.forEach(c => history.push(c))
  }
}

function commitToHistory(code) {
  history.push(code)
  window.localStorage.setItem("workshop-history", JSON.stringify(history))
}

function clearHistory() {
  while (history.length > 0) {
    history.pop()
  }
  window.localStorage.removeItem("workshop-history")
}

function logHistory(indexFromLast = 0) {
  console.log(history[history.length - 1 - indexFromLast])
}

function logAllHistory() {
  history.forEach((v, i) => {
    console.log(`${i}: ${v}`)
  })
}
