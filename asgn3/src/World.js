var VSHADER_SOURCE = `
 precision mediump float;
 attribute vec2 a_UV;
 varying vec2 v_UV;
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() { 
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position; 
    v_UV = a_UV; 
  }`;

var FSHADER_SOURCE = `
precision mediump float;
varying vec2 v_UV;
uniform vec4 u_FragColor;
uniform sampler2D u_Sampler0;
uniform sampler2D u_Sampler1;
uniform sampler2D u_Sampler2;
uniform sampler2D u_Sampler3;
uniform int u_whichTexture;
void main() {

    if (u_whichTexture == -2) {
        gl_FragColor = u_FragColor;         // Use color

    } else if (u_whichTexture == -1) {
        gl_FragColor = vec4(v_UV, 1.0, 1.0); // Use UV debug color

    } else if (u_whichTexture == 0) {
        gl_FragColor = texture2D(u_Sampler0, v_UV); // Use texture0

    } else if (u_whichTexture == 1) {
        gl_FragColor = texture2D(u_Sampler1, v_UV); // Use texture1 - now correctly using Sampler1

    } else if (u_whichTexture == 2) {
        gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else if (u_whichTexture == 3) {
        gl_FragColor = texture2D(u_Sampler3, v_UV);
    } else {
        gl_FragColor = vec4(1.2, 0.2, 2.1, 1);       // Error, put Redish
    }
}`
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
let u_whichTexture;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let a_UV;
let u_ProjectionMatrix;
let u_ViewMatrix;
let g_addBlockMode = true; 
let g_blockHeight = 1; 


let g_leftArmAngle = 0;
let g_boxAngle = 0;
let g_tailAngle = 0; 



let g_start = performance.now()/1000.0;
let g_seconds = performance.now()/1000.0 - g_start;
let g_animate = false; 

window.addEventListener('DOMContentLoaded', function() {
  updateBlockHeightStatus();
  
  // Add height support to the UI
  const heightButtons = document.createElement('div');
  heightButtons.innerHTML = `
    <button id="height1">Height 1</button>
    <button id="height2">Height 2</button>
    <button id="height3">Height 3</button>
    <button id="height4">Height 4</button>
  `;
  
  document.body.appendChild(heightButtons);
  
  document.getElementById('height1').onclick = function() { g_blockHeight = 1; updateBlockHeightStatus(); };
  document.getElementById('height2').onclick = function() { g_blockHeight = 2; updateBlockHeightStatus(); };
  document.getElementById('height3').onclick = function() { g_blockHeight = 3; updateBlockHeightStatus(); };
  document.getElementById('height4').onclick = function() { g_blockHeight = 4; updateBlockHeightStatus(); };
});

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
  updateBlockModeStatus();
  updateBlockHeightStatus();
  updateTargetBlockStatus(0, 0);
  
}
function initTextures(gl) {
  // Initialize first texture
  var texture0 = gl.createTexture();
  if (!texture0) {
    console.log('Failed to create the texture0 object');
    return false;
  }

  // Initialize second texture
  var texture1 = gl.createTexture();
  if (!texture1) {
    console.log('Failed to create the texture1 object');
    return false;
  }

  var texture2 = gl.createTexture();
  if (!texture0) {
    console.log('Failed to create the texture0 object');
    return false;
  }

  var texture3 = gl.createTexture();
  if (!texture3) {
    console.log('Failed to create the texture0 object');
    return false;
  }
  // Get the storage locations of uniforms
  var u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  var u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  var u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  var u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');

  if (!u_Sampler0 || !u_Sampler1 || !u_Sampler2 || !u_Sampler3) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }

  // Create Image objects
  var image0 = new Image();
  var image1 = new Image();
  var image2 = new Image();
  var image3 = new Image();
  
  if (!image0 || !image1 || !image2 ||!image3) {
    console.log('Failed to create the image object');
    return false;
  }

  // Register onload handlers for the images
  image0.onload = function() { loadTexture(gl, texture0, u_Sampler0, image0, 0); };
  image1.onload = function() { loadTexture(gl, texture1, u_Sampler1, image1, 1); };
  image2.onload = function() { loadTexture(gl, texture2, u_Sampler2, image2, 2); };
  image3.onload = function() { loadTexture(gl, texture3, u_Sampler3, image3, 3); };

  // Set image sources to start loading
  image0.src = 'skylava.jpg';
  image1.src = 'lavabricks.jpg'; // Add your second texture filename here
  image2.src = 'blue.jpg'
  image3.src = 'lava.jpg'

  return true;
}

