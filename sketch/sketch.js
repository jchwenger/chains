let margin;
let halfWidth;

// text business
// -------------
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

// intro
let reading;
let fileIndex;
let processedFiles;

// scrolling (reading)
// -------------------
// physics system
let previousMouseX;
let xPosition;
let xVelocity;
let xFriction;
let dragging;

// scrolling (intro)
// -----------------
let previousMouseY;
let yPosition;
let yVelocity;
let yFriction;

// limits & transitions
// --------------------
let maxTextWidth;
let leftBoundary;
let rightBoundary;
let alphaMixL;
let alphaMixR;
let verticalShift;

// limits (intro)
// --------------
let topBoundary;
let bottomBoundary;

// --------------------------------------------------------------------------------
// P5.js functions

function preload() {
  fontRegular = loadFont('assets/fonts/LinBiolinum_R.otf');
  // fontMono = loadFont('assets/fonts/LibertinusMono-Regular.otf');
  // fontItalic = loadFont('assets/fonts/LinBiolinum_RI.otf');
  // fontBold = loadFont('assets/fonts/LinBiolinum_RB.otf');
  files = loadStrings('assets/filenames.txt');
  // lines = loadStrings('assets/riverrun.chain.txt');

}

function setup() {

  canvasSize = 700;
  createCanvas(canvasSize, canvasSize * .8);

  halfWidth = width/2;
  margin = 50;

  // TODO: better way of calculating lineHeight?
  lineHeight = canvasSize/25;

  fill(0)
  textFont(fontRegular);
  textAlign(CENTER);
  currentTextSize = canvasSize/15;
  textSize(currentTextSize);

  // remove last empty line if there is one
  files = files.filter(l => l.length > 0);

  fileIndex = 0;

  reading = false;
  dragging = false;

  yPosition = 0;
  yVelocity = 0;
  yFriction = 0.65;
  previousMouseY = mouseY;

  topBoundary = - height - margin + files.length * 30;
  bottomBoundary = 0;

  processedFiles = prepareFiles();
  // console.log(processedFiles);

  loadChain(files[fileIndex], false); // load chain but don't shift to reading

}

function draw() {
  background(255);

  if (!reading) {
    intro();
  } else {
    chain();
  }
}

// --------------------------------------------------------------------------------
// chains

function loadChain(filename, shiftToReading = true) {
  loadStrings(`assets/${filename}`, l => setupChain(l, shiftToReading));
}

function setupChain(newLines, shiftToReading = true) {

  lines = newLines.filter(l => l.length > 0);

  // find the max charWidth of the current lines
  const widestChar = Array.from(new Set(lines.join("").split("")))
    .reduce((char1, char2) => textWidth(char1) > textWidth(char2) ? char1 : char2);

  charZoomFactor = .8;
  charWidth = textWidth(widestChar) * charZoomFactor;

  lineIndex = 0;
  // processedLines is an array of objects:
  // {
  //   "ws": length of minimum leading white space for each group, "l": group (array) of lines,
  //   "n": n° lines in current group, "np": in previous group, "nn": in next group,
  //   "vp": previous vertical shift, "vn": next,
  //   transitions (relative): "tl": left, "tr": right, "th": half/middle, "td": (tr - tl)/4
  //   transitions (absolute):"trL": left, "trR": right, "trH": half/middle
  //   previous transitions (absolute):"trLp": left, "trRp": right, "trHp": half/middle
  // }
  processedLines = prepareLines();
  // console.log(processedLines);

  const lastGroup = processedLines[processedLines.length - 1].l;
  maxTextWidth = (lastGroup[lastGroup.length - 1].length - 1) * charWidth;

  // Calculate text width and boundaries
  leftBoundary = margin;
  rightBoundary = halfWidth - maxTextWidth;

  xPosition = leftBoundary;
  xVelocity = 0;
  previousMouseX = mouseX;
  xFriction = 0.85;

  verticalShift = 0;
  alphaMixL = 255;
  alphaMixR = 0;

  // console.log(`chain set up, shift to reading? ${shiftToReading}`);
  if (shiftToReading) backToReading();
}

