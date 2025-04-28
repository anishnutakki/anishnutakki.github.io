class Triangle {
    constructor(){
      this.type = 'triangle';
      this.position = [0.0, 0.0, 0.0];
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.size = 5;
      this.vertices = [];
    }

    setVertices(vertices) {
      this.vertices = vertices;
    }

    render() {
      let xy = this.position;
      let rgba = this.color;
      let size = this.size;
      gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniform1f(u_Size, size);
      
      drawTriangle(this.vertices);
    }
}


class Point {
    constructor(){
      this.type = 'point';
      this.position = [0.0, 0.0, 0.0];
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.size = 5;
    }
    render() {
      let xy = this.position;
      let rgba = this.color;
      let size = this.size;
      gl.disableVertexAttribArray(a_Position);
      gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniform1f(u_Size, size);
      gl.drawArrays(gl.POINTS, 0, 1);
    }
}