function loadTexture(gl, texture, u_Sampler, image, texUnit) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis

  // Enable texture unit based on which texture we're loading
  if (texUnit === 0) {
    gl.activeTexture(gl.TEXTURE0);
  } else if (texUnit === 1) {
    gl.activeTexture(gl.TEXTURE1);
  }
  else if (texUnit === 2) {
    gl.activeTexture(gl.TEXTURE2);
  }
  else if (texUnit === 3) {
    gl.activeTexture(gl.TEXTURE3);
  }

  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Set the texture unit to the sampler
  gl.uniform1i(u_Sampler, texUnit);

  console.log('Finished loading texture ' + texUnit);
}

function main() {
  setupWebGL();
  setupCamera();
  connectVariablesToGLSL();
  actionsFromHtml();
  initTextures(gl);

  canvas.onmousedown = function(ev) { 
    g_dragging = true; 
    g_lastX = ev.clientX; 
    g_lastY = ev.clientY; 
    document.onkeydown = keydown;
  };

  canvas.onmouseup = function(ev) {
    g_dragging = false;  
  };
  
  canvas.onmousemove = function(ev) {
    if (g_dragging) {
      let factor = 200 / canvas.height;  // Doubled sensitivity from 100 to 200
      let dx = factor * (ev.clientX - g_lastX);
      let dy = factor * (ev.clientY - g_lastY);
  
      g_yaw += dx;
      g_pitch += dy;
  
      // Limit pitch to avoid flipping
      if (g_pitch > 89) g_pitch = 89;
      if (g_pitch < -89) g_pitch = -89;
  
      g_lastX = ev.clientX;
      g_lastY = ev.clientY;
      
      // Update camera direction after mouse movement
      updateCameraDirection();
    }
  };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  requestAnimationFrame(tick);
}
let g_camera;

function setupCamera() {
  // Create camera instance
  g_camera = new Camera();
  
  // Initialize camera projection with canvas dimensions
  g_camera.setupProjection(canvas.width, canvas.height);
  
  // Set initial camera position
  g_camera.eye = new Vector3([-1, 3, 0]); // Example position
  g_camera.at = new Vector3([0, 1, 0]);  // Looking at origin
  g_camera.updateViewMatrix();
}

function updateCameraDirection() {
  // Sensitivity multiplier
  const sensitivity = 0.5; // Increase this for more sensitivity

  // Convert yaw and pitch with sensitivity adjustment
  const yawRad = g_yaw * Math.PI / 180 * sensitivity;
  const pitchRad = g_pitch * Math.PI / 180 * sensitivity;

  const cosYaw = Math.cos(yawRad);
  const sinYaw = Math.sin(yawRad);
  const cosPitch = Math.cos(pitchRad);
  const sinPitch = Math.sin(pitchRad);

  // Calculate the direction vector
  const lookX = cosPitch * sinYaw;
  const lookY = sinPitch;
  const lookZ = cosPitch * cosYaw;

  // Update the camera's "at" point
  const eyeX = g_camera.eye.elements[0];
  const eyeY = g_camera.eye.elements[1];
  const eyeZ = g_camera.eye.elements[2];

  g_camera.at.elements[0] = eyeX + lookX;
  g_camera.at.elements[1] = eyeY + lookY;
  g_camera.at.elements[2] = eyeZ + lookZ;

  // Update the view matrix
  g_camera.updateViewMatrix();
}


// 32x32 hardcoded map with some multi-height walls
var g_map = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
];

var g_blockHeights = Array(32).fill().map(() => Array(32).fill(0));

// Initialize block heights based on existing map
for (let x = 0; x < 32; x++) {
  for (let z = 0; z < 32; z++) {
    if (g_map[x][z] === 1) {
      // Weighted random height: more 2-4s, fewer 1s
      const rand = Math.random();
      if (rand < 0.1) {
        g_blockHeights[x][z] = 1; // 10% chance
      } else if (rand < 0.5) {
        g_blockHeights[x][z] = 2; // 40% chance
      } else if (rand < 0.85) {
        g_blockHeights[x][z] = 3; // 35% chance
      } else {
        g_blockHeights[x][z] = 4; // 15% chance
      }
    }
  }
}



