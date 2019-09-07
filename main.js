// main.js
// requires history.js
// requires levels.js
// requires items.js

const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 480
const ACTION_DELAY = 120
const REDRAW_DELAY = 120
const CELL_WIDTH = 30
const CELL_HEIGHT = 30

const levelTitleHeader = document.querySelector("#level-title")

const editor = document.querySelector("#editor")
const canvas = document.querySelector("#canvas")
const ctx = canvas.getContext("2d")

let levelIndex = 5 // #TODO change
let level = JSON.parse(JSON.stringify(LEVELS[levelIndex]))
let levelWon = false
let levelFinished = false // For student API

const updateQueue = []
const actionQueue = []
let evalEagerly = false

let heldItem = null


// Student API
Array.prototype.remove = function(i) {
  this.splice(i, 1)
}

// Student API
Array.prototype.insert = function(i, item) {
  this.splice(i, 0, item)
}

// Student API
function randomChoice(list) {
  if (list === null || list === undefined) {
    console.error(`ERROR: randomChoice argument is null`)
    return null;
  }

  if (!Array.isArray(list)) {
    console.error(`ERROR: randomChoice argument is not an array`)
    return null;
  }

  return list[Math.floor(list.length * Math.random())]
}

// Student API
function removeObject(objString, x, y, lvl = level) {
  if (lvl[x][y].includes(objString)) {
    lvl[x][y].splice(lvl[x][y].indexOf(objString), 1)
  } else {
    console.error(`WARNING: can not removeObject("${objString}", ${x}, ${y}),
the object does not exist at position`)
  }
}

function findLocation(objString, grid) {
  // Reference level if grid not passed (for student API)
  if (grid === undefined || grid === null) {
    grid = level
  }

  // Find player location, move it according to delta
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[x].length; y++) {
      const ind = grid[x][y].indexOf(objString)
      if (ind !== -1) {
        return { x: x, y: y }
      }
    }
  }
  return null
}

function drawEmpty(x, y, offsetX = 0, offsetY = 0) {
  ctx.clearRect(offsetX + CELL_WIDTH * x, offsetY + CELL_HEIGHT * y, CELL_WIDTH, CELL_HEIGHT)
  ctx.strokeStyle = "black"
  ctx.lineWidth = 2;
  ctx.strokeRect(offsetX + CELL_WIDTH * x, offsetY + CELL_HEIGHT * y, CELL_WIDTH, CELL_HEIGHT)
}

function drawBlock(x, y, offsetX = 0, offsetY = 0) {
  ctx.fillStyle = "brown"
  ctx.fillRect(offsetX + CELL_WIDTH * x + 2, offsetY + CELL_HEIGHT * y + 2, CELL_WIDTH - 4, CELL_HEIGHT - 4)
}

function drawDoor(x, y, offsetX = 0, offsetY = 0) {
  ctx.font = "25px Arial"
  ctx.fillStyle = "black"
  ctx.fillText("D", offsetX + CELL_WIDTH * x + 5, offsetY + CELL_HEIGHT * y + 25)
}

function drawHero(x, y, offsetX = 0, offsetY = 0) {
  // Draw dim background
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)"
  ctx.fillRect(offsetX + CELL_WIDTH * x + 5, offsetY + CELL_HEIGHT * y + 5, CELL_WIDTH - 10, CELL_HEIGHT - 10)
  // Draw character
  ctx.font = "25px Arial"
  ctx.fillStyle = "black"
  ctx.fillText("@", offsetX + CELL_WIDTH * x + 3, offsetY + CELL_HEIGHT * y + 22)
  // Draw held item
  const itemOffsetX = offsetX + Math.floor(CELL_WIDTH/3)
  const itemOffsetY = offsetY + Math.floor(CELL_HEIGHT/3)
  switch (heldItem) {
  case null:
    break;
  case "@":
    drawHero(x, y, itemOffsetX, itemOffsetY)
    break;
  case "E":
    drawExit(x, y, itemOffsetX, itemOffsetY)
    break;
  case "K":
    drawKey(x, y, itemOffsetX, itemOffsetY)
    break;
  default:
    break;
  }
}

