// solutions.js

const solutions = [

  // Level 0
  `
step("R")`,

  // Level 1
  `
step("R")
step("R")`,

  // Level 2
  `
step("R")
step("D")
step("D")`,

  // Level 3
  `
step("R")
step("R")
step("D")
step("D")
step("L")
step("L")`,

  // Level 4
  `
for (let i = 0; i < 6; i++)
 step("R")
step("D")
step("D")
for (let i = 0; i < 6; i++)
 step("L")`,

  // Level 5
  `
function moveRight(count) {
 for (let i = 0; i < count; i++)
  step("R")
}

function moveLeft(count) {
 for (let i = 0; i < count; i++)
  step("L")
}

moveRight(14)
step("D")
step("D")
moveLeft(14)`,

  // Level 6
  `
function move(dir, count) {
 for (let i = 0; i < count; i++)
  step(dir)
}

move("R", 14)
move("D", 2)
move("L", 14)
move("D", 2)
move("R", 14)`,

  // Level 7
  `
function move(dir, count) {
 for (let i = 0; i < count; i++)
  step(dir)
}

for (let i = 0; i < 2; i ++) {
 move("R", 14)
 move("D", 2)
 move("L", 14)
 move("D", 2)
}

move("R", 14)
`,

  // Level 8
  `
function move(dir, count) {
 for (let i = 0; i < count; i++)
  step(dir)
}

move("R", 2)
take()
move("D", 2)
put()
move("L", 2)
`,

  // Level 9
  `
function move(dir, count) {
 for (let i = 0; i < count; i++)
  step(dir)
}

step("L")
take()
move("R", 3)
step("D")
put()
move("R", 3)
take()
move("L", 5)
put()
move("R", 6)
take()
move("L", 6)
step("D")
put()
move("D", 2)
`,

  // Level 10
  `
function move(dir, count) {
 for (let i = 0; i < count; i++)
  step(dir)
}

step("L")
step("U")
take()
move("D", 2)
step("R")
put()
move("R", 3)
take()
move("L", 3)
step("D")
put()
step("U")
move("R", 4)
take()
move("L", 4)
move("D", 2)
put()
move("D", 2)`,

  
  
]

function runCodePromise(solution) {
  return new Promise((resolve, reject) => {
    runCodeClick(solution, () => {
      if (levelWon) {
        resolve(true)
      } else {
        reject(false)
      }
    })
  })
}

async function runSolutions() {
  levelIndex = 0
  resetClick()
  
  for (const sol of solutions) {
    await runCodePromise(sol)
    nextClick()
  }
}
