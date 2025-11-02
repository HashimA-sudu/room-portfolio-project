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
    leaf: {day: "/textures/leaf.png"},
    collegeT: {day:"/textures/collegeSetFinal.webp"},
    glass: {day:""},
};

const environmentMap = new THREE.CubeTextureLoader();
environmentMap.setPath("/textures/skybox/");
const envTexture = environmentMap.load("px.webp","nx.webp","py.webp","ny.webp","pz.webp","nz.webp");

const loadedTextures = {
    day:{},
}

Object.entries(TextureMap).forEach(([key,paths])=>{
    const TextureDay = textureLoader.load(paths.day);
    TextureDay.flipY=false;
    TextureDay.colorSpace = THREE.SRGBColorSpace
    loadedTextures.day[key] = TextureDay;
    
});

const scene = new THREE.Scene();
scene.environment = envTexture;
scene.background = envTexture;

loader.load("/models/portfolio_compressed-models.glb", (glb)=>
{ 
    glb.scene.traverse(child=>{
        if(child.isMesh){
            // Debug: Log all mesh names to console
             if (!child.name.includes("leaf")){console.log("Mesh found:", child.name);}
            
            Object.keys(TextureMap).forEach(keys=> { // assign materials
                if (child.name.includes(keys)) {
                    const material = new THREE.MeshBasicMaterial({
                        map: loadedTextures.day[keys],
                    });
                
                if (child.name.includes("hidden")) {
                    const material = new THREE.MeshBasicMaterial({
                        map: loadedTextures.day['leaf'],
                });
                }
                child.material = material;

                if(child.material.map){ // fix distance thing
                    child.material.map.minFilter = THREE.LinearFilter;
                }
                
        
                if(child.name.includes("glass")) {
                    // Move glass object up by 2 units on Z axis
                    
                    child.material = new THREE.MeshPhysicalMaterial({
                        transmission: 0.2,
                        transparent: true,
                        opacity: 1,
                        roughness: 0,
                        metalness: 0,
                        ior: 1.5,
                        thickness: 0.02,
                        envMap: envTexture,
                        envMapIntensity: 1,
                       
                    });
                 }


                }
            });
        }
        else {
            //console.log("child is not mesh: ", child.name)
        }

    })
    scene.add(glb.scene);

});

const camera = new THREE.PerspectiveCamera( 
    35,
    sizes.width / sizes.height,
    0.1,
    1000);

const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
renderer.setSize( sizes.width, sizes.height );
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))

camera.position.z = 5;

const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.05;

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
    renderer.render( scene, camera );
    window.requestAnimationFrame(render)
}

render()