function drawExit(x, y, offsetX = 0, offsetY = 0) {
  ctx.font = "25px Arial"
  ctx.fillStyle = "black"
  ctx.fillText("E", offsetX + CELL_WIDTH * x + 5, offsetY + CELL_HEIGHT * y + 25)
}

function drawKey(x, y, offsetX = 0, offsetY = 0) {
  ctx.font = "25px Arial"
  ctx.fillStyle = "black"
  ctx.fillText("K", offsetX + CELL_WIDTH * x + 5, offsetY + CELL_HEIGHT * y + 25)
}

function drawLevel(level) {
  // Get level total size
  const rowCount = level[0].length
  const colCount = level.length
  const levelWidth = colCount * CELL_WIDTH
  const levelHeight = rowCount * CELL_HEIGHT

  // Set offsets to center level in canvas
  const offsetX = Math.floor((CANVAS_WIDTH - levelWidth) / 2)
  const offsetY = Math.floor((CANVAS_HEIGHT - levelHeight) / 2)

  // Draw each cell (and queue drawing for foreground objects)
  const drawQueue = []
  for (let i = 0; i < level.length; i++) {
    for (let j = 0; j < level[i].length; j++) {
      level[i][j].forEach(obj => {
        switch(obj) {
        case "":
          drawEmpty(i, j, offsetX, offsetY)
          break;
        case "#":
          drawBlock(i, j, offsetX, offsetY)
          break;
        case "D":
          drawDoor(i, j, offsetX, offsetY)
          break;
        case "@":
          drawQueue.push(() => drawHero(i, j, offsetX, offsetY))
          break;
        case "E":
          drawQueue.push(() => drawExit(i, j, offsetX, offsetY))
          break;
        case "K":
          drawQueue.push(() => drawKey(i, j, offsetX, offsetY))
          break;
        default:
          drawEmpty(i, j, offsetX, offsetY)
          break;
        }
      })
    }
  }

  // Draw foreground items (from queue)
  while (drawQueue.length > 0) {
    drawQueue[0]()
    drawQueue.splice(0, 1)
  }
}

function redraw(level) {
  const capturedLevel = JSON.parse(JSON.stringify(level));
  (function(capturedLevel){
    updateQueue.push(() => {
      // Draw background
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = "#F0F0F0"
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      drawLevel(capturedLevel)
    })
  }(capturedLevel))
}

function runAllActions() {
  if (actionQueue[0]) {
    // Perform first action in queue
    actionQueue[0](level)
    // Remove performed action from queue
    actionQueue.splice(0, 1)
    // Run next action after delay
    window.setTimeout(runAllActions, ACTION_DELAY)
  }
}

function step(dir) {
  if (dir === null || dir === undefined) {
    console.error(`WARNING: invalid direction "${dir}"`)
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
    console.error(`WARNING: invalid direction "${dir}"`)
    return;
  }

  const action = (level) => {
    // Find player location
    const loc = findLocation("@", level)
    if (loc === null) {
      console.error("ERROR: player does not exist. You hacked my game!")
      return;
    }

    // Calc new position
    const newX = loc.x + dx
    const newY = loc.y + dy

    // Check level edge collisions (AABB)
    const rowCount = level[0].length
    const colCount = level.length
    if (newX < 0 || newX > colCount - 1 ||
        newY < 0 || newY > rowCount - 1) {
      console.error(`WARNING: Can not step("${dir}"), already at edge`)
      redraw(level)
      return;
    }

    // Check block collision
    if (level[newX][newY].includes("#")) {
      console.error(`WARNING: Can not step("${dir}"), blocked by wall`)
      redraw(level)
      return;
    }

    // Check door collision
    if (level[newX][newY].includes("D")) {
      console.error(`WARNING: Can not step("${dir}"), blocked by door`)
      redraw(level)
      return;
    }

    // Add to new position
    level[newX][newY].push("@")

    // Remove from old position
    level[loc.x][loc.y].splice(level[loc.x][loc.y].indexOf("@"), 1)

    // Check interactions #TODO
    const exitLoc = findLocation("E", level)
    if (exitLoc.x === newX && exitLoc.y === newY) {
      nextButton.disabled = false
      levelWon = true
      levelFinished = true
    }

    redraw(level)
  }

  if (evalEagerly) {
    action(level)
  } else {
    actionQueue.push(action)
  }
}

