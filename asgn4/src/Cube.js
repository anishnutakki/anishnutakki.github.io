class Cube {
  constructor() {
    this.type = 'cube';
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
    this.textureNum = -2;
  }

  render() {
    let rgba = this.color;
    gl.uniform1i(u_whichTexture, this.textureNum);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
  
    // === FRONT FACE ===
    drawTriangle3DUVNormal(
      [0,0,0, 1,1,0, 1,0,0],
      [0,0, 1,0, 1,0],
      [0,0,-1, 0,0,-1, 0,0,-1]
    );
    drawTriangle3DUVNormal(
      [0,0,0, 0,1,0, 1,1,0],
      [0,0, 0,1, 1,1],
      [0,0,-1, 0,0,-1, 0,0,-1]
    );
  
    // === BACK FACE === (fixed normals to 0,0,1)
    drawTriangle3DUVNormal(
      [0,0,1, 1,0,1, 1,1,1],
      [0,0, 1,0, 1,1],
      [0,0,1, 0,0,1, 0,0,1]
    );
    drawTriangle3DUVNormal(
      [0,0,1, 1,1,1, 0,1,1],
      [0,0, 1,1, 0,1],
      [0,0,1, 0,0,1, 0,0,1]
    );
  
    // === LEFT FACE ===
    drawTriangle3DUVNormal(
      [0,1,0, 0,1,1, 0,0,0],
      [0,0, 0,1, 1,1],
      [-1,0,0, -1,0,0, -1,0,0]
    );
    drawTriangle3DUVNormal(
      [0,0,0, 0,1,1, 0,0,1],
      [0,0, 1,1, 1,0],
      [-1,0,0, -1,0,0, -1,0,0]
    );
  
    // === RIGHT FACE === (fixed last normal of second triangle)
    drawTriangle3DUVNormal(
      [1,1,0, 1,1,1, 1,0,0],
      [0,0, 1,0, 1,1],
      [1,0,0, 1,0,0, 1,0,0]
    );
    drawTriangle3DUVNormal(
      [1,0,0, 1,1,1, 1,0,1],
      [0,0, 1,1, 0,1],
      [1,0,0, 1,0,0, 1,0,0]  // fixed from 1,1,1
    );
  
    // === TOP FACE ===
    drawTriangle3DUVNormal(
      [0,1,0, 0,1,1, 1,1,1],
      [0,0, 0,1, 1,1],
      [0,1,0, 0,1,0, 0,1,0]
    );
    drawTriangle3DUVNormal(
      [0,1,0, 1,1,1, 1,1,0],
      [0,0, 1,1, 1,0],
      [0,1,0, 0,1,0, 0,1,0]
    );
  
    // === BOTTOM FACE ===
    drawTriangle3DUVNormal(
      [0,0,0, 1,0,0, 1,0,1],
      [0,0, 1,0, 1,1],
      [0,-1,0, 0,-1,0, 0,-1,0]
    );
    drawTriangle3DUVNormal(
      [0,0,0, 1,0,1, 0,0,1],
      [0,0, 1,1, 0,1],
      [0,-1,0, 0,-1,0, 0,-1,0]
    );
  }
  
  

  renderFast() {
    let rgba = this.color;

    // Set the texture
    gl.uniform1i(u_whichTexture, this.textureNum);
    
    // Pass the color of a point to u_FragColor uniform variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Pass the matrix to u_ModelMatrix attribute
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

    // Create an array for all the triangles with 3D coordinates
    let vertices = [];
    // Create a corresponding array for UV coordinates
    let uvCoords = [];
    
    // Front face - 2 triangles
    // Triangle 1
    vertices.push(0,0,0, 1,0,0, 1,1,0);
    uvCoords.push(0,0, 1,0, 1,1);
    // Triangle 2
    vertices.push(0,0,0, 1,1,0, 0,1,0);
    uvCoords.push(0,0, 1,1, 0,1);
    
    // Back face - 2 triangles
    // Triangle 1
    vertices.push(0,0,1, 1,0,1, 1,1,1);
    uvCoords.push(0,0, 1,0, 1,1);
    // Triangle 2
    vertices.push(0,0,1, 1,1,1, 0,1,1);
    uvCoords.push(0,0, 1,1, 0,1);
    
    // Left face - 2 triangles
    // Triangle 1
    vertices.push(0,0,0, 0,0,1, 0,1,1);
    uvCoords.push(0,0, 1,0, 1,1);
    // Triangle 2
    vertices.push(0,0,0, 0,1,1, 0,1,0);
    uvCoords.push(0,0, 1,1, 0,1);
    
    // Right face - 2 triangles
    // Triangle 1
    vertices.push(1,0,0, 1,1,0, 1,1,1);
    uvCoords.push(0,0, 1,0, 1,1);
    // Triangle 2
    vertices.push(1,0,0, 1,1,1, 1,0,1);
    uvCoords.push(0,0, 1,1, 0,1);
    
    // Top face - 2 triangles
    // Triangle 1
    vertices.push(0,1,0, 0,1,1, 1,1,1);
    uvCoords.push(0,0, 1,0, 1,1);
    // Triangle 2
    vertices.push(0,1,0, 1,1,1, 1,1,0);
    uvCoords.push(0,0, 1,1, 0,1);
    
    // Bottom face - 2 triangles
    // Triangle 1
    vertices.push(0,0,0, 1,0,0, 1,0,1);
    uvCoords.push(0,0, 1,0, 1,1);
    // Triangle 2
    vertices.push(0,0,0, 1,0,1, 0,0,1);
    uvCoords.push(0,0, 1,1, 0,1);
    
    // Draw the cube with all triangles at once
    // Use a new function that can handle multiple triangles with UV coordinates
    if (typeof drawTriangle3DUVBatch === 'function') {
      // If the batch function exists, use it for better performance
      drawTriangle3DUVBatch(vertices, uvCoords);
    } else {
      // Fallback: Draw each triangle separately if batch function doesn't exist
      for (let i = 0; i < vertices.length; i += 9) {
        let triVerts = vertices.slice(i, i + 9);
        let triUVs = uvCoords.slice(i/3*2, i/3*2 + 6);
        drawTriangle3DUV(triVerts, triUVs);
      }
    }
  }
}