
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() { 
    gl_Position = a_Position; 
    gl_PointSize = u_Size; 
  }`;


var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
var g_shapesList = [];
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];  
let g_size = 5;
let g_shape = POINT;
let g_segments = 10;
let g_randomDrawing = false;
function actionsFromHtml() {
  document.getElementById("green").onclick = function() { g_selectedColor = [0.0, 1.0, 0.0, 1.0]; updateColorSliders(); };
  document.getElementById("red").onclick = function() { g_selectedColor = [1.0, 0.0, 0.0, 1.0]; updateColorSliders(); };
  document.getElementById("blue").onclick = function() { g_selectedColor = [0.0, 0.0, 1.0, 1.0]; updateColorSliders(); };
  document.getElementById("clear").onclick = function() { g_shapesList = []; renderAllShapes();};
  document.getElementById("pointButton").onclick = function() { g_shape = POINT; g_randomDrawing = false;};
  document.getElementById("triButton").onclick = function() { g_shape = TRIANGLE; g_randomDrawing = false;};
  document.getElementById("cirButton").onclick = function() { g_shape = CIRCLE; g_randomDrawing = false;};
  document.getElementById("logoButton").onclick = function() {
    drawChristmasTree();
  };
  document.getElementById("randomDrawButton").onclick = function() {
    g_randomDrawing = true;
  };

  document.getElementById("redSlide").addEventListener("input", function() {
    g_selectedColor[0] = this.value / 100; 
    updateColorSliders();
  });
  document.getElementById("greenSlide").addEventListener("input", function() {
    g_selectedColor[1] = this.value / 100; 
    updateColorSliders();
  });
  document.getElementById("blueSlide").addEventListener("input", function() {
    g_selectedColor[2] = this.value / 100; 
    updateColorSliders();
  });
  document.getElementById("segSlide").addEventListener("mouseup", function() {
    g_segments = this.value;
  });

  document.getElementById("sizeSlide").addEventListener("input", function() {
    g_size = this.value;
  });
}

function updateColorSliders() {
  document.getElementById("redSlide").value = g_selectedColor[0] * 100;  // Convert back to 0-100 range
  document.getElementById("greenSlide").value = g_selectedColor[1] * 100; // Convert back to 0-100 range
  document.getElementById("blueSlide").value = g_selectedColor[2] * 100;  // Convert back to 0-100 range
}


function drawChristmasTree() {
  console.log("Drawing a Christmas tree with ornaments...");
  g_shapesList = [];

  const green = [0.0, 0.6, 0.0, 1.0];
  const brown = [0.4, 0.2, 0.0, 1.0];
  const red = [1.0, 0.2, 0.2, 1.0];
  const yellow = [1.0, 0.85, 0.0, 1.0];
  const blue = [0.0, 0.3, 0.8, 1.0];
  const purple = [0.6, 0.2, 0.8, 1.0];

  const baseY = -0.4;
  for (let i = 0; i < 4; i++) {
    const width = 0.7 - i * 0.15;
    const height = 0.2;
    const centerY = baseY + i * 0.2;

    let triangle = new Triangle();
    triangle.color = green;
    triangle.setVertices([
      -width / 2, centerY,
      width / 2, centerY,
      0.0, centerY + height
    ]);
    g_shapesList.push(triangle);
  }

  let trunk = new Triangle();
  trunk.color = brown;
  trunk.setVertices([
    -0.05, baseY - 0.2, 0.05, baseY - 0.2, -0.05, baseY,
    0.05, baseY - 0.2, 0.05, baseY, -0.05, baseY
  ]);
  g_shapesList.push(trunk);

  let star = new Triangle();
  star.color = yellow;
  star.setVertices([
    -0.03, 0.45, 0.03, 0.45, 0.0, 0.5
  ]);
  g_shapesList.push(star);

  let star2 = new Triangle();
  star2.color = yellow;
  star2.setVertices([
    0.0, 0.43, 0.03, 0.49, -0.03, 0.49
  ]);
  g_shapesList.push(star2);

  const ornamentColors = [red, blue, yellow, purple];
  const ornamentPositions = [
    [-0.25, -0.35], [0.25, -0.35],
    [-0.2, -0.15], [0.2, -0.15],
    [-0.15, 0.05], [0.15, 0.05],
    [-0.1, 0.25], [0.1, 0.25],
    [-0.05, 0.0], [0.05, -0.25],
    [-0.12, 0.15], [0.12, 0.15]
  ];

  ornamentPositions.forEach((pos, i) => {
    let ornament = new Triangle();
    ornament.color = ornamentColors[i % ornamentColors.length];
    const [x, y] = pos;
    const size = 0.03;
    ornament.setVertices([
      x, y, x + size, y, x + size / 2, y + size
    ]);
    g_shapesList.push(ornament);
  });

  renderAllShapes();
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  actionsFromHtml();
  
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) {if(ev.buttons == 1) {click(ev)}};

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get WebGL context');
  }
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders');
    return false;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return false;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return false;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return false;
  }

  return true;
}

function click(ev) {
  let x = ev.clientX;
  let y = ev.clientY;
  let rect = canvas.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  let shapeType = g_randomDrawing ? Math.floor(Math.random() * 3) : g_shape;
  let shape;

  if (shapeType === POINT) {
    shape = new Point();
  } else if (shapeType === TRIANGLE) {
    shape = new Triangle();
    const d = g_size / 200.0;
    shape.setVertices([
      x, y,
      x + d, y,
      x, y + d
    ]);
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

function renderAllShapes() {
  var start = performance.now();
  gl.clear(gl.COLOR_BUFFER_BIT);
  var len = g_shapesList.length;
  g_shapesList.forEach(function(point) {
    point.render();
  });
  var duration = performance.now() - start;
  sendToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps " + Math.floor(10000/duration)/10, "numdot");

}

function sendToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID);
  if(!htmlElm){
    console.log("Failed to get" + htmlID);
    return;
  }
  htmlElm.innerHTML = text;
}
