var VSHADER_SOURCE = `
 precision mediump float;
 attribute vec2 a_UV;
 attribute vec3 a_Normal;
 varying vec2 v_UV;
 varying vec4 v_VertPos;
 varying vec3 v_Normal;
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() { 
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position; 
    v_UV = a_UV; 
    v_Normal = a_Normal;
    v_VertPos = u_ModelMatrix * a_Position;
  }`;

  var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  varying vec3 v_Normal;
  uniform vec4 u_FragColor;
  varying vec4 v_VertPos;
  uniform vec3 u_lightPos;
  uniform vec3 u_lightColor;
  uniform vec3 u_cameraPos;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform int u_whichTexture;
  uniform bool u_light;
  uniform bool u_spotlight;
  uniform vec3 u_spotlightPos;
  uniform vec3 u_spotlightDir;
  uniform float u_spotlightAngle;
  
  void main() {
      vec4 baseColor;
  
      if (u_whichTexture == -3) {
          baseColor = vec4((v_Normal + 1.0)/2.0, 1.0);         // Normal visualization
      } else if (u_whichTexture == -2) {
          baseColor = u_FragColor;                             // Solid color
      } else if (u_whichTexture == -1) {
          baseColor = vec4(v_UV, 1.0, 1.0);                     // UV debug
      } else if (u_whichTexture == 0) {
          baseColor = texture2D(u_Sampler0, v_UV);
      } else if (u_whichTexture == 1) {
          baseColor = texture2D(u_Sampler1, v_UV);
      } else if (u_whichTexture == 2) {
          baseColor = texture2D(u_Sampler2, v_UV);
      } else if (u_whichTexture == 3) {
          baseColor = texture2D(u_Sampler3, v_UV);
      } else {
          baseColor = vec4(1.2, 0.2, 2.1, 1.0);                 // Error: reddish
      }
  
      if (u_spotlight) {
          // Spotlight calculation
          vec3 lightVector = u_spotlightPos - vec3(v_VertPos);
          float distance = length(lightVector);
          vec3 L = normalize(lightVector);
          vec3 spotDir = normalize(u_spotlightDir);
          
          // Calculate angle between light direction and spotlight direction
          float theta = dot(-L, spotDir);
          float cutoff = cos(u_spotlightAngle);
          
          if (theta > cutoff) {
              // Inside spotlight cone
              vec3 N = normalize(v_Normal);
              float nDotL = max(dot(N, L), 0.0);
              
              // Spotlight intensity falloff
              float intensity = (theta - cutoff) / (1.0 - cutoff);
              intensity = pow(intensity, 2.0); // Smooth falloff
              
              // Distance attenuation
              float attenuation = 1.0 / (1.0 + 0.1 * distance + 0.01 * distance * distance);
              
              vec3 diffuse = vec3(baseColor) * nDotL * intensity * attenuation * u_lightColor;
              vec3 ambient = vec3(baseColor) * 0.1; // Very low ambient
              
              gl_FragColor = vec4(clamp(diffuse + ambient, 0.0, 1.0), 1.0);
          } else {
              // Outside spotlight cone - very dark
              vec3 ambient = vec3(baseColor) * 0.05; // Very low ambient
              gl_FragColor = vec4(clamp(ambient, 0.0, 1.0), 1.0);
          }
      } else if (u_light) {
          // Full lighting calculation when light is on
          vec3 lightVector = u_lightPos - vec3(v_VertPos);
          float r = length(lightVector);
          vec3 L = normalize(lightVector);
          vec3 N = normalize(v_Normal);
          float nDotL = max(dot(N, L), 0.0);
          vec3 R = reflect(-L, N);
          vec3 E = normalize(u_cameraPos - vec3(v_VertPos));
          float specular = pow(max(dot(E, R), 0.0), 64.0) * 0.8;
  
          vec3 diffuse = vec3(baseColor) * nDotL * 0.5 * u_lightColor;
          vec3 ambient = vec3(baseColor) * 0.3;
          vec3 finalColor = diffuse + ambient + vec3(specular) * u_lightColor;
          gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
      } else {
          // Natural ambient lighting when light is "off"
          // Use the surface normal to create subtle directional shading
          vec3 N = normalize(v_Normal);
          
          // Create a soft top-down ambient light effect
          float topLight = max(dot(N, vec3(0.0, 1.0, 0.0)), 0.0) * 0.3;
          
          // Add some general ambient light from multiple directions
          float frontLight = max(dot(N, vec3(0.0, 0.0, 1.0)), 0.0) * 0.2;
          float sideLight = max(dot(N, vec3(1.0, 0.0, 0.0)), 0.0) * 0.15;
          
          // Combine ambient contributions
          float totalAmbient = 0.5 + topLight + frontLight + sideLight;
          
          vec3 naturalColor = vec3(baseColor) * totalAmbient;
          gl_FragColor = vec4(clamp(naturalColor, 0.0, 1.0), 1.0);
      }
  }`;

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
let a_Normal;

let g_leftArmAngle = 0;
let g_boxAngle = 0;
let g_tailAngle = 0; 
let u_cameraPos;
let u_lightColor;

let g_start = performance.now()/1000.0;
let g_seconds = performance.now()/1000.0 - g_start;
let g_animate = false; 
let g_light = true;
let g_normalOn = false;

// Spotlight variables
let g_spotlight = false;
let g_spotlightPos = [0, 2, 0]; // Position above the scene
let g_spotlightDir = [0, -1, 0]; // Pointing down
let g_spotlightAngle = 1.0; // Angle in radians (about 28.6 degrees)
let u_spotlight;
let u_spotlightPos;
let u_spotlightDir;
let u_spotlightAngle;

let g_lightPos = [0,1,-2];
let g_lightColorHue = 0; // 0-360 degrees for HSV hue
let g_lightColor = [1.0, 1.0, 1.0]; // RGB color
let g_colorLightOn = true; // Flag to control colored lighting

// Function to convert HSV to RGB
function hsvToRgb(h, s, v) {
  let r, g, b;
  let i = Math.floor(h * 6);
  let f = h * 6 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }

  return [r, g, b];
}

function updateLightColor() {
  if (g_colorLightOn) {
    // Convert hue (0-360) to normalized hue (0-1)
    let normalizedHue = g_lightColorHue / 360.0;
    g_lightColor = hsvToRgb(normalizedHue, 1.0, 1.0); // Full saturation and brightness
  } else {
    // Use white light when color is off
    g_lightColor = [1.0, 1.0, 1.0];
  }
}

function actionsFromHtml() {
  document.getElementById("lightOff").onclick = function() { g_light = false; };
  document.getElementById("lightOn").onclick = function() { g_light = true; };
  
  // Spotlight controls
  document.getElementById("spotlightOff").onclick = function() { 
    g_spotlight = false; 
    renderAllShapes();
  };
  document.getElementById("spotlightOn").onclick = function() { 
    g_spotlight = true; 
    renderAllShapes();
  };
  
  // Color light off button
  document.getElementById("colorLightOff").onclick = function() { 
    g_colorLightOn = false; 
    updateLightColor();
    renderAllShapes();
  };
  
  document.getElementById("animationOnButton").onclick = function() { g_animate = true; };
  document.getElementById("animationOffButton").onclick = function() { g_animate = false; };
  document.getElementById("normalOff").onclick = function() { g_normalOn = false; };
  document.getElementById("normalOn").onclick = function() { g_normalOn = true; };
  document.getElementById("angleSlide").addEventListener('mousemove', function() {
    g_globalAngle = Number(this.value);
    renderAllShapes();
  });
  document.getElementById("slideX").addEventListener('mousemove', function() {
    g_lightPos[0] = this.value/100;
    renderAllShapes();
  });
  document.getElementById("slideY").addEventListener('mousemove', function() {
    g_lightPos[1] = this.value/100;
    renderAllShapes();
  });
  document.getElementById("slideZ").addEventListener('mousemove', function() {
    g_lightPos[2] = this.value/100;
    renderAllShapes();
  });

  // Light color slider - now re-enables color when used
  document.getElementById("lightColorSlide").addEventListener('input', function() {
    g_lightColorHue = Number(this.value);
    g_colorLightOn = true; // Re-enable color lighting when slider is used
    updateLightColor();
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
  updateLightColor(); // Initialize light color

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
  g_camera.eye = new Vector3([0, 1, -3.5]); // Example position
  g_camera.at = new Vector3([0, 0, 0]);  // Looking at origin
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
  }
  
  renderAllShapes();
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
  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');

  u_light = gl.getUniformLocation(gl.program, 'u_light');
  u_lightColor = gl.getUniformLocation(gl.program, 'u_lightColor');

  // Spotlight uniform locations
  u_spotlight = gl.getUniformLocation(gl.program, 'u_spotlight');
  u_spotlightPos = gl.getUniformLocation(gl.program, 'u_spotlightPos');
  u_spotlightDir = gl.getUniformLocation(gl.program, 'u_spotlightDir');
  u_spotlightAngle = gl.getUniformLocation(gl.program, 'u_spotlightAngle');

  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');

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
  g_lightPos[0] = Math.cos(g_seconds);
  g_spotlightPos[0] = Math.cos(g_seconds);
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

  g_spotlightPos[0] = g_lightPos[0];
  g_spotlightPos[1] = g_lightPos[1];
  g_spotlightPos[2] = g_lightPos[2];

  // Set up lighting uniforms
  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  gl.uniform3f(u_lightColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);
  gl.uniform3f(u_cameraPos, g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2]);
  gl.uniform1i(u_light, g_light);
  
  // Set up spotlight uniforms
  gl.uniform1i(u_spotlight, g_spotlight);
  gl.uniform3f(u_spotlightPos, g_spotlightPos[0], g_spotlightPos[1], g_spotlightPos[2]);
  gl.uniform3f(u_spotlightDir, g_spotlightDir[0], g_spotlightDir[1], g_spotlightDir[2]);
  gl.uniform1f(u_spotlightAngle, g_spotlightAngle);

  // Add a y-offset to translate everything up
  var yOffset = 1; // Adjust this value to move the animal up
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
  if(g_normalOn) body.textureNum=-3;
  body.matrix.translate(bodyCoordinates.x, bodyCoordinates.y, bodyCoordinates.z);
  body.matrix.scale(bodyCoordinates.width, bodyCoordinates.height, bodyCoordinates.depth);
  body.render();

  gl.uniform3f(u_lightPos,g_lightPos[0],g_lightPos[1],g_lightPos[2]);
  gl.uniform3f(u_lightColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);
  gl.uniform3f(u_cameraPos,g_camera.eye.elements[0],g_camera.eye.elements[1],g_camera.eye.elements[2]);
  gl.uniform1i(u_light, g_light);
  var light = new Cube();
  light.color = [g_lightColor[0]*2, g_lightColor[1]*2, g_lightColor[2]*2, 1];
  light.matrix.translate(g_lightPos[0],g_lightPos[1],g_lightPos[2]);
  light.matrix.scale(0.1,0.1,0.1);
  light.matrix.translate(-0.5,-0.5,-0.5);
  light.render();

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
  if(g_normalOn)  head.textureNum=-3;
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
 if(g_normalOn) cone.textureNum = -3;
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
  if(g_normalOn) frontLeftLeg.textureNum=-3;
  frontLeftLeg.matrix.setTranslate(frontLegX, legY, leftLegZ);
  frontLeftLeg.matrix.translate(0, upperLegHeight / 2, 0); 
  frontLeftLeg.matrix.rotate(legsRotationAngle, 0, 0, 1);  
  frontLeftLeg.matrix.translate(0, -upperLegHeight / 2, 0); 
  frontLeftLeg.matrix.scale(legWidth, upperLegHeight, legWidth);
  frontLeftLeg.render();

  var frontRightLeg = new Cube();
  
  frontRightLeg.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0];
  if(g_normalOn) frontRightLeg.textureNum=-3;
  frontRightLeg.matrix.setTranslate(frontLegX, legY, rightLegZ);
  frontRightLeg.matrix.translate(0, upperLegHeight / 2, 0);  
  frontRightLeg.matrix.rotate(-legsRotationAngle, 0, 0, 1); 
  frontRightLeg.matrix.translate(0, -upperLegHeight / 2, 0);  
  frontRightLeg.matrix.scale(legWidth, upperLegHeight, legWidth);
  frontRightLeg.render();

 
  var middleLeftLeg = new Cube();
  
  middleLeftLeg.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0];
  if(g_normalOn) middleLeftLeg.textureNum=-3;
  middleLeftLeg.matrix.setTranslate(middleLegX, legY, leftLegZ);
  middleLeftLeg.matrix.translate(0, upperLegHeight / 2, 0);  
  middleLeftLeg.matrix.rotate(-legsRotationAngle, 0, 0, 1);  
  middleLeftLeg.matrix.translate(0, -upperLegHeight / 2, 0);  
  middleLeftLeg.matrix.scale(legWidth, upperLegHeight, legWidth);
  middleLeftLeg.render();


  var middleRightLeg = new Cube();
  
  middleRightLeg.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0];
  if(g_normalOn) middleRightLeg.textureNum=-3;
  middleRightLeg.matrix.setTranslate(middleLegX, legY, rightLegZ);
  middleRightLeg.matrix.translate(0, upperLegHeight / 2, 0); 
  middleRightLeg.matrix.rotate(legsRotationAngle, 0, 0, 1); 
  middleRightLeg.matrix.translate(0, -upperLegHeight / 2, 0);  
  middleRightLeg.matrix.scale(legWidth, upperLegHeight, legWidth);
  middleRightLeg.render();

  
  var backLeftLeg = new Cube();
  backLeftLeg.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0];
  if(g_normalOn) backLeftLeg.textureNum=-3;
  backLeftLeg.matrix.setTranslate(backLegX, legY, leftLegZ);
  backLeftLeg.matrix.translate(0, upperLegHeight / 2, 0);  
  backLeftLeg.matrix.rotate(legsRotationAngle, 0, 0, 1); 
  backLeftLeg.matrix.translate(0, -upperLegHeight / 2, 0);  
  backLeftLeg.matrix.scale(legWidth, upperLegHeight, legWidth);
  backLeftLeg.render();

  
  var backRightLeg = new Cube();
  backRightLeg.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0];
  if(g_normalOn) backRightLeg.textureNum=-3;
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
  if(g_normalOn) leftWing.textureNum=-3;
  leftWing.matrix.setTranslate(bodyCoordinates.x + bodyCoordinates.width / 2, bodyCoordinates.y + bodyCoordinates.height / 2 - 0.02, bodyCoordinates.z + 0.15);
  leftWing.matrix.rotate(-g_wingAngle, 0, 0, 1); 
  leftWing.matrix.rotate(-g_wingAngle, 1, 0, 0); 
  leftWing.matrix.scale(wingWidth, wingHeight, wingDepth);
  leftWing.render();
  
  var rightWing = new Cube();
  
  rightWing.color = g_fast ? getRandomColor() : [0.8, 0.9, 1.0, 0.6];
  if(g_normalOn) rightWing.textureNum=-3;
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
if(g_normalOn) tailSegment1.textureNum=-3;
tailSegment1.matrix.setTranslate(bodyCoordinates.x-0.04, bodyCoordinates.y +0.1, tailBaseZ+0.32); 
tailSegment1.matrix.rotate(tailAngle, 0, 1, 0);  
tailSegment1.matrix.scale(tailWidth, tailHeight, tailLength);  
tailSegment1.render();

var tailSegment2 = new Cube();
tailSegment2.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0]; 
if(g_normalOn) tailSegment2.textureNum=-3;
tailSegment2.matrix.setTranslate(bodyCoordinates.x-0.09, bodyCoordinates.y +0.1, tailBaseZ+0.32); 
tailSegment2.matrix.rotate(tailAngle, 0, 1, 0);  
tailSegment2.matrix.scale(tailWidth, tailHeight, tailLength);
tailSegment2.render();

var tailSegment3 = new Cube();
tailSegment3.color = g_fast ? getRandomColor() : [0.3, 0.6, 0.7, 1.0];
if(g_normalOn) tailSegment3.textureNum=-3;
tailSegment3.matrix.setTranslate(bodyCoordinates.x-0.14, bodyCoordinates.y +0.1, tailBaseZ+0.32); 
tailSegment3.matrix.rotate(tailAngle, 0, 1, 0);  
tailSegment3.matrix.scale(tailWidth, tailHeight, tailLength);
tailSegment3.render();

var tailSegment4 = new Cube();
tailSegment4.color = g_fast ? getRandomColor() : [1,1, 1, 1];
if(g_normalOn) tailSegment4.textureNum=-3;
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
  if(g_normalOn) leftEye.textureNum=-3;
  leftEye.matrix.setTranslate(headCoordinates.x +0.3, headCoordinates.y + 0.15, headCoordinates.z + 0.17);
  leftEye.matrix.scale(eyeWidth, eyeHeight, eyeDepth);
  leftEye.render();

  var rightEye = new Cube();
  rightEye.color = g_fast ? getRandomColor() : [0.0, 1.0, 0.0, 1.0]; 
  if(g_normalOn) rightEye.textureNum=-3;
  rightEye.matrix.setTranslate(headCoordinates.x +0.3, headCoordinates.y + 0.15, headCoordinates.z + 0.04);
  rightEye.matrix.scale(eyeWidth, eyeHeight, eyeDepth);
  rightEye.render();

  // Draw the floor
  var floor = new Cube();
  floor.color = [1.0, 0.0, 0.0, 1.0]; // Fixed 4-component color (RGBA)
  if(g_normalOn) floor.textureNum = -3;
  floor.matrix.translate(0, -0.75, 0.0);
  floor.matrix.scale(7, 1, 7);
  floor.matrix.translate(-0.5, 0, -0.5); // Center the floor
  floor.render();
  

  var sky = new Cube();
  sky.color = [0.0, 0.0, 1.0, 1.0];
  if(g_normalOn) sky.textureNum = -3;
  sky.matrix.scale(5, 4, 7);
  floor.matrix.scale(.3,.3,.3);
  sky.matrix.translate(-0.5, -0.1, -0.5);





  
  sky.render();

  var ball = new Sphere();
  ball.color = [0.0, 1.0, 1.0, 1.0];
  if(g_normalOn) sky.textureNum = -3;
  ball.matrix.scale(0.4,0.4,0.4);
  ball.matrix.translate(3,1.6,0);

  ball.render();
}

function sendToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID);
    return;
  }
  htmlElm.innerHTML = text;
}