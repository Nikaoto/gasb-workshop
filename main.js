// main.js
// requires history.js
// requires levels.js
// requires items.js

const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 480
const ACTION_DELAY = 150
const REDRAW_DELAY = 120
const CELL_WIDTH = 35
const CELL_HEIGHT = 35

const levelTitleHeader = document.querySelector("#level-title")

const editor = document.querySelector("#editor")
const canvas = document.querySelector("#canvas")
const ctx = canvas.getContext("2d")
ctx.imageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;

let levelIndex = 0
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
function removeObject(objString, x, y) {
  if (level[x][y].includes(objString)) {
    level[x][y].splice(level[x][y].indexOf(objString), 1)
    redraw(level)
  } else {
    console.error(`WARNING: can not removeObject("${objString}", ${x}, ${y}),
the object does not exist at position`)
  }
}

function findLocation(objString, grid) {
  // Reference level if grid not passed (for student API)
  if (!grid) {
    grid = level
  }

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

function findAllLocations(objString, grid, excludedLocation) {
  // Reference level if grid not passed (for student API)
  if (!grid) {
    grid = level
  }

  const locations = []
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[x].length; y++) {
      const ind = grid[x][y].indexOf(objString)
      if (ind !== -1) {
        // Add location if not excluded
        if (!(excludedLocation && excludedLocation.x == x && excludedLocation.y == y)) {
          locations.push({ x: x, y: y })
        }
      }
    }
  }

  return locations
}

function removeObjectDev(objString, x, y, lvl = level) {
  if (lvl[x][y].includes(objString)) {
    lvl[x][y].splice(lvl[x][y].indexOf(objString), 1)
  } else {
    console.error(`WARNING: can not removeObject("${objString}", ${x}, ${y}),
the object does not exist at position`)
  }
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
  // Draw character
  const doorWidth = Math.ceil(CELL_WIDTH * 0.7)
  const doorHeight = Math.ceil(CELL_HEIGHT * 0.82)
  ctx.drawImage(
    doorImage,
    offsetX + x * CELL_WIDTH + Math.floor((CELL_WIDTH - doorWidth) / 2),
    offsetY + y * CELL_HEIGHT + Math.floor((CELL_HEIGHT - doorHeight) / 2),
    doorWidth,
    doorHeight
  )

  // Old style
  // ctx.font = "25px Arial"
  // ctx.fillStyle = "black"
  // ctx.fillText("D", offsetX + CELL_WIDTH * x + 5, offsetY + CELL_HEIGHT * y + 25)
}

function drawPortal(x, y, offsetX = 0, offsetY = 0) {
  // Draw character
  const portalWidth = Math.ceil(CELL_WIDTH * 0.7)
  const portalHeight = Math.ceil(CELL_HEIGHT * 0.82)
  ctx.drawImage(
    portalImage,
    offsetX + x * CELL_WIDTH + Math.floor((CELL_WIDTH - portalWidth) / 2),
    offsetY + y * CELL_HEIGHT + Math.floor((CELL_HEIGHT - portalHeight) / 2),
    portalWidth,
    portalHeight
  )

  // Old style
  // ctx.font = "25px Arial"
  // ctx.fillStyle = "black"
  // ctx.fillText("P", offsetX + CELL_WIDTH * x + 5, offsetY + CELL_HEIGHT * y + 25)
}

function drawHero(x, y, offsetX = 0, offsetY = 0) {
  // Draw character
  const heroWidth = Math.ceil(CELL_WIDTH * 0.8)
  const heroHeight = Math.ceil(CELL_HEIGHT * 0.82)
  ctx.drawImage(
    heroImage,
    offsetX + x * CELL_WIDTH + Math.floor((CELL_WIDTH - heroWidth) / 2),
    offsetY + y * CELL_HEIGHT + Math.floor((CELL_HEIGHT - heroHeight) / 2),
    heroWidth,
    heroHeight
  )

  // Old style
  // ctx.font = "25px Arial"
  // ctx.fillStyle = "black"
  // ctx.fillText("@", offsetX + CELL_WIDTH * x + 3, offsetY + CELL_HEIGHT * y + 22)

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
  const padding = 3
  ctx.drawImage(
    exitImage,
    19, 21,
    12, 10,
    x * CELL_WIDTH + offsetX + padding,
    y * CELL_HEIGHT + offsetY + padding,
    CELL_WIDTH - padding * 2,
    CELL_HEIGHT - padding * 2)

  // Old style
  // ctx.font = "25px Arial"
  // ctx.fillStyle = "black"
  // ctx.fillText("E", offsetX + CELL_WIDTH * x + 5, offsetY + CELL_HEIGHT * y + 25)
}