function take() {
  // Push action onto FIFO queue
  actionQueue.push(level => {
    // Find player location
    const loc = findLocation("@", level)
    if (loc === null) {
      console.error("ERROR: player does not exist. You hacked my game!")
      return;
    }

    // Check if items can be taken
    const takeableItems = Object.keys(ITEMS.TAKEABLE)
    let nothingToTake = true
    for (let i = 0; i < level[loc.x][loc.y].length; i++) {
      if (takeableItems.includes(level[loc.x][loc.y][i])) {
        nothingToTake = false
        // Hold item
        heldItem = level[loc.x][loc.y][i]
        // Remove item from level
        level[loc.x][loc.y].splice(i, 1)
        redraw(level)
        break;
      }
    }

    if (nothingToTake) {
      console.error("WARNING: Nothing to take()")
      return;
    }
  })
}

function put() {
  // Push action obto FIFO queue
  actionQueue.push(level => {
    if (heldItem === null) {
      console.error("WARNING: nothing to put()")
        return;
    }

    // Find player location
    const loc = findLocation("@", level)
    if (loc === null) {
      console.error("ERROR: player does not exist. You hacked my game!")
      return;
    }

    // Place item on level at player location
    level[loc.x][loc.y].push(heldItem)

    // Check item interactions
    if (heldItem === "K") {
      const colCount = level.length
      const rowCount = level[0].length

      // Remove door and key from level if key placed near a door
      if (level[loc.x][loc.y].includes("D")) {
        removeObject("D", loc.x, loc.y, level)
        removeObject("K", loc.x, loc.y, level)
      } else if (loc.y > 0 && level[loc.x][loc.y-1].includes("D")) {
        // Up
        removeObject("D", loc.x, loc.y - 1, level)
        removeObject("K", loc.x, loc.y, level)
      } else if (loc.y < rowCount - 1 && level[loc.x][loc.y+1].includes("D")) {
        // Down
        removeObject("D", loc.x, loc.y + 1, level)
        removeObject("K", loc.x, loc.y, level)
      } else if (loc.x > 0 && level[loc.x-1][loc.y].includes("D")) {
        // Left
        removeObject("D", loc.x - 1, loc.y, level)
        removeObject("K", loc.x, loc.y, level)
      } else if (loc.x < colCount - 1 && level[loc.x+1][loc.y].includes("D")) {
        // Right
        removeObject("D", loc.x + 1, loc.y, level)
        removeObject("K", loc.x, loc.y, level)
      }
    }

    heldItem = null
    redraw(level)
  })
}

function check(dir) { // #TODO
}

// Run button
const runButton = document.querySelector("#run-button")
runButton.addEventListener("click", () => {
  // Revert level state
  level = JSON.parse(JSON.stringify(LEVELS[levelIndex]))
  nextButton.disabled = true
  heldItem = null
  levelWon = false
  levelFinished = false
  redraw(level)

  // Pefrorm all other actions after delay so the players get to see the initial
  // state of the level on re-runs (also helps sync take() and put() visual indicators)
  window.setTimeout(() => {
    // Extract code
    const code = editor.value
    // Commit code to history
    commitToHistory(code)
    // Determine eval type (lazy/eager)
    if (code.toLowerCase().includes("while"))
      evalEagerly = true
    else
      evalEagerly = false
    // Run code with IIFE to avoid potential scope bugs
    eval(`(function(){ ${code} })()`)

    // Run actions from action queue
    runAllActions()

    redraw(level)
  }, ACTION_DELAY)
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
  heldItem = null
  levelWon = false
  levelFinished = false
  redraw(level)

  // Update level text
  levelTitleHeader.textContent = `Level ${levelIndex}`
})

// Reset button
const resetButton = document.querySelector("#reset-button")
resetButton.addEventListener("click", () => {
  // Revert level state
  nextButton.disabled = true
  levelWon = false
  levelFinished = false
  heldItem = null
  level = JSON.parse(JSON.stringify(LEVELS[levelIndex]))
  redraw(level)
})

redraw(level)

// Start updating graphics every "frame"
window.setInterval(() => {
  if (updateQueue[0]) {
    updateQueue[0]()
    updateQueue.splice(0, 1)
  }
}, REDRAW_DELAY)
