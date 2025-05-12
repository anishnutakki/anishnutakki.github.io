// Camera.js
function Camera() {
    this.fov = 60;
    this.eye = new Vector3([0, 0, 3]);
    this.at = new Vector3([0, 0, -1]);
    this.up = new Vector3([0, 1, 0]);
    
    this.speed = 0.2; // Movement speed
    this.panSpeed = 5; // Pan speed in degrees
    
    this.viewMatrix = new Matrix4();
    this.updateViewMatrix();
    
    this.projectionMatrix = new Matrix4();
    // DON'T reference canvas here - we'll set this up later
  }
  
  // Add methods to the prototype
  Camera.prototype.updateViewMatrix = function() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0], this.at.elements[1], this.at.elements[2],
      this.up.elements[0], this.up.elements[1], this.up.elements[2]
    );
  };
  
  // Setup projection matrix
  Camera.prototype.setupProjection = function(width, height) {
    if (width && height) {
      this.projectionMatrix.setPerspective(this.fov, width/height, 0.1, 100.0);
    }
  };
  
  Camera.prototype.moveForward = function(speed) {
    if (speed === undefined) speed = this.speed;
    let f = [
      this.at.elements[0] - this.eye.elements[0],
      this.at.elements[1] - this.eye.elements[1],
      this.at.elements[2] - this.eye.elements[2]
    ];
    let length = Math.sqrt(f[0] * f[0] + f[1] * f[1] + f[2] * f[2]);
    f[0] /= length;
    f[1] /= length;
    f[2] /= length;
    f[0] *= speed;
    f[1] *= speed;
    f[2] *= speed;
    this.eye.elements[0] += f[0];
    this.eye.elements[1] += f[1];
    this.eye.elements[2] += f[2];
    this.at.elements[0] += f[0];
    this.at.elements[1] += f[1];
    this.at.elements[2] += f[2];
    this.updateViewMatrix();
  };
  
  Camera.prototype.moveBackwards = function(speed) {
    if (speed === undefined) speed = this.speed;
    let b = [
      this.eye.elements[0] - this.at.elements[0],
      this.eye.elements[1] - this.at.elements[1],
      this.eye.elements[2] - this.at.elements[2]
    ];
    let length = Math.sqrt(b[0] * b[0] + b[1] * b[1] + b[2] * b[2]);
    b[0] /= length;
    b[1] /= length;
    b[2] /= length;
    b[0] *= speed;
    b[1] *= speed;
    b[2] *= speed;
    this.eye.elements[0] += b[0];
    this.eye.elements[1] += b[1];
    this.eye.elements[2] += b[2];
    this.at.elements[0] += b[0];
    this.at.elements[1] += b[1];
    this.at.elements[2] += b[2];
    this.updateViewMatrix();
  };
  
  Camera.prototype.moveRight = function(speed) {
    if (speed === undefined) speed = this.speed;
    let f = [
      this.at.elements[0] - this.eye.elements[0],
      this.at.elements[1] - this.eye.elements[1],
      this.at.elements[2] - this.eye.elements[2]
    ];
    let length = Math.sqrt(f[0] * f[0] + f[1] * f[1] + f[2] * f[2]);
    f[0] /= length;
    f[1] /= length;
    f[2] /= length;
    let s = [
      this.up.elements[1] * f[2] - this.up.elements[2] * f[1],
      this.up.elements[2] * f[0] - this.up.elements[0] * f[2],
      this.up.elements[0] * f[1] - this.up.elements[1] * f[0]
    ];
    length = Math.sqrt(s[0] * s[0] + s[1] * s[1] + s[2] * s[2]);
    s[0] /= length;
    s[1] /= length;
    s[2] /= length;
    // Negate for left direction
    s[0] *= -speed;
    s[1] *= -speed;
    s[2] *= -speed;
    this.eye.elements[0] += s[0];
    this.eye.elements[1] += s[1];
    this.eye.elements[2] += s[2];
    this.at.elements[0] += s[0];
    this.at.elements[1] += s[1];
    this.at.elements[2] += s[2];
    this.updateViewMatrix();
  };
  
  
  Camera.prototype.moveLeft = function(speed) {
    if (speed === undefined) speed = this.speed;
    let f = [
      this.at.elements[0] - this.eye.elements[0],
      this.at.elements[1] - this.eye.elements[1],
      this.at.elements[2] - this.eye.elements[2]
    ];
    let length = Math.sqrt(f[0] * f[0] + f[1] * f[1] + f[2] * f[2]);
    f[0] /= length;
    f[1] /= length;
    f[2] /= length;
    let s = [
      this.up.elements[1] * f[2] - this.up.elements[2] * f[1],
      this.up.elements[2] * f[0] - this.up.elements[0] * f[2],
      this.up.elements[0] * f[1] - this.up.elements[1] * f[0]
    ];
    length = Math.sqrt(s[0] * s[0] + s[1] * s[1] + s[2] * s[2]);
    s[0] /= length;
    s[1] /= length;
    s[2] /= length;
    s[0] *= speed;
    s[1] *= speed;
    s[2] *= speed;
    this.eye.elements[0] += s[0];
    this.eye.elements[1] += s[1];
    this.eye.elements[2] += s[2];
    this.at.elements[0] += s[0];
    this.at.elements[1] += s[1];
    this.at.elements[2] += s[2];
    this.updateViewMatrix();
  };
  
  
  Camera.prototype.panLeft = function() {
    g_globalAngle = g_globalAngle-5;
  };
  
  Camera.prototype.panRight = function() {
    g_globalAngle = g_globalAngle+5;
  };
  
  
  
  