function drawKey(x, y, offsetX = 0, offsetY = 0) {
  const keyWidth = Math.ceil(CELL_WIDTH * 0.82)
  const keyHeight = Math.ceil(CELL_WIDTH * 0.45)
  ctx.drawImage(
    keyImage,
    offsetX + CELL_WIDTH * x + Math.floor((CELL_WIDTH - keyWidth) / 2),
    offsetY + CELL_HEIGHT * y +  Math.floor((CELL_HEIGHT - keyHeight) / 2),
    keyWidth,
    keyHeight
  )

  // Old style
  // ctx.font = "25px Arial"
  // ctx.fillStyle = "black"
  // ctx.fillText("K", offsetX + CELL_WIDTH * x + 5, offsetY + CELL_HEIGHT * y + 25)
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
          if (obj.match(/P(\d+)?/)) {
            drawPortal(i, j, offsetX, offsetY)
          } else {
            drawEmpty(i, j, offsetX, offsetY)
          }
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

// Copy and rotate matrix by pi/2 counterclockwise
function rotateMatrix(m) {
  const ret = []
  for (let x = m[0].length - 1; x >= 0 ; x--) {
    const row = []
    for (let y = 0; y < m.length; y++) {
      row.push(m[y][x])
    }
    ret.push(row)
  }
  return ret
}

// Copy and flip matrix along x axis (x axis is the skewer)
function flipMatrix(m) {
  const ret = []
  for (let i = m.length - 1; i >= 0; i--) {
    ret.push(m[i])
  }
  return ret
}

// Student API
function injectLevel(newLevel) {
  const level3d = newLevel.map(row =>
    row.map(obj => (obj === "" || obj === " ") ? [obj] : ["", obj]))
  const rotated = rotateMatrix(level3d)
  const final = flipMatrix(rotated)
  let finalLevel = flipMatrix(rotateMatrix(level3d))
  LEVELS[levelIndex] = JSON.parse(JSON.stringify(finalLevel))
  level = JSON.parse(JSON.stringify(LEVELS[levelIndex]))
  redraw(level)
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

// Teleports the player to target location
function teleport(targetX, targetY) {
  if (!level[targetX] || !level[targetX][targetY]) {
    console.error(`WARNING: can't teleport(${targetX}, ${targetY}), invalid target location`)
    return;
  }

  const loc = findLocation("@", level)
  removeObjectDev("@", loc.x, loc.y)
  level[targetX][targetY].push("@")

  // Check exit interaction
  if (level[targetX][targetY].includes("E")) {
    nextButton.disabled = false
    levelWon = true
    levelFinished = true
  }

  redraw(level)
}

function runAllActions(callback) {
  if (actionQueue[0]) {
    // Perform first action in queue
    actionQueue[0](level)
    // Remove performed action from queue
    actionQueue.splice(0, 1)

    // Teleport hero if it occupies same place as portal
    const loc = findLocation("@", level)
    for (let obj of level[loc.x][loc.y]) {
      if (obj.match(/P(\d+)?/)) {
        const otherLocations = findAllLocations(obj, level, loc)
        const target = randomChoice(otherLocations)
        teleport(target.x, target.y)
      }
    }

    // Run next action after delay
    window.setTimeout(() => runAllActions(callback), ACTION_DELAY)
  } else {
    // No more actions left
    if (callback)
      callback()
  }
}

// Student API
function step(dir) {
  if (!dir) {
    console.error(`WARNING: invalid direction step("${dir}")`)
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
    console.error(`WARNING: invalid direction step("${dir}")`)
    return;
  }

  const action = (level) => {
    // Find player location
    const loc = findLocation("@", level)
    if (!loc) {
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

    // Check exit interaction
    const exitLoc = findLocation("E", level)
    if (exitLoc.x === newX && exitLoc.y === newY) {
      nextButton.disabled = false
      levelWon = true
      levelFinished = true
    }
    
    // Add to new position
    level[newX][newY].push("@")

    // Remove from old position
    level[loc.x][loc.y].splice(level[loc.x][loc.y].indexOf("@"), 1)

    redraw(level)
  }

  if (evalEagerly) {
    action(level)
  } else {
    actionQueue.push(action)
  }
}

// Student API
function take() {
  // Push action onto FIFO queue
  actionQueue.push(level => {
    // Find player location
    const loc = findLocation("@", level)
    if (!loc) {
      console.error("ERROR: player does not exist. You hacked my game!")
      return;
    }

    // Check if not already holding item
    if (heldItem) {
      console.error("WARNING: already holding item. Can't take")
      return;
    }

    // Check if items can be taken
    const takeableItems = Object.keys(OBJECTS.TAKEABLE)
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

// Student API
function put() {
  // Push action obto FIFO queue
  actionQueue.push(level => {
    if (!heldItem) {
      console.error("WARNING: nothing to put()")
        return;
    }

    // Find player location
    const loc = findLocation("@", level)
    if (!loc) {
      console.error("ERROR: player does not exist. You hacked my game!")
      return;
    }

    // Place item on level at player location behind player
    level[loc.x][loc.y].splice(level[loc.x][loc.y].indexOf("@"), 0, heldItem)

    // Check item interactions
    if (heldItem === "K") {
      const colCount = level.length
      const rowCount = level[0].length

      let shouldDestroyKey = false
      // Destroy every nearby door and key
      // On location
      if (level[loc.x][loc.y].includes("D")) {
        removeObjectDev("D", loc.x, loc.y, level)
        shouldDestroyKey = true
      }

      // Up
      if (loc.y > 0 && level[loc.x][loc.y-1].includes("D")) {
        removeObjectDev("D", loc.x, loc.y - 1, level)
        shouldDestroyKey = true
      }

      // Down
      if (loc.y < rowCount - 1 && level[loc.x][loc.y+1].includes("D")) {
        removeObjectDev("D", loc.x, loc.y + 1, level)
        shouldDestroyKey = true
      }

      // Left
      if (loc.x > 0 && level[loc.x-1][loc.y].includes("D")) {
        removeObjectDev("D", loc.x - 1, loc.y, level)
        shouldDestroyKey = true
      }

      // Right
      if (loc.x < colCount - 1 && level[loc.x+1][loc.y].includes("D")) {
        removeObjectDev("D", loc.x + 1, loc.y, level)
        shouldDestroyKey = true
      }

      // Used so we call key remove function only once
      if (shouldDestroyKey) {
        removeObjectDev("K", loc.x, loc.y, level)
      }
    }

    heldItem = null
    redraw(level)
  })
}

// Student API
// Returns true if player can move in given dir, - false otherwise
function check(dir) {
  if (!dir) {
    console.error(`WARNING: invalid direction check("${dir}")`)
    return null;
  }

  // Determine delta
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
    console.error(`WARNING: invalid direction check("${dir}")`)
    return null;
  }

  const loc = findLocation("@", level)
  if (!loc) {
    console.error("ERROR: player does not exist. You hacked my game!")
    return null;
  }

  const checkX = loc.x + dx
  const checkY = loc.y + dy

  // Warn if check position out of bounds
  if (!level[checkX] || !level[checkX][checkY]) {
    console.error(`WARNING: nothing at position check("${dir}")`)
    return null;
  }

  const collidableObjects = Object.keys(OBJECTS.COLLIDABLE)

  // Return copy
  return level[checkX][checkY]
}

// Run button
const runButton = document.querySelector("#run-button")
function runCodeClick(codeArg = null, callback = null) {
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
    const code = codeArg ? codeArg : editor.value
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
    runAllActions(callback)

    redraw(level)
  }, ACTION_DELAY)
}
runButton.addEventListener("click", () => runCodeClick())

// Next button
const nextButton = document.querySelector("#next-button")
function nextClick() {
  if (!levelWon) {
    console.log("Nice try, cheater :D")
    return;
  }

  // Check if last level cleared
  if (levelIndex > LEVELS.length - 2) {
    console.log("Well done, you have finished the game!")
    return;
  }

  levelIndex += 1

  // Load next level
  level = JSON.parse(JSON.stringify(LEVELS[levelIndex]))
  nextButton.disabled = true
  heldItem = null
  levelWon = false
  levelFinished = false
  redraw(level)

  // Update level text
  levelTitleHeader.textContent = `Level ${levelIndex}`
}
nextButton.addEventListener("click", () => nextClick())

// Reset button
const resetButton = document.querySelector("#reset-button")
function resetClick() {
  // Empty actionQueue
  while (actionQueue.length > 0)
    actionQueue.pop()
  // Empty updateQueue
  while (updateQueue.length > 0)
    updateQueue.pop()
  // Revert level state
  nextButton.disabled = true
  levelWon = false
  levelFinished = false
  heldItem = null
  level = JSON.parse(JSON.stringify(LEVELS[levelIndex]))
  redraw(level)
}
resetButton.addEventListener("click", () => resetClick())

redraw(level)

// Start updating graphics every "frame"
window.setInterval(() => {
  if (updateQueue[0]) {
    updateQueue[0]()
    updateQueue.splice(0, 1)
  }
}, REDRAW_DELAY)
