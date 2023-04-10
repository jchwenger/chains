let margins;
let halfWidth;
let thirdLWidth;
let thirdRWidth;

// text business
// https://p5js.org/reference/#/p5/textFont
let lines;
let fontRegular;
let fontItalic;
let fontBold;
let lineHeight
let lineIndex;
let currentTextSize;
let charWidth;
let charZoomFactor;
let processedLines;

// scrolling
// ---------
// physics system
let previousMouseX;
let xPosition;
let velocity;
let friction;
let dragging;

// limits & transitions
let maxTextWidth;
let leftBoundary;
let rightBoundary;
let alphaMixL;
let alphaMixR;

let verticalShift;

// let ik;

function preload() {
  fontMono = loadFont('assets/fonts/LibertinusMono-Regular.otf');
  fontRegular = loadFont('assets/fonts/LinBiolinum_R.otf');
  fontItalic = loadFont('assets/fonts/LinBiolinum_RI.otf');
  fontBold = loadFont('assets/fonts/LinBiolinum_RB.otf');
  // lines = loadStrings('assets/bras-de-fer-de-lance.chain.txt');
  lines = loadStrings('assets/anothering.chain.txt');

  // httpGet(
  //   'https://raw.githubusercontent.com/jchwenger/wordhoard/master/IKEA/ikea.txt',
  //   'text', true, (r) => ik = r
  // )
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
  textSize(currentTextSize);

  verticalShift = 0;

  // find the max charWidth of the current lines
  const widestChar = Array.from(new Set(lines.join("").split("")))
    .reduce((char1, char2) => textWidth(char1) > textWidth(char2) ? char1 : char2);

  charZoomFactor = .8;
  charWidth = textWidth(widestChar) * charZoomFactor;

  margins = charWidth * 2;
  halfWidth = width/2;
  thirdLWidth = width/3;
  thirdRWidth = 2 * width/3;

  lineHeight = canvasSize/15;
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
  console.log(processedLines);

  const lastGroup = processedLines[processedLines.length - 1].l;
  maxTextWidth = (lastGroup[lastGroup.length - 1].length - 1) * charWidth;

  // Calculate text width and boundaries
  leftBoundary = margins;
  rightBoundary = width - margins - maxTextWidth;

  alphaMixL = 255;
  alphaMixR = 0;

}

function draw() {
  background(255);

  helperFrames();

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

  // previous link
  if (lineIndex > 0) {
    for (let i = 0; i < processedLines[lineIndex - 1].l.length; i++) {
      writeLine(
        processedLines[lineIndex - 1].l[i],
        height/2 + i * lineHeight,
        alphaMixL,
        verticalShift + lineHeight * (processedLines[lineIndex - 1].l.length - 1)
      );
    }
  }

  // write the text
  for (let i = 0; i < processedLines[lineIndex].l.length; i++) {
    writeLine(
      processedLines[lineIndex].l[i],
      height/2 + i * lineHeight,
      255,
      verticalShift
    );
  }

  // next link
  if (lineIndex < processedLines.length - 1) {
    for (let i = 0; i < processedLines[lineIndex + 1].l.length; i++) {
      writeLine(
        processedLines[lineIndex + 1].l[i],
        height/2 + i * lineHeight,
        alphaMixR,
        verticalShift - lineHeight * processedLines[lineIndex].n
      );
    }
  }

  transitions();

  // Update previous mouse X position
  previousMouseX = mouseX;

}

function writeLine(l, h, alpha, verticalShift) {
  push();

  fill(0, alpha);

  // console.log(`current horizontal shift: ${xPosition} | vertical shift: ${vS} | current ws: ${processedLines[lineIndex + 1].ws}, * char width: ${transition.toPrecision(6)}`);
  translate(xPosition, 0);
  for (let j = 0; j < l.length; j++) {
    text(l[j], charWidth*j, h - verticalShift);
  }
  pop();
}

// ----------------------------------------
// transitions: chaining utils

