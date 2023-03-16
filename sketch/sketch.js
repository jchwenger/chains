// https://p5js.org/reference/#/p5/textFont
let fontRegular, fontItalic, fontBold;
let lineHeight, charWidth, margins;
let lineIndex, totalLines;
let whiteSpaceToCrop;

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


  charWidth = canvasSize/18;
  margins = charWidth * 2;
  lineHeight = canvasSize/15;
  lineIndex = 0;
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

  // case: first line
  if (lineIndex === 0) {
    writeLine(lineIndex, height/2)
    if (lines[lineIndex + 1].startsWith(" ")) {
      writeLine(lineIndex + 1, height/2 + lineHeight)
    }
  // case: last line
  } else if (lineIndex >= (totalLines - 2)) {
    writeLine(lineIndex, height/2)
  // case: all others
  } else {
    writeLine(lineIndex - 1, height/2 - lineHeight)
    writeLine(lineIndex, height/2)
    writeLine(lineIndex + 1, height/2 + lineHeight)
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
    lineIndex = (lineIndex + 1) % totalLines;
    console.log(`pressed key '${key}', lineIndex = ${lineIndex}`);
    console.log(`text: "${lines[lineIndex]}"`);

    // case: first line
    if (lineIndex === 0) {
      whiteSpaceToCrop = 0;
    // case: last line
    } else if (lineIndex >= (totalLines - 2)) {
      whiteSpaceToCrop = 0;
    // case: all others
    } else {
      i =  lines[lineIndex - 1].search(/\S|$/);
      console.log(`to crop: ${i}`);
      whiteSpaceToCrop = i;
    }

  }
}
