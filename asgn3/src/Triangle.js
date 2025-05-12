// Buffer cache for reuse
const bufferCache = {
  vertexBuffer: null,
  uvBuffer: null
};

// Initialize or reuse a buffer
function initBuffer(type, data, itemSize, attributeName) {
  let buffer;
  
  // Reuse buffer from cache if available
  if (type === 'vertex' && bufferCache.vertexBuffer) {
    buffer = bufferCache.vertexBuffer;
  } else if (type === 'uv' && bufferCache.uvBuffer) {
    buffer = bufferCache.uvBuffer;
  } else {
    // Create new buffer
    buffer = gl.createBuffer();
    if (!buffer) {
      console.log(`Failed to create ${type} buffer object`);
      return null;
    }
    
    // Store in cache for reuse
    if (type === 'vertex') bufferCache.vertexBuffer = buffer;
    else if (type === 'uv') bufferCache.uvBuffer = buffer;
  }
  
  // Bind buffer and upload data
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
  
  // Setup attribute pointer
  const attributeLocation = gl.getAttribLocation(gl.program, attributeName);
  if (attributeLocation < 0) {
    console.log(`Failed to get storage location of ${attributeName}`);
    return null;
  }
  
  gl.vertexAttribPointer(attributeLocation, itemSize, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(attributeLocation);
  
  return buffer;
}

function drawTriangle(vertices) {
  const n = 3;
  
  // Initialize or reuse vertex buffer
  if (!initBuffer('vertex', vertices, 2, 'a_Position')) {
    return -1;
  }
  
  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function drawTriangle3D(vertices) {
  const n = 3;
  
  // Initialize or reuse vertex buffer
  if (!initBuffer('vertex', vertices, 3, 'a_Position')) {
    return -1;
  }
  
  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function drawTriangle3DUV(vertices, uv) {
  const n = 3;
  
  // Initialize or reuse vertex buffer
  if (!initBuffer('vertex', vertices, 3, 'a_Position')) {
    return -1;
  }
  
  // Initialize or reuse UV buffer
  if (!initBuffer('uv', uv, 2, 'a_UV')) {
    return -1;
  }
  
  gl.drawArrays(gl.TRIANGLES, 0, n);
}