import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x87CEEB);

camera.position.set(0, 20, 50);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.maxPolarAngle = Math.PI / 2 - 0.1;
controls.minDistance = 10;
controls.maxDistance = 100;

let isNightTime = false;
let transitionProgress = 0;
let isTransitioning = false;

const daySettings = {
    backgroundColor: 0x87CEEB,
    ambientIntensity: 0.7,
    directionalIntensity: 1.2,
    directionalColor: 0xffffff,
    hemisphereIntensity: 0.9,
    pointLightIntensity: 1,
    fogColor: 0x87CEEB,
    fogNear: 50,
    fogFar: 150
};

const nightSettings = {
    backgroundColor: 0x191970,
    ambientIntensity: 0.2,
    directionalIntensity: 0.3,
    directionalColor: 0x4169E1,
    hemisphereIntensity: 0.3,
    pointLightIntensity: 2,
    fogColor: 0x191970,
    fogNear: 30,
    fogFar: 100
};

scene.fog = new THREE.Fog(daySettings.fogColor, daySettings.fogNear, daySettings.fogFar);

const textureLoader = new THREE.TextureLoader();

const grassTexture = textureLoader.load('junglegrass.jpg');
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(10, 10);

const treeBarkTexture = textureLoader.load('treebark.jpeg');
treeBarkTexture.wrapS = THREE.RepeatWrapping;
treeBarkTexture.wrapT = THREE.RepeatWrapping;
treeBarkTexture.repeat.set(2, 2);

const rockTexture = textureLoader.load('rocktexture.jpg');
rockTexture.wrapS = THREE.RepeatWrapping;
rockTexture.wrapT = THREE.RepeatWrapping;
rockTexture.repeat.set(1, 1);

const waterTexture = textureLoader.load('riverwater.jpg');
waterTexture.wrapS = THREE.RepeatWrapping;
waterTexture.wrapT = THREE.RepeatWrapping;
waterTexture.repeat.set(1, 3);

const ancientStoneTexture = textureLoader.load('rocktexture2.avif');
ancientStoneTexture.wrapS = THREE.RepeatWrapping;
ancientStoneTexture.wrapT = THREE.RepeatWrapping;
ancientStoneTexture.repeat.set(1, 1);

const cubeTextureLoader = new THREE.CubeTextureLoader();
const skyboxTexture = cubeTextureLoader.load([
    'sky1.jpeg', 'sky1.jpeg', 'sky1.jpeg',
    'sky1.jpeg', 'sky1.jpeg', 'sky1.jpeg'
]);
scene.background = skyboxTexture;

const ambientLight = new THREE.AmbientLight(0x404040, daySettings.ambientIntensity);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(daySettings.directionalColor, daySettings.directionalIntensity);
directionalLight.position.set(20, 50, 30);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.camera.left = -50;
directionalLight.shadow.camera.right = 50;
directionalLight.shadow.camera.top = 50;
directionalLight.shadow.camera.bottom = -50;
scene.add(directionalLight);

const hemisphereLight = new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, daySettings.hemisphereIntensity);
scene.add(hemisphereLight);

const pointLight = new THREE.PointLight(0xff00ff, daySettings.pointLightIntensity, 50);
pointLight.position.set(10, 5, -10);
pointLight.castShadow = true;
scene.add(pointLight);

const nightLights = [];
for (let i = 0; i < 40; i++) {
    const firefly = new THREE.PointLight(0x00ff88, 0, 10);
    firefly.position.set(
        (Math.random() - 0.5) * 80,
        2 + Math.random() * 8,
        (Math.random() - 0.5) * 80
    );
    
    const glowGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff88,
        transparent: true,
        opacity: 0
    });
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    firefly.add(glowSphere);
    
    firefly.userData = {
        originalX: firefly.position.x,
        originalY: firefly.position.y,
        originalZ: firefly.position.z,
        phase: Math.random() * Math.PI * 2,
        glowSphere: glowSphere
    };
    
    scene.add(firefly);
    nightLights.push(firefly);
}

