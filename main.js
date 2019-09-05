// main.js
// requires levels.js

const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 480
const ACTION_DELAY = 120

const editor = document.querySelector("#editor")
const canvas = document.querySelector("#canvas")
const ctx = canvas.getContext("2d")

const cellWidth = 50,
      cellHeight = 50

let levelIndex = 0

let level = JSON.parse(JSON.stringify(LEVELS[levelIndex]))
let levelWon = false
const actionQueue = []

function findLocation(objString, level) {
  // Find player location, move it according to delta
  for (let x = 0; x < level.length; x++) {
    for (let y = 0; y < level[x].length; y++) {
      const ind = level[x][y].indexOf(objString)
      if (ind !== -1) {
        return { x: x, y: y }
      }
    }
  }
  return null
}

function drawEmpty(x, y, offsetX = 0, offsetY = 0) {
  ctx.clearRect(offsetX + cellWidth * x, offsetY + cellHeight * y, cellWidth, cellHeight)
  ctx.strokeStyle = "black"
  ctx.lineWidth = 2;
  ctx.strokeRect(offsetX + cellWidth * x, offsetY + cellHeight * y, cellWidth, cellHeight)
}

function drawHero(x, y, offsetX = 0, offsetY = 0) {
  ctx.font = "40px Arial"
  ctx.fillStyle = "black"
  ctx.fillText("@", offsetX + cellWidth * x + 5, offsetY + cellHeight * y + 36)
}

function drawExit(x, y, offsetX = 0, offsetY = 0) {
  ctx.font = "45px Arial"
  ctx.fillStyle = "black"
  ctx.fillText("E", offsetX + cellWidth * x + 10, offsetY + cellHeight * y + 42)
}

function drawLevel(level) {
  // Get level total size
  const rowCount = level[0].length
  const colCount = level.length
  const levelWidth = colCount * cellWidth
  const levelHeight = rowCount * cellHeight

  // Set offsets to center level in canvas
  const offsetX = Math.floor((CANVAS_WIDTH - levelWidth) / 2)
  const offsetY = Math.floor((CANVAS_HEIGHT - levelHeight) / 2)

  // Draw each cell (and queue drawing for foreground objects)
  const drawQueue = []
  for (let i = 0; i < level.length; i++) {
    for (let j = 0; j < level[i].length; j++) {
      level[i][j].forEach(obj => {
        switch (obj) {
        case "":
          drawEmpty(i, j, offsetX, offsetY)
          break
        case "@":
          drawQueue.push(() => drawHero(i, j, offsetX, offsetY))
          break
        case "E":
          drawQueue.push(() => drawExit(i, j, offsetX, offsetY))
        default:
          drawEmpty(i, j, offsetX, offsetY)
        }
      })
    }
  }

  // Draw foreground items (from queue)
  while (drawQueue.length > 0) {
    drawQueue[drawQueue.length-1]()
    drawQueue.pop()
  }
}

function update() {
  // Draw background
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  ctx.fillStyle = "#F0F0F0"
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  drawLevel(level)
}

// Player functions
function step(dir) {
  if (dir === null || dir === undefined) {
    console.error("ERROR: invalid direction")
    return;
  }

  // Determine movement delta
  let dx = 0, dy = 0
  switch (dir) {
  case "L":
  case "l":
    dx = -1
    break
  case "R":
  case "r":
    dx = 1
    break
  case "U":
  case "u":
    dy = -1
    break
  case "D":
  case "d":
    dy = 1
    break
  default:
    console.error("ERROR: invalid direction")
    return;
  }

  // Push action onto FIFO queue
  actionQueue.push((level) => {
    // Find player location
    const loc = findLocation("@", level)
    if (loc === null) {
      console.error("ERROR: player does not exist. You hacked my game!")
      return;
    }

    // Check collisions #TODO

    // Add to new position
    const newX = loc.x + dx
    const newY = loc.y + dy
    level[newX][newY].push("@")

    // Remove from old position
    level[loc.x][loc.y].splice(level[loc.x][loc.y].indexOf("@"), 1)

    update()

    // Check interactions #TODO
    const exitLoc = findLocation("E", level)
    if (exitLoc.x === newX && exitLoc.y === newY) {
      nextButton.disabled = false
      levelWon = true
    }
  })
}

function runAllActions() {
  if (actionQueue[0]) {
    // Perform first action in queue
    actionQueue[0](level)

    // Check collisions, conditions, and interacitons #TODO

    // Remove performed action from queue
    actionQueue.splice(0, 1)
    // Run next action after delay
    window.setTimeout(runAllActions, ACTION_DELAY)
  }
}

// Run button
const runButton = document.querySelector("#run-button")
runButton.addEventListener("click", () => {
  // Revert level state
  level = JSON.parse(JSON.stringify(LEVELS[levelIndex]))
  update()

  // Run code (populates action queue)
  const code = editor.value
  eval(`(function(){ ${code} })()`)

  // Run actions from action queue
  runAllActions()
})

// Next button
const nextButton = document.querySelector("#next-button")
nextButton.addEventListener("click", () => {
  if (!levelWon) {
    console.log("Nice try, cheater :D")
    return;
  }

  levelIndex += 1

  // Check if last level cleared
  if (levelIndex > LEVELS.length - 1) {
    console.log("FINISH")
    return;
  }

  // Load next level
  level = JSON.parse(JSON.stringify(LEVELS[levelIndex]))
  nextButton.disabled = true
  levelWon = false
  update()
})

// Reset button
const resetButton = document.querySelector("#reset-button")
resetButton.addEventListener("click", () => {
  // Revert level state
  nextButton.disabled = true
  levelWon = false
  level = JSON.parse(JSON.stringify(LEVELS[levelIndex]))
  update()
})

update()
