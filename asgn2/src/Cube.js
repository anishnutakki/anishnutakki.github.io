class Cube {
    constructor() {
      this.type = 'cube';
      //this.position = [0.0, 0.0, 0.0];
      this.color = [1.0, 1.0, 1.0, 1.0];
      //this.size = 5.0;
      //this.segments = 10;
      this.matrix = new Matrix4();
    }
  
    render() {
        var rgba = this.color;
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
      
        // FRONT face
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        drawTriangle3D([0,0,0, 1,1,0, 1,0,0]);
        drawTriangle3D([0,0,0, 0,1,0, 1,1,0]);
      
        // BACK face
        gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);
        drawTriangle3D([0,0,1, 1,0,1, 1,1,1]);
        drawTriangle3D([0,0,1, 1,1,1, 0,1,1]);
      
        // LEFT face
        gl.uniform4f(u_FragColor, rgba[0]*0.85, rgba[1]*0.85, rgba[2]*0.85, rgba[3]);
        drawTriangle3D([0,0,0, 0,0,1, 0,1,1]);
        drawTriangle3D([0,0,0, 0,1,1, 0,1,0]);
      
        // RIGHT face
        gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
        drawTriangle3D([1,0,0, 1,1,0, 1,1,1]);
        drawTriangle3D([1,0,0, 1,1,1, 1,0,1]);
      
        // TOP face
        gl.uniform4f(u_FragColor, rgba[0]*0.75, rgba[1]*0.75, rgba[2]*0.75, rgba[3]);
        drawTriangle3D([0,1,0, 0,1,1, 1,1,1]);
        drawTriangle3D([0,1,0, 1,1,1, 1,1,0]);
      
        // BOTTOM face
        gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);
        drawTriangle3D([0,0,0, 1,0,0, 1,0,1]);
        drawTriangle3D([0,0,0, 1,0,1, 0,0,1]);
      }
      drawCube(M) {
        this.render(M);  
      }
      
    }
  