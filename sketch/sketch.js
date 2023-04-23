let margin;
let halfWidth;

// text business
// -------------
// https://p5js.org/reference/#/p5/textFont
let lines;
let dedication;
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

// home buttons
let homeButton;
let homeLanguages;

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

// limits (intro)
// --------------
let topBoundary;
let bottomBoundary;
let fileNamesSize;
let introLineHeight;

// limits & transitions
// --------------------
let maxTextWidth;
let leftBoundary;
let rightBoundary;
let alphaMixL;
let alphaMixR;
let verticalShift;

// --------------------------------------------------------------------------------
// P5.js functions

function preload() {
  fontRegular = loadFont('assets/fonts/LinBiolinum_R.otf');
  // fontMono = loadFont('assets/fonts/LibertinusMono-Regular.otf');
  // fontItalic = loadFont('assets/fonts/LinBiolinum_RI.otf');
  // fontBold = loadFont('assets/fonts/LinBiolinum_RB.otf');
  files = loadStrings('assets/filenames.english.txt');
  // lines = loadStrings('assets/riverrun.chain.txt');

}

function setup() {

  canvasSize = 700;
  // createCanvas(screen.availWidth, screen.availHeight);
  createCanvas(canvasSize, canvasSize * .8);

  halfWidth = width/2;
  margin = 50;

  // TODO: better way of calculating lineHeight?
  lineHeight = canvasSize/25;

  fill(0)
  textFont(fontRegular);
  textAlign(CENTER);
  currentTextSize = canvasSize/15;
  textSize(35);

  // remove last empty line if there is one
  files = files.filter(l => l.length > 0);

  fileIndex = 0;

  reading = false;
  dragging = false;

  yPosition = 0;
  yVelocity = 0;
  yFriction = 0.65;
  previousMouseY = mouseY;

  push();
  fileNamesSize = 25;
  textSize(fileNamesSize);
  introLineHeight = textAscent() + textDescent();
  topBoundary = height - margin * 2 - (files.length - 1) * introLineHeight;
  bottomBoundary = 0;
  pop();

  homeButton = prepareHome();
  homeLanguages = prepareLanguages();

  processedFiles = prepareFiles();
  // console.log(processedFiles);

  loadChain(files[fileIndex], false); // load chain but don't shift to reading

}

function draw() {
  background(255);
  cursor('default');

  if (!reading) {
    intro();
  } else {
    chain();
  }

  drawHome();

  // helperFrames();

  // // console.log(` screen.availHeight: ${screen.availHeight}, screen.availWidth: ${screen.availWidth}`);
  // if(screen.availHeight < screen.availWidth){
  //   push();
  //   fill(0);
  //   textAlign(RIGHT);
  //   text("Please use Landscape!", width - margin, height - margin);
  //   pop();
  // }

}

// --------------------------------------------------------------------------------
// chains

function loadChain(filename, shiftToReading = true) {
  const currentSubdir = homeLanguages.f[homeLanguages.c];
  loadStrings(`assets/chains/${currentSubdir}/${filename}`, l => setupChain(l, shiftToReading));
}

