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

  // Level 11
  `
function move(dir, count) {
 for (let i = 0; i < count; i++)
  step(dir)
}

move("R", 4)
`,

  // Level 12
  `function move(dir, count) {
 for (let i = 0; i < count; i++)
  step(dir)
}

move("R", 6)
take()
move("L", 6)
put()
move("L", 2)`,

  // Level 13
  `function move(dir, count) {
 for (let i = 0; i < count; i++)
  step(dir)
}

move("R", 8)
move("D", 8)
move("L", 8)
move("U", 6)
move("R", 6)
move("D", 4)
move("L", 4)
move("U", 2)
move("R", 2)
`,

  // Level 14
  `function move(dir, count) {
 for (let i = 0; i < count; i++)
  step(dir)
}

removeObject("#", 2, 0)
move("R", 4)
`,
  
  // Level 15
  `function move(dir, count) {
 for (let i = 0; i < count; i++)
  step(dir)
}

move("R", 2)
move("L", 2)
take()
move("R", 2)
step("L")
move("U", 2)
put()
move("L", 4)
step("D")
move("R", 2)
take()
move("L", 2)
move("R", 3)
move("U", 2)
put()
move("U", 2)
take()
step("D")
put()
put()
step("U")
step("L")`,

  // Level 16
  `
teleport(7, 1)
`,

  // Level 17
  `function move(dir, count) {
 for (let i = 0; i < count; i++)
  step(dir)
}

step("R")
take()
move("R", 12)

for(let i = 0; i < 9; i++) {
 put()
 move("L", 11)
 take()
 move("R", 12)
}

put()
move("R", 2)
`
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
