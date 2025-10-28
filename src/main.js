import * as THREE from 'three';
import './style.scss'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter, ThreeMFLoader } from 'three/examples/jsm/Addons.js';

const canvas = document.querySelector("#experience-canvas")

const sizes = {
    height: window.innerHeight,
    width: window.innerWidth
}

//texture loaders
const textureLoader = new THREE.TextureLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath( '/draco/' );
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

const TextureMap = {
    FirstT: {day:"/textures/firstTextureFinal.webp" },
    first:{day:"/textures/firstTextureFinal.webp" },
    secondT:{day: "/textures/secondTextureFinal.webp"},
    thirdT:{day: "/textures/thirdTextureSetFinal.webp"},
    inanimate_thirdT:{day: "/textures/thirdTextureSetFinal.webp"},

    collegeT: {day:"/textures/collegeSetFinal.webp"},

};

const environmentMap = new THREE.CubeTextureLoader();
environmentMap.setPath("textures/skybox");
environmentMap.load("px.webp","nx.webp","py.webp","ny.webp","pz.webp","nz.webp");

const loadedTextures = {
    day:{},
}

Object.entries(TextureMap).forEach(([key,paths])=>{
    const TextureDay = textureLoader.load(paths.day);
    TextureDay.flipY=false;
    TextureDay.colorSpace = THREE.SRGBColorSpace
    loadedTextures.day[key] = TextureDay;
    
});


loader.load("/models/portfolio_compressed-models.glb", (glb)=>
{ 
    glb.scene.traverse(child=>{
        if(child.isMesh){
            Object.keys(TextureMap).forEach(keys=> {
                if (child.name.includes(keys)) {
                    const material = new THREE.MeshBasicMaterial({
                        map: loadedTextures.day[keys],
                    });
                child.material = material;
                
                if(child.name.includes("pc_glass") || child.name.includes("Glass")) {
                    child.material = new THREE.MeshPhysicalMaterial({transmission: 1, 
                        opacity: 1, 
                        metalness: 0,
                        roughness: 0,
                        envMap: environmentMap,
                        ior:1.5,
                        thickness:0.01, 
                        specularIntensity: 1, 
                        envMapIntensity:1,
                        lightIntensity:1,
                        exposure: 1,
                    })
                 }
                
                 if(child.material.map){
                    child.material.map.minFilter = THREE.LinearFilter;
                }
                }
            });
        }

    })
    scene.add(glb.scene);

});
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 
    35,
    sizes.width / sizes.height,
    0.1,
    1000);

const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
renderer.setSize( sizes.width, sizes.height );
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
//controls.update() must be called after any manual changes to the camera's transform

function animate() {

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  renderer.render( scene, camera );

}

// event listeners

window.addEventListener("resize", ()=>{
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize( sizes.width, sizes.height );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    controls.update();
    })

const render = () =>{
    
    controls.update();
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

  renderer.render( scene, camera );

  window.requestAnimationFrame(render)

}
render()