function toggleDayNight() {
    if (isTransitioning) return;
    
    isNightTime = !isNightTime;
    isTransitioning = true;
    transitionProgress = 0;
    
}

function updateDayNightTransition() {
    if (!isTransitioning) return;
    
    transitionProgress += 0.02;
    
    if (transitionProgress >= 1) {
        transitionProgress = 1;
        isTransitioning = false;
    }
    
    const from = isNightTime ? daySettings : nightSettings;
    const to = isNightTime ? nightSettings : daySettings;
    const t = transitionProgress;
    
    const smoothT = t * t * (3 - 2 * t);
    
    const fromColor = new THREE.Color(from.backgroundColor);
    const toColor = new THREE.Color(to.backgroundColor);
    const currentBgColor = fromColor.lerp(toColor, smoothT);
    renderer.setClearColor(currentBgColor);
    
    const fogFromColor = new THREE.Color(from.fogColor);
    const fogToColor = new THREE.Color(to.fogColor);
    const currentFogColor = fogFromColor.lerp(fogToColor, smoothT);
    scene.fog.color = currentFogColor;
    scene.fog.near = from.fogNear + (to.fogNear - from.fogNear) * smoothT;
    scene.fog.far = from.fogFar + (to.fogFar - from.fogFar) * smoothT;
    
    ambientLight.intensity = from.ambientIntensity + (to.ambientIntensity - from.ambientIntensity) * smoothT;
    directionalLight.intensity = from.directionalIntensity + (to.directionalIntensity - from.directionalIntensity) * smoothT;
    hemisphereLight.intensity = from.hemisphereIntensity + (to.hemisphereIntensity - from.hemisphereIntensity) * smoothT;
    pointLight.intensity = from.pointLightIntensity + (to.pointLightIntensity - from.pointLightIntensity) * smoothT;
    
    const fromDirColor = new THREE.Color(from.directionalColor);
    const toDirColor = new THREE.Color(to.directionalColor);
    const currentDirColor = fromDirColor.lerp(toDirColor, smoothT);
    directionalLight.color = currentDirColor;
    
    nightLights.forEach(light => {
        const targetIntensity = isNightTime ? 0.5 + Math.random() * 0.3 : 0;
        const targetOpacity = isNightTime ? 0.8 : 0;
        
        light.intensity = light.intensity * 0.9 + targetIntensity * 0.1;
        light.userData.glowSphere.material.opacity = 
            light.userData.glowSphere.material.opacity * 0.9 + targetOpacity * 0.1;
    });
}

document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyN') {
        toggleDayNight();
    }
});

const instruction = document.createElement('div');
instruction.style.position = 'absolute';
instruction.style.top = '20px';
instruction.style.left = '20px';
instruction.style.color = 'white';
instruction.style.fontFamily = 'Arial, sans-serif';
instruction.style.fontSize = '18px';
instruction.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
instruction.style.zIndex = '100';
instruction.innerHTML = 'Press <strong>N</strong> to toggle Day/Night';
document.body.appendChild(instruction);

