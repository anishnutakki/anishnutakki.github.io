var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() { 
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;  
  }`;

var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';
let g_fast = false;
let g_shiftPressed = false;

window.addEventListener('keydown', (event) => {
  if (event.shiftKey) {
    g_shiftPressed = true;
  }
});

window.addEventListener('keyup', (event) => {
  if (!event.shiftKey) {
    g_shiftPressed = false;
    g_fast = false;
  }
});

window.addEventListener('mousedown', (event) => {
  if (g_shiftPressed) {
    g_fast = true; 
  } else {
    g_fast = false; 
  }
});

window.addEventListener('mouseup', (event) => {
  g_fast = false; 
});


let g_headYPosition = 0;
let g_dragging = false;
let g_lastX = -1, g_lastY = -1;
let g_yaw = 0;   
let g_pitch = 0;  
var g_legAngle = 0; 
var g_wingAngle = 0; 
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
var g_shapesList = [];
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let g_globalAngle = 0;



let g_leftArmAngle = 0;
let g_boxAngle = 0;
let g_tailAngle = 0; 



let g_start = performance.now()/1000.0;
let g_seconds = performance.now()/1000.0 - g_start;
let g_animate = false; 

function actionsFromHtml() {

  document.getElementById("animationOnButton").onclick = function() { g_animate = true; };
  document.getElementById("animationOffButton").onclick = function() { g_animate = false; };

  document.getElementById("angleSlide").addEventListener('mousemove', function() {
    g_globalAngle = Number(this.value);
    renderAllShapes();
  });

    document.getElementById("legsSlide").addEventListener('input', function() {
      g_legAngle = Number(this.value);
      renderAllShapes();
    });
  
    document.getElementById("wingsSlide").addEventListener('input', function() {
      g_wingAngle = Number(this.value);
      renderAllShapes();
    });

  
  document.getElementById("headYSlider").addEventListener('input', function() {
    g_headYPosition = Number(this.value); 
    renderAllShapes(); 
  });
  document.getElementById("tailSlide").addEventListener('input', function() {
    g_tailAngle = Number(this.value);
    renderAllShapes(); 
  });
  
}


function main() {
  setupWebGL();
  connectVariablesToGLSL();
  actionsFromHtml();


  canvas.onmousedown = function(ev) { 
    g_dragging = true; 
    g_lastX = ev.clientX; 
    g_lastY = ev.clientY; 
    
  };

  canvas.onmouseup = function(ev) {
    g_dragging = false;  
  };
  
  canvas.onmousemove = function(ev) {
    if (g_dragging) {
      let factor = 100 / canvas.height;  
      let dx = factor * (ev.clientX - g_lastX);
      let dy = factor * (ev.clientY - g_lastY);

      g_yaw += dx;
      g_pitch += dy;

      if (g_pitch > 90) g_pitch = 90;
      if (g_pitch < -90) g_pitch = -90;

      g_lastX = ev.clientX;
      g_lastY = ev.clientY;
    }
  };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  requestAnimationFrame(tick);
}

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get WebGL context');
  }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders');
    return false;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

  return true;
}

function click(ev) {
  let x = ev.clientX;
  let y = ev.clientY;
  let rect = canvas.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2) / (canvas.width/2);
  y = (canvas.height/2 - (y - rect.top)) / (canvas.height/2);

  let shapeType = g_randomDrawing ? Math.floor(Math.random() * 3) : g_shape;
  let shape;

  if (shapeType === POINT) {
    shape = new Point();
  } else if (shapeType === TRIANGLE) {
    shape = new Triangle();
    const d = g_size / 200.0;
    shape.setVertices([x, y, x+d, y, x, y+d]);
  } else if (shapeType === CIRCLE) {
    shape = new Circle();
    shape.segments = g_segments;
  }

  shape.position = [x, y];
  shape.color = g_randomDrawing ? [Math.random(), Math.random(), Math.random(), 1.0] : g_selectedColor.slice();
  shape.size = g_size;

  g_shapesList.push(shape);
  renderAllShapes();
}

function tick() {
  g_seconds = performance.now()/1000.0 - g_start;

  if (g_animate || g_fast) {
    updateAnimationAngles();
  }
  
  renderAllShapes();
  
  requestAnimationFrame(tick); 
}
let g_bodyYPosition = 0;

function updateAnimationAngles() {
  if (g_animate || g_fast) {
    const speed = g_fast ? 15 : 2;

    g_leftArmAngle = 45 * Math.sin(g_seconds * speed);
    g_boxAngle = 45 * Math.cos(g_seconds * speed);
    g_legAngle = Math.sin(g_seconds * speed) * 30;
    g_wingAngle = Math.cos(g_seconds * speed) * 15;
    g_headYPosition = Math.sin(g_seconds * speed) * 0.1;

    g_tailAngle = 45 * Math.sin(g_seconds * speed);

    if (g_fast) {
      g_bodyYPosition = 0.2 * Math.sin(g_seconds*0.5 * speed); 
    }
  }
}




function getRandomColor() {
  return [Math.random(), Math.random(), Math.random(), 1.0];
}



function renderAllShapes() {
  var start = performance.now();
  renderScene();

  var duration = performance.now() - start;
  sendToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration) / 10, "numdot");
}

function renderScene(){
  var globalRotMat = new Matrix4();
  globalRotMat.rotate(g_globalAngle, 0, 1, 0);  
  globalRotMat.rotate(g_yaw, 0, 1, 0);           
  globalRotMat.rotate(g_pitch, 1, 0, 0);       
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //---------------- BODY ----------------//
  var bodyCoordinates = {
    x: -0.25,
    y: -0.6 + g_bodyYPosition,
    z: 0.0,
    width: 0.6,
    height: 0.3,
    depth: 0.3
  };

  var body = new Cube();
  body.color = g_fast ? getRandomColor() : [0.2, 0.6, 0.8, 1.0]; 
  body.matrix.translate(bodyCoordinates.x, bodyCoordinates.y, bodyCoordinates.z);
  body.matrix.scale(bodyCoordinates.width, bodyCoordinates.height, bodyCoordinates.depth);
  body.render();

  var headCoordinates = {
    x: bodyCoordinates.x + bodyCoordinates.width - 0.05,
    y: bodyCoordinates.y + 0.05 + g_headYPosition,
    z: bodyCoordinates.z + 0.025,
    width: 0.30,
    height: 0.28,
    depth: 0.25
  };
  
  var head = new Cube();
  head.color = g_fast ? getRandomColor() : [0.4, 0.7, 0.9, 1.0]; 
  head.matrix.setTranslate(headCoordinates.x, headCoordinates.y, headCoordinates.z);
  head.matrix.scale(headCoordinates.width, headCoordinates.height, headCoordinates.depth);
  head.render();
  
 // ---------------- CONE ----------------//
 var cone = new Cone();

 var coneScaleFactor = 0.12;
 
 var coneOffsetX = 0.18;  
 var coneOffsetY = headCoordinates.height / 2 + 0.12; 
 var coneOffsetZ = headCoordinates.depth / 2;  
 cone.matrix.setTranslate(
   headCoordinates.x + coneOffsetX, 
   headCoordinates.y + coneOffsetY, 
   headCoordinates.z + coneOffsetZ
 );
 

 cone.matrix.scale(coneScaleFactor, coneScaleFactor, coneScaleFactor);
cone.color = g_fast ? getRandomColor() : [1, 1, 1, 1.0]; 
 cone.render();
 

  //---------------- LEGS ----------------//
  var legWidth = 0.1;
  var upperLegHeight = 0.18;
  var legY = bodyCoordinates.y - bodyCoordinates.height / 2;

  var frontLegX = bodyCoordinates.x + bodyCoordinates.width - 0.12;
  var middleLegX = bodyCoordinates.x + bodyCoordinates.width / 2;
  var backLegX = bodyCoordinates.x + 0.12;

  var bodyCenterZ = bodyCoordinates.z;

  var legSpacing = 0.16;
  var leftLegZ = bodyCenterZ + legSpacing + 0.04;
  var rightLegZ = bodyCenterZ - legSpacing + 0.16;

  var legsRotationAngle = g_legAngle;

  var frontLeftLeg = new Cube();
  frontLeftLeg.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0];
  frontLeftLeg.matrix.setTranslate(frontLegX, legY, leftLegZ);
  frontLeftLeg.matrix.translate(0, upperLegHeight / 2, 0); 
  frontLeftLeg.matrix.rotate(legsRotationAngle, 0, 0, 1);  
  frontLeftLeg.matrix.translate(0, -upperLegHeight / 2, 0); 
  frontLeftLeg.matrix.scale(legWidth, upperLegHeight, legWidth);
  frontLeftLeg.render();

  var frontRightLeg = new Cube();
  frontRightLeg.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0];
  frontRightLeg.matrix.setTranslate(frontLegX, legY, rightLegZ);
  frontRightLeg.matrix.translate(0, upperLegHeight / 2, 0);  
  frontRightLeg.matrix.rotate(-legsRotationAngle, 0, 0, 1); 
  frontRightLeg.matrix.translate(0, -upperLegHeight / 2, 0);  
  frontRightLeg.matrix.scale(legWidth, upperLegHeight, legWidth);
  frontRightLeg.render();

 
  var middleLeftLeg = new Cube();
  middleLeftLeg.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0];
  middleLeftLeg.matrix.setTranslate(middleLegX, legY, leftLegZ);
  middleLeftLeg.matrix.translate(0, upperLegHeight / 2, 0);  
  middleLeftLeg.matrix.rotate(-legsRotationAngle, 0, 0, 1);  
  middleLeftLeg.matrix.translate(0, -upperLegHeight / 2, 0);  
  middleLeftLeg.matrix.scale(legWidth, upperLegHeight, legWidth);
  middleLeftLeg.render();


  var middleRightLeg = new Cube();
  middleRightLeg.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0];
  middleRightLeg.matrix.setTranslate(middleLegX, legY, rightLegZ);
  middleRightLeg.matrix.translate(0, upperLegHeight / 2, 0); 
  middleRightLeg.matrix.rotate(legsRotationAngle, 0, 0, 1); 
  middleRightLeg.matrix.translate(0, -upperLegHeight / 2, 0);  
  middleRightLeg.matrix.scale(legWidth, upperLegHeight, legWidth);
  middleRightLeg.render();

  
  var backLeftLeg = new Cube();
  backLeftLeg.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0];
  backLeftLeg.matrix.setTranslate(backLegX, legY, leftLegZ);
  backLeftLeg.matrix.translate(0, upperLegHeight / 2, 0);  
  backLeftLeg.matrix.rotate(legsRotationAngle, 0, 0, 1); 
  backLeftLeg.matrix.translate(0, -upperLegHeight / 2, 0);  
  backLeftLeg.matrix.scale(legWidth, upperLegHeight, legWidth);
  backLeftLeg.render();

  
  var backRightLeg = new Cube();
  backRightLeg.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0];
  backRightLeg.matrix.setTranslate(backLegX, legY, rightLegZ);
  backRightLeg.matrix.translate(0, upperLegHeight / 2, 0);  
  backRightLeg.matrix.rotate(-legsRotationAngle, 0, 0, 1);  
  backRightLeg.matrix.translate(0, -upperLegHeight / 2, 0);  
  backRightLeg.matrix.scale(legWidth, upperLegHeight, legWidth);
  backRightLeg.render();

  //---------------- WINGS ----------------//
  var wingWidth = 0.25;   
  var wingHeight = 0.02;   
  var wingDepth = 0.6;     
  

  var leftWing = new Cube();
  leftWing.color = g_fast ? getRandomColor() : [0.8, 0.9, 1.0, 0.6];
  leftWing.matrix.setTranslate(bodyCoordinates.x + bodyCoordinates.width / 2, bodyCoordinates.y + bodyCoordinates.height / 2 - 0.02, bodyCoordinates.z + 0.15);
  leftWing.matrix.rotate(-g_wingAngle, 0, 0, 1); 
  leftWing.matrix.rotate(-g_wingAngle, 1, 0, 0); 
  leftWing.matrix.scale(wingWidth, wingHeight, wingDepth);
  leftWing.render();
  
  var rightWing = new Cube();
  rightWing.color = g_fast ? getRandomColor() : [0.8, 0.9, 1.0, 0.6];
  rightWing.matrix.setTranslate(bodyCoordinates.x + bodyCoordinates.width / 2, bodyCoordinates.y + bodyCoordinates.height / 2 - 0.02, bodyCoordinates.z - 0.5);
  rightWing.matrix.rotate(g_wingAngle, 1, 0, 0);
  rightWing.matrix.rotate(g_wingAngle, 0, 0, 1);  
  rightWing.matrix.scale(wingWidth, wingHeight, wingDepth);
  rightWing.render();

// ---------------- TAIL ----------------//

var tailWidth = 0.1;    
var tailHeight = 0.1;   
var tailLength = 0.05;  

var tailBaseZ = bodyCoordinates.z - 0.2; 

var tailAngle = g_tailAngle;

var tailSegment1 = new Cube();
tailSegment1.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0]; 
tailSegment1.matrix.setTranslate(bodyCoordinates.x-0.04, bodyCoordinates.y +0.1, tailBaseZ+0.32); 
tailSegment1.matrix.rotate(tailAngle, 0, 1, 0);  
tailSegment1.matrix.scale(tailWidth, tailHeight, tailLength);  
tailSegment1.render();

var tailSegment2 = new Cube();
tailSegment2.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0]; 
tailSegment2.matrix.setTranslate(bodyCoordinates.x-0.09, bodyCoordinates.y +0.1, tailBaseZ+0.32); 
tailSegment2.matrix.rotate(tailAngle, 0, 1, 0);  
tailSegment2.matrix.scale(tailWidth, tailHeight, tailLength);
tailSegment2.render();

var tailSegment3 = new Cube();
tailSegment3.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0];
tailSegment3.matrix.setTranslate(bodyCoordinates.x-0.14, bodyCoordinates.y +0.1, tailBaseZ+0.32); 
tailSegment3.matrix.rotate(tailAngle, 0, 1, 0);  
tailSegment3.matrix.scale(tailWidth, tailHeight, tailLength);
tailSegment3.render();

var tailSegment4 = new Cube();
tailSegment4.color = g_fast ? getRandomColor() : [1,1, 1, 1];
tailSegment4.matrix.setTranslate(bodyCoordinates.x-0.14, bodyCoordinates.y +0.1, tailBaseZ+0.32); 
tailSegment4.matrix.rotate(tailAngle, 0, 1, 0); 
tailSegment4.matrix.scale(-0.15, 0.1, 0.05);
tailSegment4.render();

  //---------------- EYES ----------------//
  var eyeWidth = 0.03;
  var eyeHeight = 0.05;
  var eyeDepth = 0.05;

  var leftEye = new Cube();
  leftEye.color = g_fast ? getRandomColor() : [0.0, 1.0, 0.0, 1.0]; 
  leftEye.matrix.setTranslate(headCoordinates.x +0.3, headCoordinates.y + 0.15, headCoordinates.z + 0.17);
  leftEye.matrix.scale(eyeWidth, eyeHeight, eyeDepth);
  leftEye.render();

  var rightEye = new Cube();
  rightEye.color = g_fast ? getRandomColor() : [0.0, 1.0, 0.0, 1.0]; 
  rightEye.matrix.setTranslate(headCoordinates.x +0.3, headCoordinates.y + 0.15, headCoordinates.z + 0.04);
  rightEye.matrix.scale(eyeWidth, eyeHeight, eyeDepth);
  rightEye.render();


}

function sendToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID);
    return;
  }
  htmlElm.innerHTML = text;
}