function intro() {

  // dragging logic
  if (dragging) {

    let deltaY = mouseY - previousMouseY;
    // Update the text position directly based on mouse movement
    yPosition += deltaY;
    // Record the last velocity for momentum when mouse is released
    yVelocity = deltaY;

  } else {

    // Apply xFriction to velocity when not dragging
    yVelocity *= yFriction;
    if (Math.abs(yVelocity) < 0.001) yVelocity = 0;
    // Update text position based on velocity for momentum
    yPosition += yVelocity;

  }

  // Update text position based on velocity
  yPosition += yVelocity;

  // Constrain text position within boundaries
  yPosition = constrain(yPosition, topBoundary, bottomBoundary);

  push();

  textSize(40);
  textAlign(RIGHT);
  text(`Chains`, width - margin, margin);

  translate(0, yPosition);

  textSize(25);
  textAlign(LEFT);
  for (let i = 0; i < files.length; i++) {
    fill(0);
    text(processedFiles[i].name, margin, processedFiles[i].yB);
    noFill();
    rect(margin, processedFiles[i].yRt, processedFiles[i].w, processedFiles[i].yRh);
  }

  // where is the mouse? If inside one of the file rectangles, ready to select
  fill(0);
  const mY = mouseY - yPosition;
  let j;
  for (let i = 0; i < processedFiles.length; i++) {
    if (mY > processedFiles[i].yRt && mY < processedFiles[i].yRt + processedFiles[i].yRh) {
      j = i;
      break;
    }
  }
  textSize(15);
  if (j != null && mouseX > margin && mouseX < margin + processedFiles[j].w) {
    cursor('pointer');
    // text(`in ${j} | ${mouseY} → ${mY} ${processedFiles[j].fname}`, mouseX, mY);
  } else {
    // text(`out | ${mouseY} → ${mY}`, mouseX, mY);
    cursor('default');
  }

  pop();

  // Update previous mouse X position
  previousMouseY = mouseY;

}

