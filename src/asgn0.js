function main() {  
  var canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  }
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 400, 400);
}

function handleDrawEvent() {
  let x1 = parseFloat(document.getElementById('x1-coordinate').value);
  let y1 = parseFloat(document.getElementById('y1-coordinate').value);
  let x2 = parseFloat(document.getElementById('x2-coordinate').value);
  let y2 = parseFloat(document.getElementById('y2-coordinate').value);
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 400, 400);
  var v1 = new Vector3([x1, y1, 0]);
  var v2 = new Vector3([x2, y2, 0]);
  drawVector(v1, "red");
  drawVector(v2, "blue");
}

function handleDrawOperationEvent() {
  let x1 = parseFloat(document.getElementById('x1-coordinate').value);
  let y1 = parseFloat(document.getElementById('y1-coordinate').value);
  let x2 = parseFloat(document.getElementById('x2-coordinate').value);
  let y2 = parseFloat(document.getElementById('y2-coordinate').value);
  let scalar = parseFloat(document.getElementById('scalar').value);
  let operation = document.getElementById('operation').value;

  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 400, 400);

  var v1 = new Vector3([x1, y1, 0]);
  var v2 = new Vector3([x2, y2, 0]);

  drawVector(v1, "red");
  drawVector(v2, "blue");

  if (operation === "add") {
    let v3 = new Vector3([0, 0, 0]);
    v3.set(v1);
    v3.add(v2);
    drawVector(v3, "green");
  } else if (operation === "sub") {
    let v3 = new Vector3([0, 0, 0]);
    v3.set(v1);
    v3.sub(v2);
    drawVector(v3, "green");
  } else if (operation === "mul") {
    let v3 = new Vector3([0, 0, 0]);
    let v4 = new Vector3([0, 0, 0]);
    v3.set(v1);
    v3.mul(scalar);
    v4.set(v2);
    v4.mul(scalar);
    drawVector(v3, "green");
    drawVector(v4, "green");
  } else if (operation === "div") {
    if (scalar !== 0) {
      let v3 = new Vector3([0, 0, 0]);
      let v4 = new Vector3([0, 0, 0]);
      v3.set(v1);
      v3.div(scalar);
      v4.set(v2);
      v4.div(scalar);
      drawVector(v3, "green");
      drawVector(v4, "green");

    } 
    else {
      console.log("Cannot divide by zero");
    }
  } else if (operation == "mag") {
    console.log("Magnitude v1: " + v1.magnitude())
    console.log("Magnitude v2: " + v2.magnitude())
  } else if (operation == "norm") {
    let v3 = new Vector3([0, 0, 0]);
    let v4 = new Vector3([0, 0, 0]);
    v3 = v1.normalize()
    v4 = v2.normalize()
    drawVector(v3, "green");
    drawVector(v4, "green");
  } else if (operation == "angle") {
    console.log("Angle: " + angleBetween(v1, v2))

  } else if (operation == "area") {
    console.log("Angle of the triangle: " + areaTriangle(v1,v2))
  }

}

function areaTriangle(v1, v2) {
  let v3 = Vector3.cross(v1, v2);
  return v3.magnitude() / 2;
}

function angleBetween(v1, v2) {
  let product = Vector3.dot(v1, v2);
  let mag1 = v1.magnitude();
  let mag2 = v2.magnitude();
  let theta = product / (mag1 * mag2);
  let degrees = Math.acos(theta) * (180 / Math.PI);
  return degrees;
}

function drawVector(v, color) {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');
  ctx.beginPath();
  ctx.moveTo(200, 200);
  ctx.lineTo(200 + v.elements[0] * 20, 200 - v.elements[1] * 20);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
}
