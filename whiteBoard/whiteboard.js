// whiteboard.js

import { vscode } from "interface.js";

// detect user's colour mode
function isDarkModePreferred() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function toggleColorScheme() {
  const toolbox = document.getElementById('toolSelectionBox'),
  penbox = document.getElementById('penOptions'),
  functionBox = document.getElementById('functions'),
  functionOptions = document.querySelectorAll(".btn");

  if (isDarkModePreferred()) {
      toolbox.classList.add('dark-mode');
      penbox.classList.add('dark-mode');
      functionBox.classList.add('dark-mode');
      functionOptions.forEach(btn => {
        btn.classList.add('dark-mode');
      });
  } else {
    toolbox.classList.remove('dark-mode');
    penbox.classList.remove('dark-mode');
    functionBox.classList.remove('dark-mode');
    
    functionOptions.forEach(btn => {
      btn.classList.remove('dark-mode');
    });
  }
}
toggleColorScheme();

// Event listener for changes in color scheme preference
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', toggleColorScheme);


const canvas = document.getElementById('whiteboard'),
context = canvas.getContext('2d'),
colourButtons = document.querySelectorAll(".color"),
strokeButtons = document.querySelectorAll(".stroke"),
penOptions = document.getElementById('penOptions'),
tools = document.getElementById('toolSelectionBox'),
fun = document.getElementById('functions'),
fillColor = document.querySelector("#fill"),
storebtn = document.querySelector(".saveImage"),
clearbtn = document.querySelector(".clearCanvas"),
toolButtons = document.querySelectorAll(".tool");


// Set up canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//initialization
let tempWidth = 1,
tempColour = 'black',
selectedTool = "pen",allowUndo = true,
prevMousePosX , prevMousePosY, snapshot, singleElement = true;


let strokesStack = [];
let redoStrokesStack = [];
let currentStroke = [];

let drawing = false;

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
  console.log("start");
  currentStroke = [];
  currentStroke.push({x: e.clientX, y: e.clientY});

  drawing = true;
  singleElement = true;
  prevMousePosX = e.clientX - canvas.getBoundingClientRect().left;
  prevMousePosY = e.clientY - canvas.getBoundingClientRect().top;
  context.beginPath();
  context.lineWidth = tempWidth;
  context.strokeStyle = tempColour;
  context.fillStyle = tempColour;
  snapshot = context.getImageData(0, 0, canvas.width, canvas.height);
}

function endPosition() {
  drawing = false;

  // strokesStack.push(currentStroke);
  console.log(currentStroke);
  //context.beginPath();

  vscode.postMessage({
    type: "stroke-add",
    data: {
      points: currentStroke,
      color: tempColour,
      width: tempWidth,
    }
  });
  singleElement = false;
//context.beginPath();
}

const drawRectangle = (e) => {
  if(!fillColor.checked){
  return context.strokeRect(e.offsetX, e.offsetY, prevMousePosX - e.offsetX, prevMousePosY - e.offsetY);
  }
  context.fillRect(e.offsetX, e.offsetY, prevMousePosX - e.offsetX, prevMousePosY - e.offsetY);
};

const drawDiamond = (e) => {
  const size = Math.min(Math.abs(prevMousePosX - e.offsetX), Math.abs(prevMousePosY - e.offsetY));
  const centerX = (prevMousePosX + e.offsetX) /2;
  const centerY = (prevMousePosY + e.offsetY) /2;
  // current transformation state
  context.save();

  // trandlating the canvas to the center of the rectangle
  context.translate(centerX, centerY);

  // rotating the canvas by 45 degrees
  context.rotate((45 * Math.PI) /180);
  if(fillColor.checked){
    context.fillRect(-size /2, -size /2, size, size);
  }
  // drawing the rectangle wit rotated coordinates
  context.strokeRect(-size /2, -size /2, size, size);

  // restoring the canvas
  context.restore();

};

const drawCircle = (e) => {
  context.beginPath();

  let radius = Math.sqrt(Math.pow((prevMousePosX - e.offsetX), 2) + Math.pow((prevMousePosY - e.offsetY),2));
  context.arc(prevMousePosX, prevMousePosY, radius, 0, 2 * Math.PI);

  fillColor.checked ? context.fill() : context.stroke();
  context.stroke();
  context.closePath();
  context.beginPath();
};

function draw(e) {
  if (!drawing) return;
  // context.putImageData(snapshot,0,0);
  
  // if(singleElement){
  //   snapshotStack.push(context.getImageData(0, 0, canvas.width, canvas.height));
  //   singleElement = false;  
  // }
  context.putImageData(snapshot,0,0);
  context.lineCap = 'round';

  if(selectedTool === "rectangle"){
    drawRectangle(e);
  }
  else if(selectedTool === "diamond"){
    drawDiamond(e);
  }
  else if(selectedTool === "circle"){
    drawCircle(e);
  }
  else{
    context.strokeStyle = selectedTool === "eraser" ? '#fff':tempColour;
    context.lineTo(e.clientX, e.clientY);
    currentStroke.push({x: e.clientX, y: e.clientY});
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
  context.closePath();

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
    drawStroke(stroke.points, stroke.color, stroke.width);
  }
}



// update webview from file: draw the strokes
async function updateFromFile(strokesArr){
  strokesStack = await Promise.all(strokesArr.map(a => a));
  redrawAllStrokes();
}




// messages from extension to webview
window.addEventListener('message', e => {
  const message = e.data;
  console.log("received messgae from ext")

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
  // const link = document.createElement("a");
  // link.download = `${Date.now()}.jpg`;
  // link.href = canvas.toDataURL();
  // link.click();
  disableWhiteboard();
  canvas.style.pointerEvents = 'none';
});

canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', draw);


const state = vscode.getState();
if (state) {
  updateFromFile(state.strokes);
}