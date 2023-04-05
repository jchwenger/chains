// https://p5js.org/reference/#/p5/textFont
let fontRegular, fontItalic, fontBold;
let lineHeight, charWidth, margins;
let lineIndex, totalLines;
let currentTextSize;
let currentLine;
let processedLines;
let widestChar, charZoomFactor;
let transitionLeft, transitionRight;

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

  // remove last empty line if there is one
  lines = lines.filter(l => l.length > 0);

  // for (const el of lines) {
  //   if (el) console.log(el);
  // }

  textFont(fontRegular);
  textAlign(CENTER);

  currentTextSize = canvasSize/10;
  fill(0)
    .strokeWeight(0)
    .textSize(currentTextSize);

  initCursor = new Cursor(mouseX, mouseY);
  // console.log(`cursor: ${JSON.stringify(initCursor)}`);

  horizontalShift = 0;
  verticalShift = 0;
  currentShift = 0;

  // find the max charWidth of the current lines
  widestChar = Array.from(new Set(lines.join("").split("")))
    .reduce((char1, char2) => textWidth(char1) > textWidth(char2) ? char1 : char2);

  // charWidth = canvasSize/18;
  charZoomFactor = 1;
  charWidth = textWidth(widestChar) * charZoomFactor;

  margins = charWidth * 2;
  lineHeight = canvasSize/15;
  totalLines = lines.length;
  whiteSpaceToCrop = 0;

  lineIndex = 0;
  // processedLines is an array of objects:
  // { "ws": length of minimum leading white space for each group, "l": group (array) of lines }
  processedLines = prepareLines();
  // console.log(processedLines);

  transitionLeft = null;
  transitionRight = - (processedLines[lineIndex + 1].ws * charWidth);

}

function draw() {
  background(255);

  // margins
  push();
  noFill();
  stroke(0,0,255);
  strokeWeight(1);
  rect(margins,margins, width - 2 * margins, height - 2 * margins);
  pop();

  // frame
  push();
  noFill();
  stroke(255,0,0);
  strokeWeight(2);
  rect(0,0, width, height, 5);
  pop();

  for (let i = 0; i < processedLines[lineIndex].l.length; i++) {
    writeLine(processedLines[lineIndex].l[i], height/3 + i * lineHeight);
  }

}

function writeLine(line, h) {
  push();
  const cS = Math.min(0, currentShift + horizontalShift);
  const vS = Math.min(0, verticalShift);

  if (lineIndex < processedLines.length - 2) {
    const transition = - (processedLines[lineIndex + 1].ws * charWidth);
    console.log(`current horizontal shift: ${cS} | vertical shift: ${vS} | current ws: ${processedLines[lineIndex + 1].ws}, * char width: ${transition.toPrecision(6)}`);
    if (cS < transition) {
      lineIndex = (lineIndex + 1) % (processedLines.length - 1);
      console.log("transition!");
    }
  }

  translate(cS, 0);
  for (let j = 0; j < line.length; j++) {
    text(line[j], margins + charWidth*j, h + vS);
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
  const pLines = [];
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
    const whiteSpaceToCrop = cLine.search(/\S|$/);

    // CASE: two-lines split: the main line is the basis for cropping
    if (cLine[cLine.length - 1] === "¬") {
      pLines.push({
        "ws": whiteSpaceToCrop,
        "l": getCurrentLines(lIndex, 2)
      });

    // CASE: three-lines split: the previous line is the basis for cropping
    } else if (cLine[cLine.length - 1] === "|") {
      pLines.push({
        "ws": whiteSpaceToCrop,
        "l": getCurrentLines(lIndex, 3)
      });

    // CASE: all others
    } else {
      pLines.push({
        "ws": whiteSpaceToCrop,
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
  initCursor.x = mouseX;
  initCursor.y = mouseY;
  // console.log(`Mouse pressed: ${JSON.stringify(initCursor)}`);
}

function mouseReleased() {
  updateCurrentShift(horizontalShift);
  horizontalShift = 0;
}

function mouseDragged() {

  horizontalShift = - (initCursor.x - mouseX);

  // if we reached the left limit, any move right shifts
  if (mouseX > initCursor.x && currentShift === 0) {
    initCursor.x = mouseX;
  }

  // console.log(`current horizontal shift: ${currentShift} | init: ${initCursor.x}, now: ${mouseX} -> ${horizontalShift}`);
  // console.log(`current vertical shift: ${verticalShift}`);
}

function updateCurrentShift(h) {
  currentShift += horizontalShift;
  currentShift = Math.min(0, currentShift);
}
