// https://p5js.org/reference/#/p5/textFont
let fontRegular, fontItalic, fontBold;
let lineHeight, charWidth, margins;
let lineIndex, totalLines;
let whiteSpaceToCrop;
let currentTextSize;
let currentLine, currentLines;
let widestChar, charZoomFactor;

let initCursor;
let currentShift;
let horizontalShift;

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
  // console.log(lines);

  // console.log(lines);
  // for (const el of lines) {
  //   if (el) console.log(el);
  // }

  textFont(fontRegular);
  textAlign(LEFT);

  currentTextSize = canvasSize/10;
  fill(0)
    .strokeWeight(0)
    .textSize(currentTextSize);

  initCursor = new Cursor(mouseX, mouseY);
  // console.log(`cursor: ${JSON.stringify(initCursor)}`);

  horizontalShift = 0;
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
  currentLine = lines[lineIndex];
  // console.log(currentLine);

  loopForward();
  // adjustTextSize();
  // for (l of lines) {
  //   if (l.match(/[¬|]$/)) break;
  //   lineIndex++;
  // }

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

  // case: two-lines split
  // currentLine = lines[lineIndex];
  // console.log(`currentLine: ${currentLine}`);

  // if (currentLine[currentLine.length-1] === "¬") {
  //   writeLine(lineIndex, height/2)
  //   writeLine(lineIndex + 1, height/2 + lineHeight)
  // // case: three-lines split
  // } else if (currentLine[currentLine.length-1] === "|") {
  //   // console.log("three lines split");
  //   writeLine(lineIndex - 1, height/2 - lineHeight)
  //   writeLine(lineIndex, height/2)
  //   writeLine(lineIndex + 1, height/2 + lineHeight)
  // // case: one currentLine
  // } else {
  //   writeLine(lineIndex, height/2)
  // }

  for (let i = 0; i < currentLines.length; i++) {
    writeLine(currentLines[i], height/3 + i * lineHeight);
  }

}

// function writeLine(i, h) {
function writeLine(line, h) {
  // const l = lines[i]
  //             .slice(whiteSpaceToCrop, lines[i].length)
  //             .replace(/[¬\|]$/, "");
  push();
  const cS = Math.min(0, currentShift + horizontalShift);
  translate(cS, 0);
  for (let j = 0; j < line.length; j++) {
    text(line[j], margins + charWidth*j, h);
  }
  pop();
}

function cropLine(l, toCrop) {
  return l.slice(toCrop, l.length)
          .replace(/[¬\|]$/, "");
}

function updateCurrentLines(i, nLines, toCrop) {

  if (nLines === 1) {
    currentLines = [cropLine(lines[i], toCrop)];
  } else if (nLines === 2) {
    currentLines = [
      cropLine(lines[i], toCrop),
      cropLine(lines[i+1], toCrop),
    ];
  } else if (nLines === 3) {
    currentLines = [
      cropLine(lines[i-1], toCrop),
      cropLine(lines[i], toCrop),
      cropLine(lines[i+1], toCrop),
    ];
  }

}

function adjustTextSize() {

  // find the longest line
  const longestLine = currentLines.reduce(
    (l1, l2) => l1.length > l2.length ? l1 : l2
  )

  let tW = charWidth * (longestLine.length - 1);

  const innerCW = canvasSize - 2 * margins - charWidth;
  // console.log(`canvas size - margins: ${innerCW}`);
  // console.log(`currentTextSize: ${currentTextSize}, longest line: ${longestLine}, width: ${tW}`);

  // make it smaller
  if (tW > innerCW) {

    while (tW > innerCW) {
      currentTextSize -= 0.1;
      // lineHeight -= 0.1;
      // console.log(`text width ${tW}, currentTextSize: ${currentTextSize}, inner canvas: ${innerCW}`);
      textSize(currentTextSize);
      tW = charWidth * (longestLine.length - 1);
      charWidth = textWidth(widestChar) * charZoomFactor;
    }

  // make it bigger
  } else {

    while (tW < innerCW) {
      currentTextSize += 0.1;
      // lineHeight += 0.1;
      // console.log(`text width ${tW}, currentTextSize: ${currentTextSize}, inner canvas: ${innerCW}`);
      textSize(currentTextSize);
      tW = charWidth * (longestLine.length - 1);
      charWidth = textWidth(widestChar) * charZoomFactor;
    }

  }
}

function loopForward() {
  // console.log(`lineIndex: ${lineIndex}/${totalLines}, previous text: "${lines[lineIndex]}"`);

  // // if at the end, rewind
  // if (lineIndex >= totalLines - 1) {
  //   lineIndex = 0;
  //   console.log(`line index: "${lines[lineIndex]}"`);
  // }

  // move forward until we encounter ¬ or | at the end of the line
  while (lineIndex < totalLines - 2 && !lines[lineIndex + 1].match(/[¬|]$/)) {
    lineIndex = lineIndex + 1;
    // console.log(`${lineIndex}/${totalLines}, skipping: "${lines[lineIndex]}"`);
  }

  lineIndex = (lineIndex + 1) % (totalLines - 1);
  currentLine = lines[lineIndex];

  // console.log(`${lineIndex}/${totalLines}, current: "${lines[lineIndex]}"`);
  // console.log(`pressed key '${key}', lineIndex = ${lineIndex}`);
  // console.log(`text: "${currentLine}"`);

  // CASE: two-lines split: the main line is the basis for cropping
  if (currentLine[currentLine.length - 1] === "¬") {
    whiteSpaceToCrop = lines[lineIndex].search(/\S|$/);
    updateCurrentLines(lineIndex, 2, whiteSpaceToCrop);

    // console.log(`${lineIndex}/${totalLines}, two-lines`);
    // console.log(`${lineIndex}, ${lines[lineIndex]}"`);
    // console.log(`${lineIndex + 1}, ${lines[lineIndex + 1]}"`);
    // console.log("--------------------");

  // CASE: three-lines split: the previous line is the basis for cropping
  } else if (currentLine[currentLine.length - 1] === "|") {
    whiteSpaceToCrop = lines[lineIndex - 1].search(/\S|$/);
    updateCurrentLines(lineIndex, 3, whiteSpaceToCrop);

    // console.log(`${lineIndex}/${totalLines}, three-lines:`);
    // console.log(`${lineIndex - 1}, ${lines[lineIndex - 1]}"`);
    // console.log(`${lineIndex}, ${lines[lineIndex]}`);
    // console.log(`${lineIndex + 1}, ${lines[lineIndex + 1]}"`);
    // console.log("--------------------");

  // CASE: all others
  } else {
    whiteSpaceToCrop = lines[lineIndex].search(/\S|$/);
    updateCurrentLines(lineIndex, 1, whiteSpaceToCrop);
  }

  // console.log(`to crop: ${whiteSpaceToCrop}`);

}

function keyPressed() {
  if (key === " ") {
    loopForward();
    // adjustTextSize();
  }

  if (key === "d") {
    // adjustTextSize();
  }

}

function mousePressed() {
  initCursor.x = mouseX;
  initCursor.y = mouseY;
  console.log(`Mouse pressed: ${JSON.stringify(initCursor)}`);
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

  console.log(`current shift: ${currentShift} | init: ${initCursor.x}, now: ${mouseX} -> ${-(initCursor.x - mouseX)}`);
}

function updateCurrentShift(h) {
  currentShift += horizontalShift;
  currentShift = Math.min(0, currentShift);
}