const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshStandardMaterial({ map: grassTexture });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function createSquigglyRiver() {
    const riverGroup = new THREE.Group();
    const riverSegments = [];
    
    const points = [];
    const numPoints = 20;
    
    const startX = -40;
    const startZ = -40;
    const endX = 40;
    const endZ = 40;
    
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        
        const baseX = startX + (endX - startX) * t;
        const baseZ = startZ + (endZ - startZ) * t;
        
        const squiggleX = Math.sin(t * Math.PI * 4) * 8 * Math.sin(t * Math.PI);
        const squiggleZ = Math.cos(t * Math.PI * 3) * 6 * Math.sin(t * Math.PI);
        
        points.push(new THREE.Vector3(
            baseX + squiggleX,
            0.1,
            baseZ + squiggleZ
        ));
    }
    
    const riverMaterial = new THREE.MeshStandardMaterial({
        map: waterTexture,
        transparent: true,
        opacity: 0.7,
        roughness: 0.2,
        metalness: 0.8
    });
    
    for (let i = 0; i < points.length - 1; i++) {
        const currentPoint = points[i];
        const nextPoint = points[i + 1];
        
        const direction = new THREE.Vector3().subVectors(nextPoint, currentPoint);
        const length = direction.length();
        const midPoint = new THREE.Vector3().addVectors(currentPoint, nextPoint).multiplyScalar(0.5);
        
        const segmentGeometry = new THREE.PlaneGeometry(4, length);
        const segment = new THREE.Mesh(segmentGeometry, riverMaterial);
        
        segment.position.copy(midPoint);
        segment.rotation.x = -Math.PI / 2;
        segment.rotation.z = Math.atan2(direction.x, direction.z);
        segment.receiveShadow = true;
        
        riverGroup.add(segment);
        riverSegments.push(segment);
    }
    
    scene.add(riverGroup);
    return { riverGroup, riverSegments, riverMaterial };
}

const riverData = createSquigglyRiver();

function isNearRiver(x, z) {
    const riverPath = [];
    const numPoints = 20;
    const startX = -40, startZ = -40, endX = 40, endZ = 40;
    
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const baseX = startX + (endX - startX) * t;
        const baseZ = startZ + (endZ - startZ) * t;
        const squiggleX = Math.sin(t * Math.PI * 4) * 8 * Math.sin(t * Math.PI);
        const squiggleZ = Math.cos(t * Math.PI * 3) * 6 * Math.sin(t * Math.PI);
        
        riverPath.push({ x: baseX + squiggleX, z: baseZ + squiggleZ });
    }
    
    for (let point of riverPath) {
        const distance = Math.sqrt((x - point.x) ** 2 + (z - point.z) ** 2);
        if (distance < 6) return true;
    }
    return false;
}

function createTree(x, z, scale = 1) {
    const trunkGeometry = new THREE.CylinderGeometry(0.5 * scale, 0.8 * scale, 5 * scale, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ map: treeBarkTexture });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, (5 * scale) / 2, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    scene.add(trunk);

    const leavesGeometry = new THREE.ConeGeometry(2 * scale, 4 * scale, 16);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.7, metalness: 0.1 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, (5 * scale) + (2 * scale), z);
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    scene.add(leaves);
}

const treeCount = 50;
for (let i = 0; i < treeCount; i++) {
    let x, z;
    let attempts = 0;
    do {
        x = (Math.random() * 80 - 40);
        z = (Math.random() * 80 - 40);
        attempts++;
    } while (isNearRiver(x, z) && attempts < 50);

    if (attempts < 50) {
        const scale = 0.8 + Math.random() * 0.4;
        createTree(x, z, scale);
    }
}

const rockCount = 15;
for (let i = 0; i < rockCount; i++) {
    const rockSize = 1 + Math.random() * 2;
    const rockGeometry = (Math.random() > 0.5) ? new THREE.SphereGeometry(rockSize, 16, 16) : new THREE.IcosahedronGeometry(rockSize, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({ map: rockTexture, roughness: 0.8 });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);

    let x, z;
    let attempts = 0;
    do {
        x = (Math.random() * 80 - 40);
        z = (Math.random() * 80 - 40);
        attempts++;
    } while (isNearRiver(x, z) && attempts < 50);

    if (attempts < 50) {
        rock.position.set(x, rockSize / 2, z);
        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.add(rock);
    }
}

const fruitCount = 30;
for (let i = 0; i < fruitCount; i++) {
    const fruitSize = 0.3 + Math.random() * 0.2;
    const fruitGeometry = new THREE.SphereGeometry(fruitSize, 8, 8);
    const fruitMaterial = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
    const fruit = new THREE.Mesh(fruitGeometry, fruitMaterial);

    let x, z;
    let attempts = 0;
    do {
        x = (Math.random() * 80 - 40);
        z = (Math.random() * 80 - 40);
        attempts++;
    } while (isNearRiver(x, z) && attempts < 50);

    if (attempts < 50) {
        fruit.position.set(x, 0.5, z);
        fruit.castShadow = true;
        scene.add(fruit);
    }
}

