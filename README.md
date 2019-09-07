# Notes
Level sketch to array format:

1. Rotate counter-clockwise by pi/2
2. Flip y axis

# Code snippets
- Level 2 randomChoice fun
  ```js
  let possibleDirections = ["R", "L", "U", "D"]
  while(levelFinished != true) {
      let direction = randomChoice(possibleDirections)
      step(direction)
  }
  ```