function setupChain(newLines, shiftToReading = true) {

  lines = newLines.filter(l => l.length > 0).slice(2); // files contain the chain on one line, then *
  // console.log(`lines: ${lines}`);

  // search for dedication (last line, preceded by a line with just *
  dedication = '';

  for (const l of lines) {
    if (l === '*') {
      dedication = lines[lines.length-1];
      // console.log(`found dedication: ${dedication}`);
      break;
    }
  }

  if (dedication) lines = lines.slice(0,lines.length-2); // remove the last two lines

  // console.log(`lines: ${lines}`);

  // find the max charWidth of the current lines
  const widestChar = Array.from(new Set(lines.join("").split("")))
    .reduce((char1, char2) => textWidth(char1) > textWidth(char2) ? char1 : char2);

  charZoomFactor = 1;
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
  leftBoundary = halfWidth;
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

function prepareHome() {
  push();
  textSize(40);
  const t ='Chains';
  const b = {
    't': t,
    'w': textWidth(t),
    'a': textAscent(t),
    'd':  textDescent(t),
  };
  pop();
  return b;
}

function prepareLanguages() {
  let l = {
    'l': ['english', 'french'],
    'f': ['chains', 'chaînes'], // subdir name
    'c': 0 // current language
  };
  push();
  textSize(15);
  l['w'] = l['l'].map(t => textWidth(t));
  l['a'] = l['l'].map(t => textAscent(t));
  l['h'] = l['l'].map(t => textAscent(t) + textDescent(t));
  pop();
  return l;
}

function drawHome() {
  push();
  textSize(40);
  textAlign(RIGHT);
  fill(255);
  // background, in case chain names overlap
  // stroke(0);
  noStroke();
  rect(width - margin - homeButton.w, margin - homeButton.a, homeButton.w, homeButton.a + homeButton.d);
  fill(0);
  // Chains title
  text(homeButton.t, width - margin, margin);

  // where is the mouse?
  if (mouseX > width - margin - homeButton.w && mouseX < width - margin && mouseY > margin - homeButton.a && mouseY < margin + homeButton.d) { // chains
    cursor('pointer');
    // console.log(`pointer chains`);
  }
  pop();
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

  translate(0, yPosition);

  textSize(fileNamesSize);
  textAlign(LEFT);
  fill(0);
  for (let i = 0; i < files.length; i++) {
    text(processedFiles[i].name, margin, processedFiles[i].yB);
    // noFill();
    // rect(margin, processedFiles[i].yRt, processedFiles[i].w, processedFiles[i].yRh);
  }

  // where is the mouse?
  // If inside one of the file rectangles, ready to select
  fill(0);
  const mY = mouseY - yPosition; // allow for shifted Y position with scrolling
  let j;
  for (let i = 0; i < processedFiles.length; i++) {
    if (mY > processedFiles[i].yRt && mY < processedFiles[i].yRt + processedFiles[i].yRh) {
      j = i;
      break;
    }
  }

  pop();

  // draw languages with a white background
  push();
  noStroke();
  textSize(15);
  textAlign(RIGHT);
  for (let i = 0; i < homeLanguages.l.length; i++) {
    push();
    translate(width - margin, margin + homeButton.d + homeLanguages.h[i] * i);
    fill(255);
    // stroke(0);
    rect(- homeLanguages.w[i], 0, homeLanguages.w[i], homeLanguages.h[i]);
    noStroke();
    if (i != homeLanguages.c) {
      fill(0, 100);
    } else {
      fill(0);
    }
    text(homeLanguages.l[i], 0, homeLanguages.a[i]);
    pop();
  }
  pop();

  // mouse inside one of the files
  if (j != null && mouseX > margin && mouseX < margin + processedFiles[j].w) {
    cursor('pointer');
    // text(`in ${j} | ${mouseY} → ${mY} ${processedFiles[j].fname}`, mouseX, mY);
  }
  // mouse inside one of the languages
  if (mouseX < width - margin) {
    for (let i = 0; i < homeLanguages.w.length; i++) {
      if (mouseX > width - margin - homeLanguages.w[i] && mouseY > margin + homeButton.d + homeLanguages.h[i] * i && mouseY < margin + homeButton.d + homeLanguages.h[i] * (i + 1)) {
        cursor('pointer');
        // console.log(`pointer language ${i}`);
      }
    }
  }

  // Update previous mouse X position
  previousMouseY = mouseY;

  // shading effect top & bottom
  push();
  noStroke();
  const w = margin;
  const sigWidth = 5;
  for (let i = 0; i < w; i++) {
    fill(255, map(sigmoid(map(i, 0, w, -sigWidth, sigWidth)), 0, 1, 255, 0));
    rect(0, i, width, 1); // top
    rect(0, height - i, width, 1); // bottom
  }
  pop();

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
        verticalShift - processedLines[lineIndex].vn
      );
    }
  }

  // dedication
  if (dedication && lineIndex === processedLines.length - 1) writeDedication(dedication, height - margin, width - margin, alphaMixR);

  // Update previous mouse X position
  previousMouseX = mouseX;

  // chain title
  push();
  textAlign(LEFT);
  textSize(fileNamesSize);
  text(processedFiles[fileIndex].name, margin, margin);
  pop();

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

