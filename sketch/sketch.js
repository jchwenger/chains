// https://p5js.org/reference/#/p5/textFont
let fontRegular, fontItalic, fontBold;
let lineHeight, charWidth, margins;
let lineIndex, totalLines;
let whiteSpaceToCrop;
let currentLine;

function preload() {
  fontMono = loadFont('assets/fonts/LibertinusMono-Regular.otf');
  fontRegular = loadFont('assets/fonts/LinBiolinum_R.otf');
  fontItalic = loadFont('assets/fonts/LinBiolinum_RI.otf');
  fontBold = loadFont('assets/fonts/LinBiolinum_RB.otf');
  // lines = loadStrings('assets/bras-de-fer-de-lance.chain.txt');
  lines = loadStrings('assets/anothering.chain.txt');
}

function setup() {
  const canvasSize = 500;
  createCanvas(canvasSize, canvasSize);

  // remove last empty line if there is one
  lines = lines.filter(l => l.length > 0);
  // console.log(lines);

  // console.log(lines);
  // for (const el of lines) {
  //   if (el) console.log(el);
  // }

  textFont(fontMono);
  textAlign(CENTER);
  fill(0)
    .strokeWeight(0)
    .textSize(canvasSize/10);

  lineIndex = 0;
  for (l of lines) {
    if (l.match(/[¬|]$/)) break;
    lineIndex++;
  }
  currentLine = lines[lineIndex];

  charWidth = canvasSize/18;
  margins = charWidth * 2;
  lineHeight = canvasSize/15;
  totalLines = lines.length;
  whiteSpaceToCrop = 0;

}

function draw() {
  background(255);

  // frame
  push();
  noFill();
  stroke(255,0,0);
  strokeWeight(2);
  rect(0,0, width, height, 5);
  pop();

  // case: two-lines split
  currentLine = lines[lineIndex];
  // console.log(`currentLine: ${currentLine}`);
  if (currentLine[currentLine.length-1] === "¬") {
    writeLine(lineIndex, height/2)
    writeLine(lineIndex + 1, height/2 + lineHeight)
  // case: three-lines split
  } else if (currentLine[currentLine.length-1] === "|") {
    // console.log("three lines split");
    writeLine(lineIndex - 1, height/2 - lineHeight)
    writeLine(lineIndex, height/2)
    writeLine(lineIndex + 1, height/2 + lineHeight)
  // case: one currentLine
  } else {
    writeLine(lineIndex, height/2)
  }

}

function writeLine(i, h) {
  const l = lines[i]
              .slice(whiteSpaceToCrop, lines[i].length)
              .replace(/[¬\|]$/, "");
  for (let j = 0; j < l.length; j++) {
    text(l[j], margins + charWidth*j, h);
  }
}

function keyPressed() {
  if (key === " ") {

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

    // case: two-lines split: the main line is the basis for cropping
    if (currentLine[currentLine.length - 1] === "¬") {
      whiteSpaceToCrop = lines[lineIndex].search(/\S|$/);

      // console.log(`${lineIndex}/${totalLines}, two-lines`);
      // console.log(`${lineIndex}, ${lines[lineIndex]}"`);
      // console.log(`${lineIndex + 1}, ${lines[lineIndex + 1]}"`);
      // console.log("--------------------");

    // case: three-lines split: the previous line is the basis for cropping
    } else if (currentLine[currentLine.length - 1] === "|") {
      whiteSpaceToCrop = lines[lineIndex - 1].search(/\S|$/);

      // console.log(`${lineIndex}/${totalLines}, three-lines:`);
      // console.log(`${lineIndex - 1}, ${lines[lineIndex - 1]}"`);
      // console.log(`${lineIndex}, ${lines[lineIndex]}`);
      // console.log(`${lineIndex + 1}, ${lines[lineIndex + 1]}"`);
      // console.log("--------------------");

    // case: all others
    } else {
      whiteSpaceToCrop = lines[lineIndex].search(/\S|$/);
    }

    // console.log(`to crop: ${whiteSpaceToCrop}`);

  }
}