function transitions() {

  // xPosition will most often be a negative number as we scroll left to read
  // more text (the beginning is far off to the left outside the canvas
  const tr = xPosition + processedLines[lineIndex].tr;
  const tl = xPosition + processedLines[lineIndex].tl;
  const th = xPosition + processedLines[lineIndex].th;
  const trR = Math.min(
    halfWidth + (processedLines[lineIndex].tr - processedLines[lineIndex].tl)/2,
    width - margins // we don't go beyond the margins
  );
  const trL = Math.max(
    halfWidth - (processedLines[lineIndex].tr - processedLines[lineIndex].tl)/2,
    margins // we don't go beyond the margins
  );


  helperText(tr, tl, th, trR, trL);
  helperTransitions(tr, tl, th, trR, trL);

  // CASE: first
  if (lineIndex === 0) {

    // TRANSITION
    if (tr < halfWidth) {
      lineIndex += 1;
      verticalShift -= lineHeight * processedLines[lineIndex].np;
      alphaMixR = 0;
      // console.log(`transition forward (1st) | verticalShift: ${verticalShift.toPrecision(3)}`);
    }

    // right fade: next link appears, moves up
    if (tr >= halfWidth && tr <= trR && xPosition < margins) {
      verticalShift = map(tr, trR, halfWidth, 0, lineHeight * processedLines[lineIndex].n, true);
      alphaMixR = map(tr, trR, halfWidth, 0, 255, true);
      // console.log(`right fade (1st) | verticalShift: ${verticalShift.toPrecision(6)}`);
      // console.log(`right fade (1st) | alphaMixR: ${alphaMixR.toPrecision(6)}`);
    }

  // CASE: last
  } else if (lineIndex === processedLines.length - 1) {

    // TRANSITION BACKWARD
    if (tl > halfWidth) {
      verticalShift += lineHeight * processedLines[lineIndex].np;
      lineIndex -= 1;
      // alphaMixL = 0;
      // console.log(`transition backward | verticalShift: ${verticalShift}`);
    }

    // left fade: previous link disappears
    if (tl <= halfWidth && tl >= trL) {
      alphaMixL = map(tl, trL + 5, halfWidth - 5, 0, 255, true);
      // console.log(`tr: ${tr.toPrecision(6)} | alphaMixR: ${alphaMixR.toPrecision(6)}`);
      // console.log(`left fade | alphaMixL: ${alphaMixL.toPrecision(6)}`);
    }

  // CASE: all others
  } else {

    // TRANSITION FORWARD
    if (tr < halfWidth) {
      verticalShift -= lineHeight * processedLines[lineIndex].n;
      lineIndex += 1;
      alphaMixR = 0;
      // console.log(`transition forward | verticalShift: ${verticalShift}`);
    }

    // TRANSITION BACKWARD
    if (tl > halfWidth) {
      verticalShift += lineHeight * processedLines[lineIndex].np;
      lineIndex -= 1;
      alphaMixL = 0;
      // console.log(`transition backward | verticalShift: ${verticalShift}`);
    }

    // left fade: previous link disappears
    if (tl <= halfWidth && tl >= trL) {
      alphaMixL = map(tl, trL + 5, halfWidth - 5, 0, 255, true);
      // console.log(`tr: ${tr.toPrecision(6)} | alphaMixR: ${alphaMixR.toPrecision(6)}`);
      // console.log(`left fade | alphaMixL: ${alphaMixL.toPrecision(6)}`);
    }

    // right fade: next link appears, moves up
    if (tr >= halfWidth && tr <= trR) {
      verticalShift = map(tr, trR, halfWidth, 0, lineHeight * processedLines[lineIndex].n, true);
      alphaMixR = map(tr, trR, halfWidth, 0, 255, true);
      // console.log(`right fade | verticalShift: ${verticalShift.toPrecision(6)}`);
    }

  }

}