function writeDedication(l, h, w, alpha) {
  push();
  textSize(fileNamesSize);
  textAlign(RIGHT);
  fill(0, alpha);
  text(l, w, h);
  pop();
}

function sigmoid(t) {
  return 1 / (1 + Math.exp(-t));
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
  const trRR = processedLines[lineIndex].trRR;
  const trR = processedLines[lineIndex].trR;
  const trL = processedLines[lineIndex].trL;
  const trLL = processedLines[lineIndex].trLL;

  // helperText(tr, tl, th, trR, trL);
  helperTransitions(tr, tl, th);

  // LEFT ---------------------------------------------------------------------------
  // fade: previous link (dis)appears, using fixed points from previous link
  if (tl <= trL && tl >= trLL) {
    alphaMixL = map(tl, trLL, trL, 0, 255, true);
    // console.log(`left fade | alphaMixL: ${alphaMixL.toPrecision(6)}`);
  }

  // check
  if (tl < trLL) {
    alphaMixL = 0;
    // console.log(`left fade check | alphaMixL: ${alphaMixL}`);
  }

  // RIGHT --------------------------------------------------------------------------
  // fade: next link (dis)appears
  if (tr <= trRR && tr >= trR) {
    alphaMixR = map(tr, trRR, trR, 0, 255, true);
    // console.log(`right fade | verticalShift: ${verticalShift.toPrecision(6)}`);
  }

  // check
  if (tr > trRR) {
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

  // dedication
  if (lineIndex === processedLines.length - 1 && tr < trR) alphaMixR = 255;

  // console.log(`verticalShift: ${verticalShift.toPrecision(6)}`);
}


// --------------------------------------------------------------------------------
// file processing

function switchLanguages(i) {
  homeLanguages.c = i;
  const cL = homeLanguages.l[i];
  // console.log(`current language ${cL}`);
  fileIndex = 0;
  files = loadStrings(`assets/filenames.${cL}.txt`, finaliseLanguages);
  // console.log(`done loading new language`);
}

function finaliseLanguages() {
  topBoundary = height - margin * 2 - (files.length - 1) * introLineHeight;
  processedFiles = prepareFiles();
  // console.log(`finalising language shift`);
  loadChain(files[fileIndex], false); // load chain but don't shift to reading
  // console.log(`done language shift`);
}

function backToReading() {
  reading = true;
  // console.log(`back to reading`);
}
function loadNewFile(i) {
  fileIndex = i;

  yVelocity = 0;

  // console.log(`loading ${files[fileIndex]}`);
  loadChain(files[fileIndex]);

}

function prepareFiles() {
  push();
  textSize(fileNamesSize);
  textAlign(LEFT);
  const pFiles = [];
  for (let i = 0; i < files.length; i++) {
    const f = { 'fname': files[i] };
    f['name'] = files[i]
      .replace('.chain.txt', '')
      .replace(/[.-]/g, ' ')
      .replace('_', "'");
    f['w'] = textWidth(f['name']) + 5;
    f['yB'] = margin + i * introLineHeight; // baseline
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
      pLines.push({
        "ws": cLine.search(/\S|$/),
        "l": getCurrentLines(lIndex, 2)
      });
    // CASE: three-lines split: the previous line is the basis for cropping
    } else if (cLine[cLine.length - 1] === "|") {
      // console.log(`case |, line ${lines[lIndex - 1]}`);
      pLines.push({
        "ws": lines[lIndex - 1].search(/\S|$/),
        "l": getCurrentLines(lIndex, 3)
      });
    // CASE: all others: : the main line is the basis for cropping
    // TODO: is this third branch necessary?
    } else {
      // console.log(`case other, line ${cLine}`);
      pLines.push({
        "ws": cLine.search(/\S|$/),
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
      pLines[i].tr = pLines[i + 1].ws * charWidth;
      pLines[i].n = pLines[i].l.length - 1;
      pLines[i].np = pLines[i].l.length - 1;
      pLines[i].vp = 0;
      pLines[i].vn = lineHeight * (pLines[i].l.length - 1); // desired shift: current n° lines - 1
    // CASE: last
    } else if (i === pLines.length - 1) {
      pLines[i].tl = pLines[i - 1].tr;
      pLines[i].tr = (pLines[i].l[pLines[i].l.length - 1].length - 1) * charWidth; // end of the text
      pLines[i].n = pLines[i].l.length - 1;
      pLines[i].np = pLines[i - 1].l.length - 1;
      pLines[i].vp = pLines[i - 1].vn;
      pLines[i].vn = lineHeight * (pLines[i].l.length - 1);
    // CASE: all others
    } else {
      pLines[i].tl = pLines[i - 1].tr;
      pLines[i].tr = pLines[i + 1].ws * charWidth;
      pLines[i].n = pLines[i].l.length - 1;
      pLines[i].np = pLines[i - 1].l.length - 1;
      pLines[i].vp = pLines[i - 1].vn;
      pLines[i].vn = lineHeight * (pLines[i].l.length - 1);
    }
    pLines[i].th = (pLines[i].tl + pLines[i].tr) / 2; // midpoint
    pLines[i].td = (pLines[i].tr - pLines[i].tl) / 4; // diff for fades
    pLines[i].trH = halfWidth;             // transition: half
    pLines[i].trRR = pLines[i].trH + pLines[i].td; // transition right: right
    pLines[i].trR = pLines[i].trH; // transition right: left
    pLines[i].trL = pLines[i].trH - pLines[i].td; // transition left: right
    pLines[i].trLL = pLines[i].trH - 2 * pLines[i].td; // transition left: left
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
  v = 30;
  c = color(168, 50, 162, 50);
  // stroke(c);
  noStroke();
  fill(c);
  rect(processedLines[lineIndex].trR, 0, processedLines[lineIndex].td, height); // rectangle right
  rect(processedLines[lineIndex].trLL, 0, processedLines[lineIndex].td, height); // rectangle left
  // line(processedLines[lineIndex].trR, 0, processedLines[lineIndex].trR, height);
  // line(processedLines[lineIndex].trL, 0, processedLines[lineIndex].trL, height);
  // noStroke();
  c = color(168, 50, 162);
  fill(c);
  text('trR', processedLines[lineIndex].trR + 2, v);
  text('trRR', processedLines[lineIndex].trRR + 2, v);
  text('trL', processedLines[lineIndex].trL + 2, v);
  text('trLL', processedLines[lineIndex].trLL + 2, v);

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

    // file selection
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
    }

    // language selection
    if (mouseX < width - margin) {
      for (let i = 0; i < homeLanguages.w.length; i++) {
        if (mouseX > width - margin - homeLanguages.w[i] && mouseY > margin + homeButton.d + homeLanguages.h[i] * i && mouseY < margin + homeButton.d + homeLanguages.h[i] * (i + 1)) {
          if (i != homeLanguages.c) switchLanguages(i);
          // console.log(`pointer language ${i}`);
        }
      }
    }

  } else {
    // while reading a chain, clicking on the title brings you back to the home page
    if (mouseX > width - margin - homeButton.w && mouseX < width - margin && mouseY > margin - homeButton.a && mouseY < margin + homeButton.d) {
      reading = false;
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
