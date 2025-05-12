class Cone {
    constructor() {
      this.type = 'cone';
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.matrix = new Matrix4();
      this.segments = 20; // Number of base segments for smoothness
    }
  
    render() {
      var rgba = this.color;
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
  
      let angleStep = 2 * Math.PI / this.segments;
      let baseCenter = [0, 0, 0];
      let tip = [0, 1, 0]; // Tip of the cone at height 1
  
      // Draw the cone sides
      for (let i = 0; i < this.segments; i++) {
        let angle1 = i * angleStep;
        let angle2 = (i + 1) * angleStep;
  
        let x1 = Math.cos(angle1);
        let z1 = Math.sin(angle1);
        let x2 = Math.cos(angle2);
        let z2 = Math.sin(angle2);
  
        gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9, rgba[3]);
        drawTriangle3D([
          x1, 0, z1,
          x2, 0, z2,
          tip[0], tip[1], tip[2]
        ]);
      }
  
      // Draw the base
      for (let i = 0; i < this.segments; i++) {
        let angle1 = i * angleStep;
        let angle2 = (i + 1) * angleStep;
  
        let x1 = Math.cos(angle1);
        let z1 = Math.sin(angle1);
        let x2 = Math.cos(angle2);
        let z2 = Math.sin(angle2);
  
        gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);
        drawTriangle3D([
          baseCenter[0], baseCenter[1], baseCenter[2],
          x2, 0, z2,
          x1, 0, z1
        ]);
      }
    }
  }
  