function drawMap() {
  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      if (g_map[x][z] === 1) {
        // Check if this is the block in front of the player
        const blockInFront = getBlockInFront();
        let isTargetBlock = false;
        
        if (blockInFront && blockInFront.x === x && blockInFront.z === z) {
          isTargetBlock = true;
        }
        
        // Get the height for this stack of blocks
        let height = g_blockHeights[x][z];

        for (let h = 0; h < height; h++) {
          var body = new Cube();
          
          // Set texture first - all blocks use texture 1 by default
          body.textureNum = 1;
          
          // Highlight the target block with different colors based on mode
          if (isTargetBlock && !g_addBlockMode) {
            // In delete mode, make the target block stand out with a bright color
            // Only highlight the top block of the stack
            if (h === height - 1) {
              body.color = [1.0, 0.0, 0.0, 1.0]; // Bright red for delete mode
              body.textureNum = 1; // Use color instead of texture
            }
          } else {
            body.color = [1.0, 1.0, 1.0, 1.0]; // Normal white color
          }
          
          body.matrix.scale(.4, .4, .4);
          body.matrix.translate(x - 16, h - 1.75, z - 16);
          body.render();
          
          // If this is a target block in delete mode, add a wireframe highlight
          if (isTargetBlock && !g_addBlockMode && h === height - 1) {
            // Create a slightly larger wireframe cube around the target
            var highlight = new Cube();
            highlight.color = [1.0, 0.3, 0.3, 0.7]; // Semi-transparent red
            highlight.textureNum = -2; // Use color instead of texture
            highlight.matrix.scale(0.41, 0.41, 0.41); // Slightly larger
            highlight.matrix.translate(x - 16, h - 1.75, z - 16);
            highlight.render();
          }
        }
      }
    }
  }
  
  const blockInFront = getBlockInFront();
  if (blockInFront) {
    const { x, z } = blockInFront;
    updateTargetBlockStatus(x, z);
    
    // Show cursor based on mode
    if (g_addBlockMode) {
      // Calculate the appropriate height for a new block
      const currentHeight = g_map[x][z] === 1 ? g_blockHeights[x][z] : 0;
      
      // Show a preview block in add mode at the appropriate height
      var cursorBlock = new Cube();
      cursorBlock.color = [0.0, 1.0, 0.0, 0.5]; // Semi-transparent green
      cursorBlock.textureNum = -2; // Use color instead of texture
      cursorBlock.matrix.scale(0.39, 0.39, 0.39); // Slightly smaller
      cursorBlock.matrix.translate(x - 16, currentHeight - 1.75, z - 16);
      cursorBlock.render();
      
      // Add a wireframe highlight for better visibility
      var highlightAdd = new Cube();
      highlightAdd.color = [0.0, 1.0, 0.3, 0.7]; // Semi-transparent green
      highlightAdd.textureNum = -2; // Use color instead of texture
      highlightAdd.matrix.scale(0.41, 0.41, 0.41); // Slightly larger
      highlightAdd.matrix.translate(x - 16, currentHeight - 1.75, z - 16);
      highlightAdd.render();
    } else {
      // DELETE MODE: Always show the red highlight, even if there's no block
      // If there's a block, get its height, otherwise use height 0
      const currentHeight = g_map[x][z] === 1 ? g_blockHeights[x][z] - 1 : 0;
      
      // Show red delete highlight
      var deleteHighlight = new Cube();
      deleteHighlight.color = [1.0, 0.0, 0.0, 0.7]; // Semi-transparent red
      deleteHighlight.textureNum = -2; // Use color instead of texture
      deleteHighlight.matrix.scale(0.41, 0.41, 0.41);
      deleteHighlight.matrix.translate(x - 16, currentHeight - 1.75, z - 16);
      deleteHighlight.render();
      
      // Add a wireframe cursor for better visibility
      var wireframeDelete = new Cube();
      wireframeDelete.color = [1.0, 0.3, 0.3, 0.5]; // Semi-transparent red
      wireframeDelete.textureNum = -2;
      wireframeDelete.matrix.scale(0.42, 0.42, 0.42); // Slightly larger than highlight
      wireframeDelete.matrix.translate(x - 16, currentHeight - 1.75, z - 16);
      wireframeDelete.render();
    }
  }
}