function chain() {

  // dragging logic
  if (dragging) {

    let deltaX = mouseX - previousMouseX;
    // Update the text position directly based on mouse movement
    xPosition += deltaX;
    // Record the last velocity for momentum when mouse is released
    xVelocity = deltaX;

  } else {

    // Apply xFriction to velocity when not dragging
    xVelocity *= xFriction;
    if (Math.abs(xVelocity) < 0.001) xVelocity = 0;
    // Update text position based on velocity for momentum
    xPosition += xVelocity;

  }

  // Update text position based on velocity
  xPosition += xVelocity;

  // Constrain text position within boundaries
  xPosition = constrain(xPosition, rightBoundary, leftBoundary);

  // update our transitions
  transitions();

  // previous link
  if (lineIndex > 0) {
    for (let i = 0; i < processedLines[lineIndex - 1].l.length; i++) {
      writeLine(
        processedLines[lineIndex - 1].l[i],
        height/2 + i * lineHeight,
        alphaMixL,
        verticalShift + processedLines[lineIndex].vp // lineHeight * (processedLines[lineIndex - 1].l.length - 1)
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
        verticalShift - processedLines[lineIndex].vn // lineHeight * processedLines[lineIndex].n
      );
    }
  }

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

// --------------------------------------------------------------------------------
// transitions: chaining utils

function transitions() {

  // xPosition starts at margin, then will most often be a negative number as
  // we scroll left to read more text (the end is far off to the left
  // outside the canvas)
  const tl = xPosition + processedLines[lineIndex].tl; // transition left/right/half
  const tr = xPosition + processedLines[lineIndex].tr;
  const th = xPosition + processedLines[lineIndex].th;
  const trH = processedLines[lineIndex].trH;
  const trL = processedLines[lineIndex].trL;
  const trR = processedLines[lineIndex].trR;
  const trHp = processedLines[lineIndex].trHp;
  const trLp = processedLines[lineIndex].trLp;
  const trRp = processedLines[lineIndex].trRp;

  helperFrames();
  helperText(tr, tl, th, trR, trL);
  helperTransitions(tr, tl, th);

  // LEFT ---------------------------------------------------------------------------
  // fade: previous link (dis)appears, using fixed points from previous link
  if (tl <= trHp && tl >= trLp) {
    alphaMixL = map(tl, trLp, trHp, 0, 255, true);
    // console.log(`left fade | alphaMixL: ${alphaMixL.toPrecision(6)}`);
  }

  // check
  if (tl < trLp) {
    alphaMixL = 0;
    // console.log(`left fade check | alphaMixL: ${alphaMixL}`);
  }

  // RIGHT --------------------------------------------------------------------------
  // fade: next link (dis)appears
  if (th >= trL && th <= trH) {
    alphaMixR = map(th, trH, trL, 0, 255, true);
    // console.log(`right fade | verticalShift: ${verticalShift.toPrecision(6)}`);
  }

  // check
  if (th > trH) {
    alphaMixR = 0;
    // console.log(`right fade check | alphaMixR: ${alphaMixR}`);
  }

  // VERTICAL -----------------------------------------------------------------------
  // shifts using fixed points from previous link
  if (th >= trL && th <= trH) {
    verticalShift = map(th, trH, trL, 0, lineHeight * processedLines[lineIndex].n, true);
    // console.log(`moving forward (from the right) | verticalShift: ${verticalShift.toPrecision(6)}`);
  }

  // check
  if (th < trL) {
    verticalShift = lineHeight * processedLines[lineIndex].n;
    // console.log(`vertical check 1 | verticalShift: ${verticalShift.toPrecision(6)}`);
  }

  if (th > trH) {
    verticalShift = 0;
    // console.log(`vertical check 2 | verticalShift: ${verticalShift.toPrecision(6)}`);
  }

  // --------------------------------------------------------------------------------
  // TRANSITIONS (coming after, preventing flickering)

  // FORWARD
  if (tr <= trH && lineIndex < processedLines.length - 1) {
    verticalShift = 0;
    alphaMixL = 255;
    alphaMixR = 0;
    lineIndex += 1;
    // console.log(`transition forward | verticalShift: ${verticalShift.toPrecision(6)}`);
    // console.log(`transition forward | alphaMixL: ${alphaMixL}, alphaMixR: ${alphaMixR}`);
  }

  // BACKWARD
  if (tl >= trH && lineIndex > 0) {
    verticalShift = processedLines[lineIndex].vp;
    alphaMixL = 0;
    alphaMixR = 255;
    lineIndex -= 1;
    // console.log(`transition backward | verticalShift: ${verticalShift.toPrecision(6)}`);
    // console.log(`transition backward | alphaMixL: ${alphaMixL}, alphaMixR: ${alphaMixR}`);
  }

  // console.log(`verticalShift: ${verticalShift.toPrecision(6)}`);
}


// --------------------------------------------------------------------------------
// file processing

function backToReading() {
  reading = true;
  // console.log(`back to reading`);
}
function loadNewFile(i) {
  fileIndex = i;

  yPosition = 0;
  yVelocity = 0;

  // console.log(`loading ${files[fileIndex]}`);
  loadChain(files[fileIndex]);

}

function prepareFiles() {
  push();
  textSize(25);
  textAlign(LEFT);
  const pFiles = [];
  for (let i = 0; i < files.length; i++) {
    const f = { 'fname': files[i] };
    f['name'] = files[i]
      .replace('.chain.txt', '')
      .replace(/[.-]/g, ' ');
    f['w'] = textWidth(f['name']) + 5;
    f['yB'] = margin + 30 + i * 30; // baseline
    f['yRt'] = f['yB'] - textAscent(f['name']); // rectangle top
    f['yRh'] = textAscent(f['name']) + textDescent(f['name']); // height
    pFiles.push(f);
  }
  pop();
  return pFiles;
}

// --------------------------------------------------------------------------------
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
      // TODO: the + 2 doesn't make sense, most likely a margin issue
      pLines.push({
        "ws": cLine.search(/\S|$/) + 2,
        "l": getCurrentLines(lIndex, 2)
      });
    // CASE: three-lines split: the previous line is the basis for cropping
    } else if (cLine[cLine.length - 1] === "|") {
      // console.log(`case |, line ${cLine}`);
      pLines.push({
        "ws": cLine.search(/\S|$/) + 2,
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

  // calculate: - transitions (tl: left, tr: right, th: half/middle, td: diff, for fades)
  //            - n° of lines - 1 for each group (n: current, np: previous, nn: next)
  //            - vertical shift (vp: previous, vn: next)
  for (let i = 0; i < pLines.length; i++) {
    // CASE: first
    if (i === 0) {
      pLines[i].tl = 0;
      pLines[i].tr = pLines[i + 1].ws * charWidth - margin;
      pLines[i].n = pLines[i].l.length - 1;
      pLines[i].np = pLines[i].l.length - 1;
      pLines[i].vp = 0;
      pLines[i].vn = lineHeight * (pLines[i].l.length - 1); // desired shift: current n° lines - 1
    // CASE: last
    } else if (i === pLines.length - 1) {
      pLines[i].tl = pLines[i - 1].tr;
      pLines[i].tr = (pLines[i].ws + 2) * charWidth;
      pLines[i].n = pLines[i].l.length - 1;
      pLines[i].np = pLines[i - 1].l.length - 1;
      pLines[i].vp = pLines[i - 1].vn;
      pLines[i].vn = lineHeight * (pLines[i].l.length - 1);
    // CASE: all others
    } else {
      pLines[i].tl = pLines[i - 1].tr;
      pLines[i].tr = pLines[i + 1].ws * charWidth - margin;
      pLines[i].n = pLines[i].l.length - 1;
      pLines[i].np = pLines[i - 1].l.length - 1;
      pLines[i].vp = pLines[i - 1].vn;
      pLines[i].vn = lineHeight * (pLines[i].l.length - 1);
    }
    pLines[i].th = (pLines[i].tl + pLines[i].tr) / 2; // midpoint
    pLines[i].td = (pLines[i].tr - pLines[i].tl) / 4; // diff for fades        fixed points:
    pLines[i].trH = Math.min(halfWidth, margin + pLines[i].th);             // transition: half
    if (pLines[i].trH < halfWidth && pLines[i].trH + pLines[i].td > halfWidth) {
      pLines[i].td = halfWidth - pLines[i].trH;
    }
    pLines[i].trR = Math.min(pLines[i].trH + pLines[i].td, width - margin); // transition: right
    pLines[i].trL = Math.max(pLines[i].trH - pLines[i].td, margin);         // transition: left
    const ii = Math.max(0, i - 1);
    pLines[i].trHp = pLines[ii].trH; // previous fixed points
    pLines[i].trLp = pLines[ii].trL;
    pLines[i].trRp = pLines[ii].trR;
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

// --------------------------------------------------------------------------------
// helpers

function helperFrames() {

  // canvas frame
  push();
  noFill();
  stroke(255,0,0);
  strokeWeight(2);
  rect(1,1, width - 2, height - 2, 5);
  pop();

  // margin frame
  push();
  noFill();
  stroke(0,0,255);
  strokeWeight(1);
  rect(margin, margin, width - 2 * margin, height - 2 * margin);
  pop();

}

function helperText(tr, tl, th, trR, trL) {

  push();

  textAlign(LEFT);
  textSize(15);
  stroke(0);

  text(`xVelocity: ${xVelocity.toPrecision(4)}`, 10, height - 50);
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

function helperTransitions(tr, tl, th) {

  push();
  textAlign(LEFT);
  textSize(15);
  strokeWeight(1);
  let c, v;

  // link guides (fixed) ------------------------------------------------------------
  v = 15;
  // halfWidth: middle, horizontal/vertical
  c = color(0);
  stroke(c);
  // line(halfWidth, 0, halfWidth, height); // vertical
  line(processedLines[lineIndex].trH, 0, processedLines[lineIndex].trH, height); // vertical
  line(0, height/2, width, height/2); // horizontal
  fill(c);
  text('trH', processedLines[lineIndex].trH + 2, v);

  // trR & trL: mid-transition on each side of halfWidth (purple)
  c = color(168, 50, 162);
  stroke(c);
  line(processedLines[lineIndex].trR, 0, processedLines[lineIndex].trR, height);
  line(processedLines[lineIndex].trL, 0, processedLines[lineIndex].trL, height);
  noStroke();
  fill(c);
  text('trL', processedLines[lineIndex].trL + 2, v);
  text('trR', processedLines[lineIndex].trR + 2, v);

  // previous link guides (fixed) ---------------------------------------------------
  v = 30;
  // dashes: https://editor.p5js.org/jeffThompson/sketches/pTeiuK7PQ
  drawingContext.setLineDash([20, 5]);

  // halfWidth: middle, horizontal/vertical
  const a = 100;
  c = color(0, a);
  stroke(c);
  // line(halfWidth, 0, halfWidth, height); // vertical
  line(processedLines[lineIndex].trHp, 0, processedLines[lineIndex].trHp, height); // vertical
  line(0, height/2, width, height/2); // horizontal
  fill(c);
  text('trHp', processedLines[lineIndex].trHp + 2, v);

  // trR & trL: mid-transition on each side of halfWidth (purple)
  c = color(168, 50, 162, a);
  stroke(c);
  line(processedLines[lineIndex].trRp, 0, processedLines[lineIndex].trRp, height);
  line(processedLines[lineIndex].trLp, 0, processedLines[lineIndex].trLp, height);
  noStroke();
  fill(c);
  text('trLp', processedLines[lineIndex].trLp + 2, v);
  text('trRp', processedLines[lineIndex].trRp + 2, v);

  drawingContext.setLineDash([]); // reset dashes

  // link guides (following mouse) --------------------------------------------------
  v = 45;
  // tr: transition right (red)
  c = color(255,0,0);
  stroke(c);
  line(tr, 0, tr, height);
  noStroke();
  fill(c);
  text('tr', tr + 2, v);

  // tl: transition left (blue)
  c = color(0,0,255);
  stroke(c);
  line(tl, 0, tl, height);
  noStroke();
  fill(c);
  text('tl', tl + 2, v);

  // th: transition boundary (midpoint transitions left/right, neon green)
  c = color(0,255,0);
  stroke(c);
  line(th, 0, th, height);
  noStroke();
  fill(c);
  text('th', th + 2, v);

  pop();

}

// --------------------------------------------------------------------------------
// scrolling mechanism

function mouseClicked() {
  if (!reading) {
    // where is the mouse? If inside one of the file rectangles, ready to select
    const mY = mouseY - yPosition;
    let j;
    for (let i = 0; i < processedFiles.length; i++) {
      if (mY > processedFiles[i].yRt && mY < processedFiles[i].yRt + processedFiles[i].yRh) {
        j = i;
        break;
      }
    }
    if (j != null && mouseX > margin && mouseX < margin + processedFiles[j].w) {
      // console.log(`fileIndex: ${fileIndex}, j: ${j}`);
      loadNewFile(j);
      cursor('default');
    } else {
      // console.log(`no file selected`);
    }
  }
}

function mousePressed() {
  dragging = true;
  previousMouseY = mouseY;
  previousMouseX = mouseX;
}

function mouseReleased() {
  dragging = false;
}

function touchStarted() {
  dragging = true;
  previousMouseY = mouseY;
  previousMouseX = mouseX;
}

function touchEnded() {
  dragging = false;
}

function keyPressed() {

  // space
  if (key === ' ') {
    reading = !reading;
  }

  if (keyCode === LEFT_ARROW) {
    xPosition -= 1;
  } else if  (keyCode === RIGHT_ARROW) {
    xPosition += 1;
  }

}
