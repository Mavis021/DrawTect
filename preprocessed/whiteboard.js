// whiteboard.js

import { Camera2D } from "https://file%2B.vscode-resource.vscode-cdn.net/c%3A/DrawTect/preprocessed/./camera.js";
import { vscode } from "https://file%2B.vscode-resource.vscode-cdn.net/c%3A/DrawTect/preprocessed/./interface.js";
import { cubicBezierSplineFit } from "https://file%2B.vscode-resource.vscode-cdn.net/c%3A/DrawTect/preprocessed/./spline.js";

import drawShapes from "https://file%2B.vscode-resource.vscode-cdn.net/c%3A/DrawTect/preprocessed/./shapes.js";
const drawShape = new drawShapes;


// detect user's colour mode
function isDarkModePreferred() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

import { toggleColorScheme } from "https://file%2B.vscode-resource.vscode-cdn.net/c%3A/DrawTect/preprocessed/./user_mode.js";
toggleColorScheme(isDarkModePreferred());

// Event listener for changes in color scheme preference
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', toggleColorScheme);


const canvas = document.getElementById('whiteboard'),
context = canvas.getContext('2d');
export { context };

const colourButtons = document.querySelectorAll(".color"),
strokeButtons = document.querySelectorAll(".stroke"),
penOptions = document.getElementById('penOptions'),
tools = document.getElementById('toolSelectionBox'),
fun = document.getElementById('functions'),
fillColor = document.querySelector("#fill"),
smoothen = document.querySelector('#smooth'),
storebtn = document.querySelector(".saveImage"),
clearbtn = document.querySelector(".clearCanvas"),
toolButtons = document.querySelectorAll(".tool"),
enableEdit = document.getElementById('initialOptions');

const stateBools = {
  "panning": false,
  "space": false,
  "smoothing": false,
  "show_control_points": true
};




// Set up canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//initialization
let tempWidth = 1,
tempColour = 'black',
selectedTool = "pen",allowUndo = true,
prevMousePosX , prevMousePosY, snapshot, singleElement = true;

let prevCursorPos = {x:0, y:0}; 

let strokesStack = [];
let redoStrokesStack = [];
let currentStroke = [];

let drawing = false;

let camera = new Camera2D(canvas.width, canvas.height, {x:0,y:0})


class Stack{
  constructor(){
    this.items = [];
  }

  push(element){
    this.items.push(element);
  }

  // Pop out all
  pop(){
    if(this.items.length === 0){
      return null;
    }
    return this.items.pop();
  }

  // peek the previous
  peek(){
    return this.items.length === 0 ? 
    null : this.items[this.items.length --];
  }

  isEmpty(){
    return this.items.length === 0;
  }

  // stack size
  size(){
    return this.items.length;
  }
}

const snapshotStack = new Stack();

function startPosition(e) {
  if (stateBools.space){
    stateBools.panning = true;
    return;
  }


  if(smoothen.checked && selectedTool == "pen"){
    stateBools.smoothing = true;
  }
  else{
    stateBools.smoothing = false;
  }


  console.log("start");
  currentStroke = [];
  currentStroke.push({x: e.clientX + camera.pos.x, y: e.clientY + camera.pos.y});

  drawing = true;
  singleElement = true;
  // prevMousePosX = e.clientX - canvas.getBoundingClientRect().left;
  // prevMousePosY = e.clientY - canvas.getBoundingClientRect().top;
  prevMousePosX = e.clientX;
  prevMousePosY = e.clientY;
  context.beginPath();
  context.lineWidth = tempWidth;
  context.strokeStyle = tempColour;
  context.fillStyle = tempColour;
  // snapshot = context.getImageData(0, 0, canvas.width, canvas.height);
}

function endPosition() {
  if (stateBools.panning)
    stateBools.panning = false;

  if (!drawing) return;

  drawing = false;

  const stroke = (stateBools.smoothing)? cubicBezierSplineFit(currentStroke) : currentStroke;
  const type = (stateBools.smoothing)?"sp":"s";
  vscode.postMessage({
    type: "stroke-add",
    data: {
      type: type,
      points: stroke,
      color: tempColour,
      width: tempWidth,
    }
  });
  singleElement = false;
//context.beginPath();
}