const ancientRockGeometry = new THREE.SphereGeometry(4, 32, 32);
const ancientRockMaterial = new THREE.MeshStandardMaterial({ map: ancientStoneTexture, roughness: 0.9, metalness: 0.1 });
const ancientRock = new THREE.Mesh(ancientRockGeometry, ancientRockMaterial);
ancientRock.position.set(20, 2, -30);
ancientRock.castShadow = true;
ancientRock.receiveShadow = true;
scene.add(ancientRock);

const rainDrops = [];
const rainCount = 150;
const rainGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const rainMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x00080, 
    transparent: true, 
    opacity: 1,
    emissive: 0x222222
});

for (let i = 0; i < rainCount; i++) {
    const rainDrop = new THREE.Mesh(rainGeometry, rainMaterial);
    
    rainDrop.position.set(
        (Math.random() - 0.5) * 120,
        30 + Math.random() * 20,
        (Math.random() - 0.5) * 120
    );
    
    rainDrop.userData = {
        fallSpeed: 0.4 + Math.random() * 0.12
    };
    
    scene.add(rainDrop);
    rainDrops.push(rainDrop);
}

const gltfLoader = new GLTFLoader();
let phoenixBird = null;

const birdParams = {
    speedX: 0.3,
    speedY: 0.2,
    speedZ: 0.4,
    radiusX: 25,
    radiusY: 3,
    radiusZ: 30,
    baseHeight: 18
};

gltfLoader.load(
    'phoenix_bird.glb',
    function (gltf) {
        phoenixBird = gltf.scene;
        
        phoenixBird.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        phoenixBird.scale.set(0.01, 0.01, 0.01);
        
        phoenixBird.position.set(20, birdParams.baseHeight, 20);

        scene.add(phoenixBird);
        console.log('Phoenix bird loaded successfully');
    }
);

function animate() {
    controls.update();

    updateDayNightTransition();

    if (isNightTime || isTransitioning) {
        const time = Date.now() * 0.001;
        nightLights.forEach((light, index) => {
            const offset = index * 0.5;
            light.position.x = light.userData.originalX + Math.sin(time + offset) * 2;
            light.position.y = light.userData.originalY + Math.sin(time * 1.5 + offset) * 1;
            light.position.z = light.userData.originalZ + Math.cos(time * 0.8 + offset) * 2;
            
            const pulse = 0.5 + Math.sin(time * 3 + light.userData.phase) * 0.3;
            if (isNightTime) {
                light.intensity = pulse * 0.8;
            }
        });
    }

    rainDrops.forEach(rainDrop => {
        rainDrop.position.y -= rainDrop.userData.fallSpeed;
        
        if (rainDrop.position.y < 0) {
            rainDrop.position.y = 30 + Math.random() * 20;
            rainDrop.position.x = (Math.random() - 0.5) * 120;
            rainDrop.position.z = (Math.random() - 0.5) * 120;
        }
    });

    if (phoenixBird) {
        const time = Date.now() * 0.001;
        
        const newX = Math.sin(time * birdParams.speedX) * birdParams.radiusX;
        const newY = birdParams.baseHeight + Math.sin(time * birdParams.speedY) * birdParams.radiusY;
        const newZ = Math.cos(time * birdParams.speedZ) * birdParams.radiusZ;
        
        phoenixBird.position.set(newX, newY, newZ);
        
        phoenixBird.rotation.y = Math.atan2(Math.cos(time * birdParams.speedX), -Math.sin(time * birdParams.speedZ));
    }

    riverData.riverMaterial.map.offset.y -= 0.002;

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

window.onload = function () {
    onWindowResize();
};