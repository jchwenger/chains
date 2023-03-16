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
  lines = loadStrings('assets/anothering.chain.txt');
}

function setup() {
  const canvasSize = 500;
  createCanvas(canvasSize, canvasSize);

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
    console.log(`previous text: "${lines[lineIndex]}"`);
    while (!lines[lineIndex + 1].match(/[¬|]$/)) {
      lineIndex = (lineIndex + 1) % totalLines;
      console.log(`skipping: "${lines[lineIndex]}"`);
    }
    lineIndex = (lineIndex + 1) % totalLines;
    currentLine = lines[lineIndex];
    console.log(`pressed key '${key}', lineIndex = ${lineIndex}`);
    console.log(`text: "${currentLine}"`);

    // case: two-lines split: the main line is the basis for cropping
    if (currentLine[currentLine.length - 1] === "¬") {
      whiteSpaceToCrop = lines[lineIndex].search(/\S|$/);
      console.log("two-lines");
      console.log(`"${lines[lineIndex]}"`);
      console.log(`"${lines[lineIndex + 1]}"`);
      console.log("--------------------");
    // case: three-lines split: the previous line is the basis for cropping
    } else if (currentLine[currentLine.length - 1] === "|") {
      whiteSpaceToCrop = lines[lineIndex - 1].search(/\S|$/);
      console.log("three-lines");
      console.log(`"${lines[lineIndex - 1]}"`);
      console.log(`"${lines[lineIndex]}"`);
      console.log(`"${lines[lineIndex + 1]}"`);
      console.log("--------------------");
    // case: all others
    } else {
      whiteSpaceToCrop = lines[lineIndex].search(/\S|$/);
    }
    console.log(`to crop: ${whiteSpaceToCrop}`);

  }
}