function draw(e) {
  if (stateBools.panning){
    camera.pos.x -= e.clientX - prevCursorPos.x; 
    camera.pos.y -= e.clientY - prevCursorPos.y; 
    redrawAllStrokes();
  }

  prevCursorPos.x = e.clientX;
  prevCursorPos.y = e.clientY;

  if (!drawing) return;
  //context.putImageData(snapshot,0,0);
  
  // if(singleElement){
  //   snapshotStack.push(context.getImageData(0, 0, canvas.width, canvas.height));
  //   singleElement = false;  
  // }
  context.lineCap = 'round';

  if(selectedTool === "rectangle"){
   //drawShape.drawRectangle(e,prevMousePosX, prevMousePosY, fillColor);
   currentStroke = drawShape.strokeRectangle(e, prevMousePosX, prevMousePosY);
  }

  else if(selectedTool === "diamond"){
    //drawShape.drawDiamond(e, prevMousePosX, prevMousePosY, fillColor);
    currentStroke = drawShape.strokeDiamond(e, prevMousePosX, prevMousePosY);
  }

  else if(selectedTool === "circle"){
    //drawCircle(e);
  
    let tempX = e.clientX;
    let tempY = e.clientY;

    let centerX = prevMousePosX + ((tempX - prevMousePosX)/2);
    let centerY = prevMousePosY + ((tempY - prevMousePosY)/2);

    let radius = (tempX - prevMousePosX)/2;
    //   const c = 0.551915024494; // Magic number for circle approximation
  
    //   const cRadius = radius * c; // Control point distance
  
    //   const points = [
    //       { x: centerX + radius, y: centerY },    
    //       { x: centerX + radius, y: centerY + cRadius }, 
    //       { x: centerX + cRadius, y: centerY + radius }, 
    //       { x: centerX, y: centerY + radius },   
    //       { x: centerX - cRadius, y: centerY + radius }, 
    //       { x: centerX - radius, y: centerY + cRadius }, 
    //       { x: centerX - radius, y: centerY },    
    //       { x: centerX - radius, y: centerY - cRadius },
    //       { x: centerX - cRadius, y: centerY - radius }, 
    //       { x: centerX, y: centerY - radius },
    //       { x: centerX + cRadius, y: centerY - radius },
    //       { x: centerX + radius, y: centerY - cRadius }  
    //   ];
  
    //   context.beginPath();    
  
    //   context.moveTo(points[0].x, points[0].y);
  
    //   context.bezierCurveTo(points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y);
    //   context.bezierCurveTo(points[4].x, points[4].y, points[5].x, points[5].y, points[6].x, points[6].y);
    //   context.bezierCurveTo(points[7].x, points[7].y, points[8].x, points[8].y, points[9].x, points[9].y);
    //   context.bezierCurveTo(points[10].x, points[10].y, points[11].x, points[11].y, points[0].x, points[0].y);
  
    //   const numSamples = 300; // Number of samples
    //   for (let i = 0; i <= numSamples; i++) {
    //       const t = i / numSamples;
    //       const f = bezierTest(points, t); // Calculate point on the curve
    //       currentStroke.push({ x: f.x, y: f.y }); // Push point into currentStroke array
    //   }
    //   context.closePath();
  
    //   // Fill and stroke the circle
    //   context.fillStyle = 'lightblue';
    //   context.fill();
    //   context.strokeStyle = 'black';
    //   context.stroke();
  
    //   points.forEach(point => {
    //     currentStroke.push({ x: point.x, y: point.y });
    // });

    let numPoints = 150;

    const angleIncrement = (2 * Math.PI) / numPoints; 

    context.beginPath();
    for (let i = 0; i < numPoints; i++) {
        const angle = i * angleIncrement; 
        const x = centerX + radius * Math.cos(angle); 
        const y = centerY + radius * Math.sin(angle); 
        context.lineTo(x,y);
        context.closePath;
        currentStroke.push({x,y});
    }
    context.fillStyle = 'lightblue';
    context.fill();
    context.stroke();

    }
  

  else{
    context.strokeStyle = selectedTool === "eraser" ? '#fff':tempColour;
    context.lineTo(e.clientX, e.clientY);
    currentStroke.push({x: e.clientX + camera.pos.x, y: e.clientY + camera.pos.y});
    context.stroke();
  }
}

  // if(singleElement){
  //   // snapshotStack.push(context.getImageData(0, 0, canvas.width, canvas.height));
  //   singleElement = false;  
  // }
  
function disableWhiteboard(){
  allowUndo = false;
  penOptions.classList.add("disabled");
  tools.classList.add("disabled");
  fun.classList.add("disabled");
  enableEdit.classList.remove("disabled");
}

function drawStroke(stroke, color, width){
  if (stroke.length == 0) 
    return;

  context.save();
  context.strokeStyle = `${color}`;
  context.lineWidth = width;

  context.beginPath();

  context.moveTo(stroke[0].x, stroke[0].y);

  for (let point of stroke){
    context.lineTo(point.x, point.y);
  }
  context.stroke();
  context.restore();

}


function clearBackground(color){
  context.fillStyle = `${color}`;
  context.fillRect(0, 0, canvas.width, canvas.height);
}