function keydown(ev) {
  switch (ev.key) {
    case 'w':
    case 'W':
      g_camera.moveForward();
      break;
    case 's':
    case 'S':
      g_camera.moveBackwards();
      break;
    case 'a':
    case 'A':
      g_camera.moveLeft();
      break;
    case 'd':
    case 'D':
      g_camera.moveRight();
      break;
      case 'q':
        case 'Q':
          console.log('Pan Left key pressed');
          g_camera.panLeft();
          break;
        case 'e':
        case 'E':
          console.log('Pan Right key pressed');
          g_camera.panRight();
          break;
    case 't':
    case 'T':
      // Use current mode to determine action
      if (g_addBlockMode) {
        addBlockInFront();
      } else {
        deleteBlockInFront();
      }
      break;
    case 'r':
    case 'R':
      // Toggle between add/delete modes
      g_addBlockMode = !g_addBlockMode;
      updateBlockModeStatus();
      break;
    case '1':
      g_blockHeight = 1;
      updateBlockHeightStatus();
      break;
    case '2':
      g_blockHeight = 2;
      updateBlockHeightStatus();
      break;
    case '3':
      g_blockHeight = 3;
      updateBlockHeightStatus();
      break;
    case '4':
      g_blockHeight = 4;
      updateBlockHeightStatus();
      break;
  }
  renderAllShapes();
}

function getBlockInFront() {
  // Get camera position and looking direction
  const eye = g_camera.eye;
  const at = g_camera.at;
  
  // Calculate forward direction vector
  const forward = new Vector3([
    at.elements[0] - eye.elements[0],
    at.elements[1] - eye.elements[1],
    at.elements[2] - eye.elements[2]
  ]);
  
  // Normalize to get unit vector
  forward.normalize();
  
  // Distance to check in front of camera
  const distance = 2.0;
  
  // Calculate position in front of camera
  const targetX = eye.elements[0] + forward.elements[0] * distance;
  const targetZ = eye.elements[2] + forward.elements[2] * distance;
  
  // Convert world coordinates to map coordinates
  // The map is centered at (0,0) and extends 16 units in each direction
  const mapX = Math.floor(targetX + 16);
  const mapZ = Math.floor(targetZ + 16);
  
  // Check if within map boundaries
  if (mapX >= 0 && mapX < 32 && mapZ >= 0 && mapZ < 32) {
    return { x: mapX, z: mapZ };
  }
  
  return null;
}

// Function to add a block in front of the player
function addBlockInFront() {
  const targetBlock = getBlockInFront();
  
  if (targetBlock) {
    const { x, z } = targetBlock;
    
    // Check if we're adding a block to an empty space or on top of an existing block
    if (g_map[x][z] === 0) {
      // Adding a block to an empty space
      g_map[x][z] = 1;
      g_blockHeights[x][z] = g_blockHeight; // Use the currently selected block height
    } else {
      // Add an additional block to the stack if it's not too high
      if (g_blockHeights[x][z] < 4) { // Limit stack height to 4
        g_blockHeights[x][z]++;
      }
    }
    
    // Visual feedback
    console.log(`Added block at position (${x}, ${z}), height: ${g_blockHeights[x][z]}`);
    
    // Render the scene with the new block
    renderAllShapes();
    
    // Update status display
    updateTargetBlockStatus(x, z);
  }
}

// Function to delete a block in front of the player
function deleteBlockInFront() {
  const targetBlock = getBlockInFront();
  
  if (targetBlock) {
    const { x, z } = targetBlock;
    
    // Only delete if there is a block at this position
    if (g_map[x][z] === 1) {
      // Reduce the height by 1
      g_blockHeights[x][z]--;
      
      // If the height is now 0, remove the block entirely
      if (g_blockHeights[x][z] <= 0) {
        g_map[x][z] = 0;
        g_blockHeights[x][z] = 0;
      }
      
      // Visual feedback
      console.log(`Removed block at position (${x}, ${z}), new height: ${g_blockHeights[x][z]}`);
      
      // Render the scene with the block removed
      renderAllShapes();
      
      // Update status display
      updateTargetBlockStatus(x, z);
    }
  }
}

// Update HTML status displays
function updateBlockModeStatus() {
  const mode = g_addBlockMode ? "ADD" : "DELETE";
  sendToHTML(`Block Mode: ${mode}`, "blockMode");
}

