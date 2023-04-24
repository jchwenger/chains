// --------------------------------------------------------------------------------
// Chains, Jérêmie Wenger, London, 2023
// --------------------------------------------------------------------------------

const sketch = (p) => {

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
  let lineHeight;
  let chainHeight;
  let lineIndex;
  let charWidth;
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
  let languageNamesSize;
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

  p.preload = () => {
    fontRegular = p.loadFont('assets/fonts/LinBiolinum_R.otf');
    fontItalic = p.loadFont('assets/fonts/LinBiolinum_RI.otf');
    // fontMono = p.loadFont('assets/fonts/LibertinusMono-Regular.otf');
    // fontBold = p.loadFont('assets/fonts/LinBiolinum_RB.otf');
    files = p.loadStrings('assets/filenames.english.txt');

    fsIcon = p.loadImage('assets/icons/Ic_fullscreen_36px.svg'); // https://upload.wikimedia.org/wikipedia/commons/a/a5/Ic_fullscreen_36px.svg
    fsExitIcon = p.loadImage('assets/icons/Ic_fullscreen_exit_36px.svg'); // https://upload.wikimedia.org/wikipedia/commons/8/83/Ic_fullscreen_exit_36px.svg
    p.fsI = fsIcon;
  }

  p.setup = () => {

    canvasSize = 700;
    // https://dev.to/timhuang/a-simple-way-to-detect-if-browser-is-on-a-mobile-device-with-javascript-44j3
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      p.createCanvas(screen.availWidth - 80, screen.availHeight - 80);
    } else {
      p.createCanvas(canvasSize, canvasSize * .8);
    }

    halfWidth = p.width/2;
    margin = 40;
    chainHeight = margin + (p.height - margin) / 2;

    p.fill(0)
    p.textFont(fontRegular);
    p.textAlign(p.CENTER);
    p.textSize(30);

    lineHeight = canvasSize/25;

    // remove last empty line if there is one
    files = files.filter(l => l.length > 0);

    fileIndex = 0;

    reading = false;
    dragging = false;

    yPosition = 0;
    yVelocity = 0;
    yFriction = 0.65;
    previousMouseY = p.mouseY;

    fileNamesSize = 25;
    languageNamesSize = 20;

    p.push();
    p.textSize(fileNamesSize);
    introLineHeight = p.textAscent() + p.textDescent();
    topBoundary = p.height - margin * 2 - files.length * introLineHeight;
    bottomBoundary = 0;
    p.pop();

    homeButton = p.prepareHome();
    homeLanguages = p.prepareLanguages();

    processedFiles = p.prepareFiles();
    // console.log(processedFiles);

    p.loadChain(files[fileIndex], false); // load chain but don't shift to reading

  }

  p.draw = () => {
    p.background(255);
    p.cursor('default');

    if (!reading) {
      p.intro();
    } else {
      p.chain();
    }

    p.drawHome();

    // p.helperFrames();

  }

  // --------------------------------------------------------------------------------
  // chains

  p.loadChain = (filename, shiftToReading = true) => {
    const currentSubdir = homeLanguages.f[homeLanguages.c];
    p.loadStrings(`assets/chains/${currentSubdir}/${filename}`, l => p.setupChain(l, shiftToReading));
  }

  p.setupChain = (newLines, shiftToReading = true) => {

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
      .reduce((char1, char2) => p.textWidth(char1) > p.textWidth(char2) ? char1 : char2);

    charWidth = p.textWidth(widestChar);

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
    processedLines = p.prepareLines();
    // console.log(processedLines);

    const lastGroup = processedLines[processedLines.length - 1].l;
    maxTextWidth = (lastGroup[lastGroup.length - 1].length - 1) * charWidth;

    // Calculate text width and boundaries
    leftBoundary = halfWidth;
    rightBoundary = halfWidth - maxTextWidth;

    xPosition = leftBoundary;
    xVelocity = 0;
    previousMouseX = p.mouseX;
    xFriction = 0.85;

    verticalShift = 0;
    alphaMixL = 255;
    alphaMixR = 0;

    // console.log(`chain set up, shift to reading? ${shiftToReading}`);
    if (shiftToReading) p.backToReading();
  }

  p.prepareHome = () => {
    p.push();
    p.textSize(40);
    const t ='Chains';
    const b = {
      't': t,
      'w': p.textWidth(t),
      'a': p.textAscent(t),
      'd':  p.textDescent(t),
    };
    p.pop();
    return b;
  }

  p.prepareLanguages = () => {
    let l = {
      'l': ['english', 'french'],
      'f': ['chains', 'chaînes'], // subdir name
      'c': 0 // current language
    };
    p.push();
    p.textSize(languageNamesSize);
    l['w'] = l['l'].map(t => p.textWidth(t));
    l['a'] = l['l'].map(t => p.textAscent(t));
    l['h'] = l['l'].map(t => p.textAscent(t) + p.textDescent(t));
    p.pop();
    return l;
  }

  p.drawHome = () => {
    p.push();
    p.textSize(40);
    p.textAlign(p.RIGHT);
    p.fill(255);

    // background, in case chain names overlap
    // p.stroke(0);
    p.noStroke();
    p.rect(p.width - margin - homeButton.w, margin - homeButton.a, homeButton.w, homeButton.a + homeButton.d);
    p.fill(0);

    // Chains title
    p.text(homeButton.t, p.width - margin, margin);

    // fullscreen icon
    let img;
    if (p.fullscreen()) {
      console.log(`fsc exit icon`);
      img = fsExitIcon;
    } else {
      console.log(`fsc icon`);
      img = fsIcon;
    }
    // p.image(img, margin - img.width, p.height - margin, margin, p.height - margin + img.height);
    p.image(img, 5, p.height - img.height/2 - 5, img.width/2, img.height/2);

    // where is the mouse?
    if (p.mouseX > p.width - margin - homeButton.w && p.mouseX < p.width - margin && p.mouseY > margin - homeButton.a && p.mouseY < margin + homeButton.d) { // chains
      p.cursor('pointer');
      // console.log(`pointer chains`);
    }
    p.pop();
  }

  p.intro = () => {

    // dragging logic
    if (dragging) {

      let deltaY = p.mouseY - previousMouseY;
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
    yPosition = p.constrain(yPosition, topBoundary, bottomBoundary);

    p.push();

    p.translate(0, yPosition);

    p.textSize(fileNamesSize);
    p.textAlign(p.LEFT);
    p.fill(0);
    for (let i = 0; i < files.length; i++) {
      p.text(processedFiles[i].name, margin, processedFiles[i].yB);
      // p.noFill();
      // p.rect(margin, processedFiles[i].yRt, processedFiles[i].w, processedFiles[i].yRh);
    }

    // where is the mouse?
    // If inside one of the file rectangles, ready to select
    p.fill(0);
    const mY = p.mouseY - yPosition; // allow for shifted Y position with scrolling
    let j;
    for (let i = 0; i < processedFiles.length; i++) {
      if (mY > processedFiles[i].yRt && mY < processedFiles[i].yRt + processedFiles[i].yRh) {
        j = i;
        break;
      }
    }

    p.pop();

    // draw languages with a white background
    p.push();
    p.noStroke();
    p.textSize(languageNamesSize);
    p.textAlign(p.RIGHT);
    for (let i = 0; i < homeLanguages.l.length; i++) {
      p.push();
      p.translate(p.width - margin, margin + homeButton.d + homeLanguages.h[i] * i);
      p.fill(255);
      // p.stroke(0);
      p.rect(- homeLanguages.w[i], 0, homeLanguages.w[i], homeLanguages.h[i]);
      p.noStroke();
      if (i != homeLanguages.c) {
        p.fill(0, 100);
      } else {
        p.fill(0);
      }
      p.text(homeLanguages.l[i], 0, homeLanguages.a[i]);
      p.pop();
    }
    p.pop();

    // mouse inside one of the files
    if (j != null && p.mouseX > margin && p.mouseX < margin + processedFiles[j].w) {
      p.cursor('pointer');
      // p.text(`in ${j} | ${p.mouseY} → ${mY} ${processedFiles[j].fname}`, p.mouseX, mY);
    }
    // mouse inside one of the languages
    if (p.mouseX < p.width - margin) {
      for (let i = 0; i < homeLanguages.w.length; i++) {
        if (p.mouseX > p.width - margin - homeLanguages.w[i] && p.mouseY > margin + homeButton.d + homeLanguages.h[i] * i && p.mouseY < margin + homeButton.d + homeLanguages.h[i] * (i + 1)) {
          p.cursor('pointer');
          // console.log(`pointer language ${i}`);
        }
      }
    }

    // Update previous mouse X position
    previousMouseY = p.mouseY;

    // shading effect top & bottom
    p.push();
    p.noStroke();
    const w = margin;
    const sigWidth = 5;
    for (let i = 0; i < w; i++) {
      p.fill(255, p.map(p.sigmoid(p.map(i, 0, w, -sigWidth, sigWidth)), 0, 1, 255, 0));
      p.rect(0, i, p.width, 1); // top
      p.rect(0, p.height - i, p.width, 1); // bottom
    }
    p.pop();

  }

  p.chain = () => {

    // dragging logic
    if (dragging) {

      let deltaX = p.mouseX - previousMouseX;
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
    xPosition = p.constrain(xPosition, rightBoundary, leftBoundary);

    // update our transitions
    p.transitions();

    // previous link
    if (lineIndex > 0) {
      for (let i = 0; i < processedLines[lineIndex - 1].l.length; i++) {
        p.writeLine(
          processedLines[lineIndex - 1].l[i],
          chainHeight + i * lineHeight,
          alphaMixL,
          verticalShift + processedLines[lineIndex].vp // lineHeight * (processedLines[lineIndex - 1].l.length - 1)
        );
      }
    }

    // write the text
    for (let i = 0; i < processedLines[lineIndex].l.length; i++) {
      p.writeLine(
        processedLines[lineIndex].l[i],
        chainHeight + i * lineHeight,
        255,
        verticalShift
      );
    }

    // next link
    if (lineIndex < processedLines.length - 1) {
      for (let i = 0; i < processedLines[lineIndex + 1].l.length; i++) {
        p.writeLine(
          processedLines[lineIndex + 1].l[i],
          chainHeight + i * lineHeight,
          alphaMixR,
          verticalShift - processedLines[lineIndex].vn
        );
      }
    }

    // dedication
    if (dedication && lineIndex === processedLines.length - 1) p.writeDedication(dedication, p.height - margin, p.width - margin, alphaMixR);

    // Update previous mouse X position
    previousMouseX = p.mouseX;

    // chain title
    p.push();
    p.textFont(fontItalic);
    p.textAlign(p.LEFT);
    p.textSize(fileNamesSize);
    p.text(processedFiles[fileIndex].name, margin, margin);
    p.pop();

  }

  p.writeLine = (l, h, alpha, verticalShift) => {
    p.push();
    p.fill(0, alpha);
    // console.log(`current horizontal shift: ${xPosition} | vertical shift: ${vS} | current ws: ${processedLines[lineIndex + 1].ws}, * char width: ${transition.toPrecision(6)}`);
    p.translate(xPosition, 0);
    for (let j = 0; j < l.length; j++) {
      p.text(l[j], charWidth*j, h - verticalShift);
    }
    p.pop();
  }

  p.writeDedication = (l, h, w, alpha) => {
    p.push();
    p.textSize(fileNamesSize);
    p.textAlign(p.RIGHT);
    p.fill(0, alpha);
    p.text(l, w, h);
    p.pop();
  }

  p.sigmoid = (t) => {
    return 1 / (1 + Math.exp(-t));
  }

  // --------------------------------------------------------------------------------
  // transitions: chaining utils

  p.transitions = () => {

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

    // p.helperText(tr, tl, th, trR, trL);
    // p.helperTransitions(tr, tl, th);

    // LEFT ---------------------------------------------------------------------------
    // fade: previous link (dis)appears, using fixed points from previous link
    if (tl <= trL && tl >= trLL) {
      alphaMixL = p.map(tl, trLL, trL, 0, 255, true);
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
      alphaMixR = p.map(tr, trRR, trR, 0, 255, true);
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
      verticalShift = p.map(th, trH, trL, 0, lineHeight * processedLines[lineIndex].n, true);
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

  p.switchLanguages = (i) => {
    homeLanguages.c = i;
    const cL = homeLanguages.l[i];
    // console.log(`current language ${cL}`);
    yPosition = 0;
    fileIndex = 0;
    files = p.loadStrings(`assets/filenames.${cL}.txt`, p.finaliseLanguages);
    // console.log(`done loading new language`);
  }

  p.finaliseLanguages = () => {
    topBoundary = p.height - margin * 2 - (files.length - 1) * introLineHeight;
    processedFiles = p.prepareFiles();
    // console.log(`finalising language shift`);
    p.loadChain(files[fileIndex], false); // load chain but don't shift to reading
    // console.log(`done language shift`);
  }

  p.backToReading = () => {
    reading = true;
    // console.log(`back to reading`);
  }
  p.loadNewFile = (i) => {
    fileIndex = i;

    yVelocity = 0;

    // console.log(`loading ${files[fileIndex]}`);
    p.loadChain(files[fileIndex]);

  }

  p.prepareFiles = () => {
    p.push();
    p.textSize(fileNamesSize);
    p.textAlign(p.LEFT);
    const pFiles = [];
    for (let i = 0; i < files.length; i++) {
      const f = { 'fname': files[i] };
      f['name'] = files[i]
        .replace('.chain.txt', '')
        .replace(/[.-]/g, ' ')
        .replace('_', "'");
      f['w'] = p.textWidth(f['name']) + 5;
      f['yB'] = margin + (i + 1) * introLineHeight; // baseline
      f['yRt'] = f['yB'] - p.textAscent(f['name']); // rectangle top
      f['yRh'] = p.textAscent(f['name']) + p.textDescent(f['name']); // height
      pFiles.push(f);
    }
    p.pop();
    return pFiles;
  }

  // --------------------------------------------------------------------------------
  // text processing

  p.cleanLine = (l) => {
    return l.replace(/[¬\|]$/, "");
  }

  p.getCurrentLines = (i, nLines) => {
    let l = [];
    if (nLines === 1) {
      l.push(p.cleanLine(lines[i]));
    } else if (nLines === 2) {
      l.push(p.cleanLine(lines[i]))
      l.push(p.cleanLine(lines[i+1]));
    } else if (nLines === 3) {
      l.push(p.cleanLine(lines[i-1]));
      l.push(p.cleanLine(lines[i]));
      l.push(p.cleanLine(lines[i+1]));
    }
    return l;
  }

  p.prepareLines = () => {
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
          "l": p.getCurrentLines(lIndex, 2)
        });
        // CASE: three-lines split: the previous line is the basis for cropping
      } else if (cLine[cLine.length - 1] === "|") {
        // console.log(`case |, line ${lines[lIndex - 1]}`);
        pLines.push({
          "ws": lines[lIndex - 1].search(/\S|$/),
          "l": p.getCurrentLines(lIndex, 3)
        });
        // CASE: all others: : the main line is the basis for cropping
        // TODO: is this third branch necessary?
      } else {
        // console.log(`case other, line ${cLine}`);
        pLines.push({
          "ws": cLine.search(/\S|$/),
          "l": p.getCurrentLines(lIndex, 1)
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

  p.helperFrames = () => {

    // canvas frame
    p.push();
    p.noFill();
    p.stroke(255,0,0);
    p.strokeWeight(2);
    p.rect(1,1, p.width - 2, p.height - 2, 5);
    p.pop();

    // margin frame
    p.push();
    p.noFill();
    p.stroke(0,0,255);
    p.strokeWeight(1);
    p.rect(margin, margin, p.width - 2 * margin, p.height - 2 * margin);
    p.pop();

  }

  p.helperText = (tr, tl, th, trR, trL) => {

    p.push();

    p.textAlign(p.LEFT);
    p.textSize(15);
    p.stroke(0);

    p.text(`xVelocity: ${xVelocity.toPrecision(4)}`, 10, p.height - 50);
    p.text(`lineIndex: ${lineIndex}/${processedLines.length - 1}`, 10, p.height - 30);
    p.text(`xPosition: ${xPosition.toPrecision(6)}`, 10, p.height - 10);

    p.text(`alphaMixL: ${alphaMixL.toPrecision(6)}`, 130, p.height - 50);
    p.text(`alphaMixR: ${alphaMixR.toPrecision(6)}`, 130, p.height - 30);
    p.text(`verticalShift: ${verticalShift.toPrecision(4)}`, 130, p.height - 10);

    p.text(`tLeft: ${trL.toPrecision(6)}`, p.width - 190, p.height - 50);
    p.text(`tRight: ${trR.toPrecision(6)}`, p.width - 190, p.height - 30);
    p.text(`tHalf: ${halfWidth}`, p.width - 190, p.height - 10);

    p.text(`tl: ${tl.toPrecision(6)}`, p.width - 80, p.height - 50);
    p.text(`tr: ${tr.toPrecision(6)}`, p.width - 80, p.height - 30);
    p.text(`th: ${th.toPrecision(6)}`, p.width - 80, p.height - 10);

    p.pop();

  }

  p.helperTransitions = (tr, tl, th) => {

    p.push();
    p.textAlign(p.LEFT);
    p.textSize(15);
    p.strokeWeight(1);
    let c, v;

    // link guides (fixed) ------------------------------------------------------------
    v = 15;
    // halfWidth: middle, horizontal/vertical
    c = p.color(0);
    p.stroke(c);
    // p.line(halfWidth, 0, halfWidth, p.height); // vertical
    p.line(processedLines[lineIndex].trH, 0, processedLines[lineIndex].trH, p.height); // vertical
    p.line(0, chainHeight, p.width, chainHeight); // horizontal
    p.fill(c);
    p.text('trH', processedLines[lineIndex].trH + 2, v);

    // trR & trL: mid-transition on each side of halfWidth (purple)
    v = 30;
    c = p.color(168, 50, 162, 50);
    // p.stroke(c);
    p.noStroke();
    p.fill(c);
    p.rect(processedLines[lineIndex].trR, 0, processedLines[lineIndex].td, p.height); // rectangle right
    p.rect(processedLines[lineIndex].trLL, 0, processedLines[lineIndex].td, p.height); // rectangle left
    // p.line(processedLines[lineIndex].trR, 0, processedLines[lineIndex].trR, p.height);
    // p.line(processedLines[lineIndex].trL, 0, processedLines[lineIndex].trL, p.height);
    // p.noStroke();
    c = p.color(168, 50, 162);
    p.fill(c);
    p.text('trR', processedLines[lineIndex].trR + 2, v);
    p.text('trRR', processedLines[lineIndex].trRR + 2, v);
    p.text('trL', processedLines[lineIndex].trL + 2, v);
    p.text('trLL', processedLines[lineIndex].trLL + 2, v);

    // link guides (following mouse) --------------------------------------------------
    v = 45;
    // tr: transition right (red)
    c = p.color(255,0,0);
    p.stroke(c);
    p.line(tr, 0, tr, p.height);
    p.noStroke();
    p.fill(c);
    p.text('tr', tr + 2, v);

    // tl: transition left (blue)
    c = p.color(0,0,255);
    p.stroke(c);
    p.line(tl, 0, tl, p.height);
    p.noStroke();
    p.fill(c);
    p.text('tl', tl + 2, v);

    // th: transition boundary (midpoint transitions left/right, neon green)
    c = p.color(0,255,0);
    p.stroke(c);
    p.line(th, 0, th, p.height);
    p.noStroke();
    p.fill(c);
    p.text('th', th + 2, v);

    p.pop();

  }

  // --------------------------------------------------------------------------------
  // scrolling mechanism

  p.mouseClicked = () => {

    if (!reading) {

      // file selection
      // where is the mouse? If inside one of the file rectangles, ready to select
      const mY = p.mouseY - yPosition;
      let j;
      for (let i = 0; i < processedFiles.length; i++) {
        if (mY > processedFiles[i].yRt && mY < processedFiles[i].yRt + processedFiles[i].yRh) {
          j = i;
          break;
        }
      }
      if (j != null && p.mouseX > margin && p.mouseX < margin + processedFiles[j].w) {
        // console.log(`fileIndex: ${fileIndex}, j: ${j}`);
        p.loadNewFile(j);
        p.cursor('default');
      }

      // language selection
      if (p.mouseX < p.width - margin) {
        for (let i = 0; i < homeLanguages.w.length; i++) {
          if (p.mouseX > p.width - margin - homeLanguages.w[i] && p.mouseY > margin + homeButton.d + homeLanguages.h[i] * i && p.mouseY < margin + homeButton.d + homeLanguages.h[i] * (i + 1)) {
            if (i != homeLanguages.c) p.switchLanguages(i);
            // console.log(`pointer language ${i}`);
          }
        }
      }

    } else {
      // while reading a chain, clicking on the title brings you back to the home page
      if (p.mouseX > p.width - margin - homeButton.w && p.mouseX < p.width - margin && p.mouseY > margin - homeButton.a && p.mouseY < margin + homeButton.d) {
        reading = false;
      }
    }

    // full screen icons (both icons have the same size)...
    if (p.mouseX > margin - fsIcon.width && p.mouseX < margin && p.mouseY > p.height - margin && p.mouseY < p.height - margin + fsIcon.height) {
      let fs = p.fullscreen();
      p.fullscreen(!fs);
    }

  }

  p.mousePressed = () => {
    dragging = true;
    previousMouseY = p.mouseY;
    previousMouseX = p.mouseX;
  }

  p.mouseReleased = () => {
    dragging = false;
  }

  p.touchStarted = () => {
    dragging = true;
    previousMouseY = p.mouseY;
    previousMouseX = p.mouseX;
  }

  p.touchEnded = () => {
    dragging = false;
  }

  p.keyPressed = () => {

    // space
    if (p.key === ' ') {
      reading = !reading;
    }

    if (p.keyCode === p.LEFT_ARROW) {
      xPosition -= 1;
    } else if  (p.keyCode === p.RIGHT_ARROW) {
      xPosition += 1;
    }

  }

}

let alertShown = false; // Flag to track if the alert has been shown
let sketchInstance = null; // Variable to store the p5.js sketch instance

function createSketch() {
  // Create a new p5.js sketch instance
  sketchInstance = new p5(sketch);
}

function removeSketch() {
  // Remove the p5.js sketch instance
  if (sketchInstance) {
    sketchInstance.remove();
    sketchInstance = null;
  }
}

function checkWindowOrientation() {
  // Check if the window is in vertical orientation
  if (window.innerHeight > window.innerWidth) {
    // Remove the sketch if it was previously created
    removeSketch();
    // Alert the user to rotate their device (only once)
    if (!alertShown) {
      alert('Please rotate your device to horizontal orientation.');
      alertShown = true; // Update the flag to indicate the alert has been shown
    }
  } else {
    // Create the sketch if it was not previously created
    if (!sketchInstance) {
      createSketch();
    }
  }
}

// Call the function to check the initial window orientation
checkWindowOrientation();

// Add an event listener to check for changes in the window orientation
window.addEventListener('resize', checkWindowOrientation);