function redrawAllStrokes(){
  console.log(`redraw all ${strokesStack.length} strokes`)

  clearBackground("white");
  for (let stroke of strokesStack){
    const strokeScreenSpace = stroke.points.map(p => {
      return camera.toScreenSpace(p);
    })

    switch (stroke.type){

      case "sp":{
        drawCubicBezierSpline(strokeScreenSpace, stroke.color, stroke.width);
        if (stateBools.show_control_points) 
          drawStroke(strokeScreenSpace, "red", 1);
        break;
      }
      default: {
        drawStroke(strokeScreenSpace, stroke.color, stroke.width);
      }
    }
  }

  
}


function drawCubicBezierSpline(points, color, width){
  const nSegments = (points.length-1)/3;

  for (let i = 0; i<nSegments; i++){
    drawCubicBezier(points.slice(i*3, i*3+4), color, width);
  }
}


function drawCubicBezier(points, color, width){
  context.beginPath();
  context.lineWidth = width;
  context.strokeStyle = `${color}`;

  context.moveTo(points[0].x, points[0].y);

  context.bezierCurveTo(
    points[1].x, points[1].y, 
    points[2].x, points[2].y, 
    points[3].x, points[3].y, 
  );

  context.stroke();
  context.closePath();
}



// update webview from file: draw the strokes
async function updateFromFile(strokesArr){
  strokesStack = await Promise.all(strokesArr.map(a => a));
  redrawAllStrokes();
}




// messages from extension to webview
window.addEventListener('message', e => {
  const message = e.data;
  console.log("received messgae from exit")

  switch (message.type){
    case 'update':{
      console.log(message);

      updateFromFile(message.data.strokes);

      vscode.setState(message.data);

      break;
    }
  }

});




// keyboard Event Listener
document.addEventListener('keydown', function(event) {

  if(!allowUndo){
    return;
  }
  if(event.ctrlKey && event.key === 'z' ){
    console.log("Undo")
    if(false && !(strokesStack.length == 0)){

      snapshot = snapshotStack.pop();
      // context.putImageData(snapshot,0,0);
      
      const lastStroke = strokesStack.pop();
      redoStrokesStack.push(lastStroke);
      redrawAllStrokes();
    }
  }
  
  else if(event.ctrlKey && event.key === 'y' ){
    if(!(redoStrokesStack.length == 0)){
      console.log("Redo")


      snapshot = snapshotStack.pop();
      // context.putImageData(snapshot,0,0);
      
      const lastUndidStroke = redoStrokesStack.pop();
      strokesStack.push(lastUndidStroke);
      drawStroke(lastUndidStroke);
    }
  }
});

document.addEventListener('keydown', function(event){

  if(event.key === 'e'){
    canvas.style.pointerEvents = 'auto';
    canvas.classList.remove("disabled");
    penOptions.classList.remove("disabled");
    tools.classList.remove("disabled");
    fun.classList.remove("disabled");
    allowUndo = true;
  }
});

document.addEventListener('keydown', function(event){
  if(event.key === 's'){
    disableWhiteboard();
    canvas.style.pointerEvents = 'none';
  }
  // if space pressed 
  if (event.key == ' '){
    stateBools.panning = true;
  }
});

document.addEventListener('keyup', function(event){
  // if space pressed 
  if (event.key == ' '){
    stateBools.space = false;
    stateBools.panning = false;
  }
});

// Mouse Event Listeners
toolButtons.forEach(btn =>{
    btn.addEventListener("click", ()=> {
      //updating the active status of tools
      console.log(btn.id);
      document.querySelector(".option.active").classList.remove("active");
      btn.classList.add("active");
      btn.id === 'eraser' ? penOptions.classList.add("disabled"):penOptions.classList.remove("disabled");
      selectedTool = btn.id;
    });
});

enableEdit.addEventListener("click",() =>{
  enableEdit.classList.add("disabled");
  canvas.style.pointerEvents = 'auto';
  canvas.classList.remove("disabled");
  penOptions.classList.remove("disabled");
  tools.classList.remove("disabled");
  fun.classList.remove("disabled");
  allowUndo = true;
});

colourButtons.forEach(btn=> {
  btn.addEventListener("click", () => {
    console.log(btn.id);
    document.querySelector(".c.active").classList.remove("active");
    btn.classList.add("active");
    tempColour = btn.id;
  });
});

strokeButtons.forEach(btn2=> {
  btn2.addEventListener("click", () => {
    console.log(btn2.id);
    document.querySelector(".s.active").classList.remove("active");
    btn2.classList.add("active");
    tempWidth = btn2.id;
  });
});

clearbtn.addEventListener("click", () =>{
  context.clearRect(0,0, canvas.width, canvas.height);
});

storebtn.addEventListener("click", ()=>{
  disableWhiteboard();
  canvas.style.pointerEvents = 'none';
});

canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', draw);

canvas.style.pointerEvents = 'none';
const state = vscode.getState();
if (state) {
  updateFromFile(state.strokes);
}