function updateBlockHeightStatus() {
  sendToHTML(`Block Height: ${g_blockHeight}`, "blockHeight");
}

function updateTargetBlockStatus(x, z) {
  const height = g_map[x][z] === 1 ? g_blockHeights[x][z] : 0;
  sendToHTML(`Target Block: (${x}, ${z}) - Height: ${height}`, "targetBlock");
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
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture'); // Add this line
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1'); // Add reference to second sampler

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

var g_eye = [0,0,3];
var g_at = [0,0,-100];
var g_up = [0,1,0];

function renderAllShapes() {
  var start = performance.now();

  renderScene();

  var duration = performance.now() - start;
  sendToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration) / 10, "numdot");
}

function renderScene() {
  if (!g_camera) {
    console.error("Camera not initialized!");
    return;
  }

  updateCameraDirection();
  
  // Use camera's projection matrix
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, g_camera.projectionMatrix.elements);
  
  // Use camera's view matrix
  gl.uniformMatrix4fv(u_ViewMatrix, false, g_camera.viewMatrix.elements);

  // Keep your global rotation matrix code if needed
  var globalRotMat = new Matrix4();
  globalRotMat.rotate(g_globalAngle, 0, 1, 0);  
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear buffers
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Add a y-offset to translate everything up
  var yOffset = 3.5; // Adjust this value to move the animal up

  drawMap();
  //---------------- BODY ----------------//
  var bodyCoordinates = {
    x: -0.25,
    y: -0.6 + g_bodyYPosition + yOffset, // Added yOffset
    z: 0.0,
    width: 0.6,
    height: 0.3,
    depth: 0.3
  };

  var body = new Cube();
  
  body.color = g_fast ? getRandomColor() : [0.2, 0.6, 0.8, 1.0]; 
  body.textureNum=2;
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
  head.textureNum=2;
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
 cone.textureNum = 2;
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
  frontLeftLeg.textureNum=2;
  frontLeftLeg.matrix.setTranslate(frontLegX, legY, leftLegZ);
  frontLeftLeg.matrix.translate(0, upperLegHeight / 2, 0); 
  frontLeftLeg.matrix.rotate(legsRotationAngle, 0, 0, 1);  
  frontLeftLeg.matrix.translate(0, -upperLegHeight / 2, 0); 
  frontLeftLeg.matrix.scale(legWidth, upperLegHeight, legWidth);
  frontLeftLeg.render();

  var frontRightLeg = new Cube();
  
  frontRightLeg.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0];
  frontRightLeg.textureNum=2;
  frontRightLeg.matrix.setTranslate(frontLegX, legY, rightLegZ);
  frontRightLeg.matrix.translate(0, upperLegHeight / 2, 0);  
  frontRightLeg.matrix.rotate(-legsRotationAngle, 0, 0, 1); 
  frontRightLeg.matrix.translate(0, -upperLegHeight / 2, 0);  
  frontRightLeg.matrix.scale(legWidth, upperLegHeight, legWidth);
  frontRightLeg.render();

 
  var middleLeftLeg = new Cube();
  
  middleLeftLeg.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0];
  middleLeftLeg.textureNum=2;
  middleLeftLeg.matrix.setTranslate(middleLegX, legY, leftLegZ);
  middleLeftLeg.matrix.translate(0, upperLegHeight / 2, 0);  
  middleLeftLeg.matrix.rotate(-legsRotationAngle, 0, 0, 1);  
  middleLeftLeg.matrix.translate(0, -upperLegHeight / 2, 0);  
  middleLeftLeg.matrix.scale(legWidth, upperLegHeight, legWidth);
  middleLeftLeg.render();


  var middleRightLeg = new Cube();
  
  middleRightLeg.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0];
  middleRightLeg.textureNum=2;
  middleRightLeg.matrix.setTranslate(middleLegX, legY, rightLegZ);
  middleRightLeg.matrix.translate(0, upperLegHeight / 2, 0); 
  middleRightLeg.matrix.rotate(legsRotationAngle, 0, 0, 1); 
  middleRightLeg.matrix.translate(0, -upperLegHeight / 2, 0);  
  middleRightLeg.matrix.scale(legWidth, upperLegHeight, legWidth);
  middleRightLeg.render();

  
  var backLeftLeg = new Cube();
  backLeftLeg.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0];
  backLeftLeg.textureNum=2;
  backLeftLeg.matrix.setTranslate(backLegX, legY, leftLegZ);
  backLeftLeg.matrix.translate(0, upperLegHeight / 2, 0);  
  backLeftLeg.matrix.rotate(legsRotationAngle, 0, 0, 1); 
  backLeftLeg.matrix.translate(0, -upperLegHeight / 2, 0);  
  backLeftLeg.matrix.scale(legWidth, upperLegHeight, legWidth);
  backLeftLeg.render();

  
  var backRightLeg = new Cube();
  backRightLeg.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0];
  backRightLeg.textureNum=2;
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
  leftWing.textureNum=2;
  leftWing.matrix.setTranslate(bodyCoordinates.x + bodyCoordinates.width / 2, bodyCoordinates.y + bodyCoordinates.height / 2 - 0.02, bodyCoordinates.z + 0.15);
  leftWing.matrix.rotate(-g_wingAngle, 0, 0, 1); 
  leftWing.matrix.rotate(-g_wingAngle, 1, 0, 0); 
  leftWing.matrix.scale(wingWidth, wingHeight, wingDepth);
  leftWing.render();
  
  var rightWing = new Cube();
  
  rightWing.color = g_fast ? getRandomColor() : [0.8, 0.9, 1.0, 0.6];
  rightWing.textureNum=2;
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
tailSegment1.textureNum=2;
tailSegment1.matrix.setTranslate(bodyCoordinates.x-0.04, bodyCoordinates.y +0.1, tailBaseZ+0.32); 
tailSegment1.matrix.rotate(tailAngle, 0, 1, 0);  
tailSegment1.matrix.scale(tailWidth, tailHeight, tailLength);  
tailSegment1.render();

