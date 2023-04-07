// https://p5js.org/reference/#/p5/textFont
let fontRegular, fontItalic, fontBold;
let lineHeight, charWidth
let margins;
let leftBoundary;
let rightBoundary;
let lineIndex, totalLines;
let currentTextSize;
let currentLine;
let processedLines;
let charZoomFactor;
let transitionLeft, transitionRight;
let longestLength;
let maxTextWidth;
let halfWidth;

let xPosition;
let velocity;
let friction;
let dragging;

let previousMouseX;
let initCursor;
let currentShift;
let horizontalShift, verticalShift;

class Cursor {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

function preload() {
  fontMono = loadFont('assets/fonts/LibertinusMono-Regular.otf');
  fontRegular = loadFont('assets/fonts/LinBiolinum_R.otf');
  fontItalic = loadFont('assets/fonts/LinBiolinum_RI.otf');
  fontBold = loadFont('assets/fonts/LinBiolinum_RB.otf');
  // lines = loadStrings('assets/bras-de-fer-de-lance.chain.txt');
  lines = loadStrings('assets/anothering.chain.txt');
}

function setup() {
  canvasSize = 500;
  createCanvas(canvasSize, canvasSize);

  halfWidth = width/2;

  // remove last empty line if there is one
  lines = lines.filter(l => l.length > 0);

  // for (const el of lines) {
  //   if (el) console.log(el);
  // }

  textFont(fontRegular);
  textAlign(CENTER);

  currentTextSize = canvasSize/10;
  fill(0)
  textSize(currentTextSize);

  initCursor = new Cursor(mouseX, mouseY);
  // console.log(`cursor: ${JSON.stringify(initCursor)}`);

  horizontalShift = 0;
  verticalShift = 0;
  currentShift = 0;

  // find the max charWidth of the current lines
  const widestChar = Array.from(new Set(lines.join("").split("")))
    .reduce((char1, char2) => textWidth(char1) > textWidth(char2) ? char1 : char2);

  // charWidth = canvasSize/18;
  charZoomFactor = 1;
  charWidth = textWidth(widestChar) * charZoomFactor;

  margins = charWidth * 2;
  lineHeight = canvasSize/15;
  totalLines = lines.length;
  whiteSpaceToCrop = 0;

  xPosition = margins;
  velocity = 0;
  dragging = false;
  previousMouseX;
  friction = 0.95;


  lineIndex = 0;
  // processedLines is an array of objects:
  // { "ws": length of minimum leading white space for each group, "l": group (array) of lines }
  processedLines = prepareLines();
  // console.log(processedLines);

  transitionLeft = 0; // processedLines[0].ws * charWidth;
  transitionRight = processedLines[lineIndex + 1].ws * charWidth - margins;

  const lastGroup = processedLines[processedLines.length - 1].l;
  maxTextWidth = (lastGroup[lastGroup.length - 1].length - 1) * charWidth;
  // console.log(`longestLength: ${longestLength}`);

  // Calculate text width and boundaries
  leftBoundary = margins;
  rightBoundary = width - margins - maxTextWidth;


}

function draw() {
  background(255);

  // canvas frame
  push();
  noFill();
  stroke(255,0,0);
  strokeWeight(2);
  rect(0,0, width, height, 5);
  pop();

  // margins frame
  push();
  noFill();
  stroke(0,0,255);
  strokeWeight(1);
  rect(margins,margins, width - 2 * margins, height - 2 * margins);
  pop();

  // dragging logic
  if (dragging) {
    let deltaX = mouseX - previousMouseX;
    // Update the text position directly based on mouse movement
    xPosition += deltaX;
    // Record the last velocity for momentum when mouse is released
    velocity = deltaX;
  } else {
    // Apply friction to velocity when not dragging
    velocity *= friction;
    // Update text position based on velocity for momentum
    xPosition += velocity;
  }

  // Update text position based on velocity
  xPosition += velocity;

  // Constrain text position within boundaries
  xPosition = constrain(xPosition, rightBoundary, leftBoundary);

  // write the text
  for (let i = 0; i < processedLines[lineIndex].l.length; i++) {
    writeLine(processedLines[lineIndex].l[i], height/3 + i * lineHeight);
  }

  // Update previous mouse X position
  previousMouseX = mouseX;
}

function writeLine(l, h) {
  push();
  const cS = xPosition;
  const vS = Math.min(0, verticalShift);

  const tr = cS + transitionRight;
  const tl = cS + transitionLeft;

  push();

  textSize(15);
  textAlign(LEFT);
  stroke(255,0,0);

  // helper: transition Right
  line(tr, 0, tr, height);
  // helper: transition Left
  stroke(0,0,255);
  line(tl, 0, tl, height);

  stroke(0);
  text(`tr: ${tr.toPrecision(6)}`, 10, height - 10);
  text(`tl: ${tl.toPrecision(6)}`, 10, height - 30);
  text(`cS: ${-cS.toPrecision(6)}`, 10, height - 50);
  text(`lineIndex: ${lineIndex}/${processedLines.length - 2}`, 10, height - 70);
  pop();

  // console.log(`current horizontal shift: ${cS} | vertical shift: ${vS} | current ws: ${processedLines[lineIndex + 1].ws}, * char width: ${transition.toPrecision(6)}`);

  const lastStep = lineIndex === processedLines.length - 2 ?  true : false;
  // console.log(`last step: ${lastStep}`);

  // moving forward, if we are beyond the right line (and also the left)
  if (tl < halfWidth && tr <= halfWidth) {
    if (lineIndex < processedLines.length - 2) {
      lineIndex = lineIndex + 1;
      transitionLeft = transitionRight;
      transitionRight = processedLines[lineIndex + 1].ws * charWidth - margins;
    } else if (lastStep) {
      lineIndex = lineIndex + 1;
    }
    // console.log(`transition!, tr R: ${transitionRight}, tr L ${transitionLeft} | current shift ${cS} | l index: ${lineIndex}`);
  }

  // moving backward, if we are beyond the left line (and also the right)
  if (tl > halfWidth && tr > halfWidth) {
    lineIndex = Math.max(lineIndex - 1, 0);
    transitionRight = transitionLeft;
    transitionLeft = processedLines[lineIndex].ws * charWidth - margins;
    // console.log(`transition!, tr R: ${transitionRight}, tr L ${transitionLeft} | current shift ${cS} | l index: ${lineIndex}`);
  }

  translate(cS, 0);
  for (let j = 0; j < l.length; j++) {
    text(l[j], charWidth*j, h + vS);
  }
  pop();
}

function cleanLine(l) {
  return l.replace(/[¬\|]$/, "");
}

function getCurrentLines(i, nLines) {
  let l = [];
  if (nLines === 1) {
    l.push(cleanLine(lines[i]));
  } else if (nLines === 2) {
    l.push(cleanLine(lines[i]))
    l.push(cleanLine(lines[i+1]));
  } else if (nLines === 3) {
    l.push(cleanLine(lines[i-1]));
    l.push(cleanLine(lines[i]));
    l.push(cleanLine(lines[i+1]));
  }
  return l;
}


function prepareLines() {
  const pLines = []; // will contain objects: {"ws": minimum leading whitespace, "l": array of lines}
  let lIndex = -1; // trick to make sure the first line is properly handled
  let cLine;

  // loop until we reach the end
  while (lIndex < totalLines - 2) {

    // move forward until we encounter ¬ or | at the end of the line
    while (lIndex < totalLines - 2 && !lines[lIndex + 1].match(/[¬|]$/)) {
      lIndex = lIndex + 1;
    }

    lIndex = lIndex + 1;
    cLine = lines[lIndex];

    // CASE: two-lines split: the main line is the basis for cropping
    if (cLine[cLine.length - 1] === "¬") {

      // console.log(`case ¬, line ${cLine}`);

      pLines.push({
        "ws": cLine.search(/\S|$/) + 2,
        "l": getCurrentLines(lIndex, 2)
      });

    // CASE: three-lines split: the previous line is the basis for cropping
    } else if (cLine[cLine.length - 1] === "|") {

      // console.log(`case |, line ${cLine}`);

      pLines.push({
        "ws": lines[lIndex - 1].search(/\S|$/) + 2,
        "l": getCurrentLines(lIndex, 3)
      });

    // CASE: all others: : the main line is the basis for cropping
    // TODO: is this third branch necessary?
    } else {

      // console.log(`case other, line ${cLine}`);

      pLines.push({
        "ws": cLine.search(/\S|$/) + 2,
        "l": getCurrentLines(lIndex, 1)
      });
    }

  }

  // console.log("========================================");
  // console.log("pLines:");
  // for (const g of pLines) {
  //   for (const l of g) {
  //     console.log(l);
  //   }
  //   console.log("---");
  // }
  // console.log("========================================");

  return pLines;
}

function keyPressed() {
  if (keyIsDown(SHIFT)) {
    // with shift, move backward
    if (key === " ") {
      lineIndex = (lineIndex - 1) % (processedLines.length - 1);
    }
  } else {
    // move forward
    if (key === " ") {
      lineIndex = (lineIndex + 1) % (processedLines.length - 1);
    }
  }

}

// ----------------------------------------
// scrolling mechanism

function mousePressed() {
  dragging = true;
  previousMouseX = mouseX;
}

function mouseReleased() {
  dragging = false;
}

function touchStarted() {
  dragging = true;
  previousMouseX = mouseX;
}

function touchEnded() {
  dragging = false;
}