// ----------------------------------------
// text processing

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
  while (lIndex < lines.length - 2) {

    // move forward until we encounter ¬ or | at the end of the line
    while (lIndex < lines.length - 2 && !lines[lIndex + 1].match(/[¬|]$/)) {
      lIndex = lIndex + 1;
    }

    lIndex = lIndex + 1;
    cLine = lines[lIndex];

    // CASE: two-lines split: the main line is the basis for cropping
    if (cLine[cLine.length - 1] === "¬") {

      // console.log(`case ¬, line ${cLine}`);

      // TODO: the + 2 doesn't make sense, most likely a margins issue
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

  // calculate: - transitions (tl: left, tr: right, th: half/middle)
  //            - n° of lines - 1 for each group (n: current, np: previous, nn: next)
  for (let i = 0; i < pLines.length; i++) {
    // CASE: first
    if (i === 0) {
      pLines[i].tl = 0;
      pLines[i].tr = pLines[i + 1].ws * charWidth - margins;
      pLines[i].n = pLines[i].l.length - 1;
      pLines[i].np = pLines[i].l.length - 1;
      pLines[i].nn = pLines[i + 1].l.length - 1;
    // CASE: last
    } else if (i === pLines.length - 1) {
      pLines[i].tl = pLines[i - 1].tr;
      pLines[i].tr = (pLines[i].l[pLines[i].l.length - 1 - 1].length - 1) * charWidth;
      pLines[i].n = pLines[i].l.length - 1;
      pLines[i].np = pLines[i - 1].l.length - 1;
      pLines[i].nn = pLines[i].l.length - 1;
    // CASE: all others
    } else {
      pLines[i].tl = pLines[i - 1].tr;
      pLines[i].tr = pLines[i + 1].ws * charWidth - margins;
      pLines[i].n = pLines[i].l.length - 1;
      pLines[i].np = pLines[i - 1].l.length - 1;
      pLines[i].nn = pLines[i + 1].l.length - 1;
    }
    pLines[i].th = (pLines[i].tl + pLines[i].tr) / 2;
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

// ----------------------------------------
// helpers

function helperFrames() {

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

}

function helperText(tr, tl, th, trR, trL) {

  push();

  textAlign(LEFT);
  textSize(15);
  stroke(0);

  text(`velocity: ${velocity.toPrecision(4)}`, 10, height - 50);
  text(`lineIndex: ${lineIndex}/${processedLines.length - 1}`, 10, height - 30);
  text(`xPosition: ${xPosition.toPrecision(6)}`, 10, height - 10);

  text(`alphaMixL: ${alphaMixL.toPrecision(6)}`, 130, height - 50);
  text(`alphaMixR: ${alphaMixR.toPrecision(6)}`, 130, height - 30);
  text(`verticalShift: ${verticalShift.toPrecision(4)}`, 130, height - 10);

  text(`tLeft: ${trL.toPrecision(6)}`, width - 190, height - 50);
  text(`tRight: ${trR.toPrecision(6)}`, width - 190, height - 30);
  text(`tHalf: ${halfWidth}`, width - 190, height - 10);

  text(`tl: ${tl.toPrecision(6)}`, width - 80, height - 50);
  text(`tr: ${tr.toPrecision(6)}`, width - 80, height - 30);
  text(`th: ${th.toPrecision(6)}`, width - 80, height - 10);

  pop();

}

function helperTransitions(tr, tl, th, trR, trL) {

  push();
  textAlign(LEFT);
  textSize(15);
  let c;

  // halfWidth: middle, horizontal/vertical
  stroke(0);
  line(halfWidth, 0, halfWidth, height);
  line(0, halfWidth, height, halfWidth);

  // tr: transition Right
  c = color(255,0,0);
  stroke(c);
  line(tr, 0, tr, height);
  noStroke();
  fill(c);
  text('tr', tr + 2, 10);

  // tl: transition Left
  c = color(0,0,255);
  stroke(c);
  line(tl, 0, tl, height);
  noStroke();
  fill(c);
  text('tl', tl + 2, 10);

  // th: transition boundary (midpoint transitions left/right, neon green)
  c = color(0,255,0);
  stroke(c);
  line(th, 0, th, height);
  noStroke();
  fill(c);
  text('th', th + 2, 10);

  // trR & trL: mid-transition on each side of halfWidth (purple)
  c = color(168, 50, 162);
  stroke(c);
  line(trR, 0, trR, height);
  line(trL, 0, trL, height);
  noStroke();
  fill(c);
  text('trL', trL + 2, 10);
  text('trR', trR + 2, 10);

  pop();

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

function keyPressed() {

  if (keyCode === LEFT_ARROW) {
    xPosition -= 1;
  } else if  (keyCode === RIGHT_ARROW) {
    xPosition += 1;
  }

}