var tailSegment2 = new Cube();
tailSegment2.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0]; 
tailSegment2.textureNum=2;
tailSegment2.matrix.setTranslate(bodyCoordinates.x-0.09, bodyCoordinates.y +0.1, tailBaseZ+0.32); 
tailSegment2.matrix.rotate(tailAngle, 0, 1, 0);  
tailSegment2.matrix.scale(tailWidth, tailHeight, tailLength);
tailSegment2.render();

var tailSegment3 = new Cube();
tailSegment3.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0];
tailSegment3.textureNum=2;
tailSegment3.matrix.setTranslate(bodyCoordinates.x-0.14, bodyCoordinates.y +0.1, tailBaseZ+0.32); 
tailSegment3.matrix.rotate(tailAngle, 0, 1, 0);  
tailSegment3.matrix.scale(tailWidth, tailHeight, tailLength);
tailSegment3.render();

var tailSegment4 = new Cube();
tailSegment4.color = g_fast ? getRandomColor() : [1,1, 1, 1];
tailSegment4.textureNum=2;
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
  leftEye.textureNum=2;
  leftEye.matrix.setTranslate(headCoordinates.x +0.3, headCoordinates.y + 0.15, headCoordinates.z + 0.17);
  leftEye.matrix.scale(eyeWidth, eyeHeight, eyeDepth);
  leftEye.render();

  var rightEye = new Cube();
  rightEye.color = g_fast ? getRandomColor() : [0.0, 1.0, 0.0, 1.0]; 
  rightEye.textureNum=2;
  rightEye.matrix.setTranslate(headCoordinates.x +0.3, headCoordinates.y + 0.15, headCoordinates.z + 0.04);
  rightEye.matrix.scale(eyeWidth, eyeHeight, eyeDepth);
  rightEye.render();

  // Draw the floor
  var floor = new Cube();
  floor.color = [1.0, 0.0, 0.0, 1.0]; // Fixed 4-component color (RGBA)
  floor.textureNum = 3;
  floor.matrix.translate(0, -0.75, 0.0);
  floor.matrix.scale(32, 0, 32);
  floor.matrix.scale(.4,0,.4);
  floor.matrix.translate(-0.5, 0, -0.5); // Center the floor
  floor.render();
  

  var sky = new Cube();
  sky.color = [1.0, 0.0, 0.0, 0.0, 1.0];
  sky.textureNum = 0;
  sky.matrix.scale(32, 100, 32);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.render();
}

function sendToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID);
    return;
  }
  htmlElm.innerHTML = text;
}