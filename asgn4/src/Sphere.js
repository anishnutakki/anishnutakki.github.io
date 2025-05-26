class Sphere {
    constructor() {
      this.type = 'sphere';
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.matrix = new Matrix4();
      this.textureNum = -2;
      this.latitudeBands = 16;  // Number of horizontal bands
      this.longitudeBands = 16; // Number of vertical bands
    }
  
    render() {
      let rgba = this.color;
      gl.uniform1i(u_whichTexture, this.textureNum);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
  
      // Generate sphere geometry
      for (let lat = 0; lat < this.latitudeBands; lat++) {
        let theta1 = (lat * Math.PI) / this.latitudeBands;
        let theta2 = ((lat + 1) * Math.PI) / this.latitudeBands;
  
        for (let lon = 0; lon < this.longitudeBands; lon++) {
          let phi1 = (lon * 2 * Math.PI) / this.longitudeBands;
          let phi2 = ((lon + 1) * 2 * Math.PI) / this.longitudeBands;
  
          // Calculate vertices for the quad (will be split into 2 triangles)
          let v1 = this.sphereVertex(theta1, phi1);
          let v2 = this.sphereVertex(theta1, phi2);
          let v3 = this.sphereVertex(theta2, phi1);
          let v4 = this.sphereVertex(theta2, phi2);
  
          // Calculate UV coordinates
          let uv1 = [lon / this.longitudeBands, lat / this.latitudeBands];
          let uv2 = [(lon + 1) / this.longitudeBands, lat / this.latitudeBands];
          let uv3 = [lon / this.longitudeBands, (lat + 1) / this.latitudeBands];
          let uv4 = [(lon + 1) / this.longitudeBands, (lat + 1) / this.latitudeBands];
  
          // Normals are the same as normalized vertices for a unit sphere
          let n1 = [v1.x, v1.y, v1.z];
          let n2 = [v2.x, v2.y, v2.z];
          let n3 = [v3.x, v3.y, v3.z];
          let n4 = [v4.x, v4.y, v4.z];
  
          // First triangle (v1, v3, v2)
          drawTriangle3DUVNormal(
            [v1.x, v1.y, v1.z, v3.x, v3.y, v3.z, v2.x, v2.y, v2.z],
            [uv1[0], uv1[1], uv3[0], uv3[1], uv2[0], uv2[1]],
            [n1[0], n1[1], n1[2], n3[0], n3[1], n3[2], n2[0], n2[1], n2[2]]
          );
  
          // Second triangle (v2, v3, v4)
          drawTriangle3DUVNormal(
            [v2.x, v2.y, v2.z, v3.x, v3.y, v3.z, v4.x, v4.y, v4.z],
            [uv2[0], uv2[1], uv3[0], uv3[1], uv4[0], uv4[1]],
            [n2[0], n2[1], n2[2], n3[0], n3[1], n3[2], n4[0], n4[1], n4[2]]
          );
        }
      }
    }
  
    // Helper function to calculate a vertex on the unit sphere
    sphereVertex(theta, phi) {
      let x = Math.sin(theta) * Math.cos(phi);
      let y = Math.cos(theta);
      let z = Math.sin(theta) * Math.sin(phi);
      
      return { x: x, y: y, z: z };
    }
  
    // Method to set the sphere resolution
    setResolution(latBands, lonBands) {
      this.latitudeBands = latBands;
      this.longitudeBands = lonBands;
    }
  
    // Fast render method with lower resolution for performance
    renderFast() {
      // Temporarily reduce resolution for fast rendering
      let originalLat = this.latitudeBands;
      let originalLon = this.longitudeBands;
      
      this.latitudeBands = 8;
      this.longitudeBands = 8;
      
      this.render();
      
      // Restore original resolution
      this.latitudeBands = originalLat;
      this.longitudeBands = originalLon;
    }
  }