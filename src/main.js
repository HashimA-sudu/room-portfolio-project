import * as THREE from 'three';
import './style.scss'
import { OrbitControls } from './utils/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter, ThreeMFLoader } from 'three/examples/jsm/Addons.js';
import { zip } from 'three/examples/jsm/libs/fflate.module.js';
import gsap from "gsap";

/////////
//  TODO
// make showcase,
// rotating acWind
//  fix textures of aboutMe sign
// add music and sound effects
/////////

// ========== INITIAL SETUP ==========
const raycaster = new THREE.Raycaster();
const raycasterObjects = [];
let currentIntersects = [];
let currentHoverObject = null;
const pointer = new THREE.Vector2();
const canvas = document.querySelector("#experience-canvas");
const sizes = {
    height: window.innerHeight,
    width: window.innerWidth
};

// ========== LOADING MANAGER SETUP ==========
const manager = new THREE.LoadingManager();
let resourcesLoaded = false;

// Set loading manager callbacks FIRST
manager.onStart = function(url, itemsLoaded, itemsTotal) {
    console.log('Started loading:', url, `(${itemsLoaded}/${itemsTotal})`);
};

manager.onProgress = function(url, itemsLoaded, itemsTotal) {
    const progress = (itemsLoaded / itemsTotal) * 100;
    console.log(`Loading: ${progress.toFixed(2)}% - ${url}`);
};

manager.onError = function(url) {
    console.error(`Error loading: ${url}`);
};

manager.onLoad = function() {
    console.log("ALL RESOURCES LOADED!");
    resourcesLoaded = true;
    setupLoadingScreenButton();
};

// ========== CREATE LOADERS AFTER MANAGER SETUP ==========
const textureLoader = new THREE.TextureLoader(manager);
const dracoLoader = new DRACOLoader(manager);
dracoLoader.setDecoderPath('/draco/');
const loader = new GLTFLoader(manager);
loader.setDRACOLoader(dracoLoader);

// ========== TEXTURE AND ENVIRONMENT SETUP ==========
const TextureMap = {
    FirstT: { day: "/textures/mapping/firstTextureFinal.webp" },
    first: { day: "/textures/mapping/firstTextureFinal.webp" },
    secondT: { day: "/textures/mapping/secondTextureFinal.webp" },
    thirdT: { day: "/textures/mapping/thirdTextureSetFinal.webp" },
    inanimate_thirdT: { day: "/textures/mapping/thirdTextureSetFinal.webp" },
    leaf: { day: "/textures/mapping/leaf.png" },
    collegeT: { day: "/textures/mapping/collegeSetFinal.webp" },
};

const environmentMap = new THREE.CubeTextureLoader(manager);
environmentMap.setPath("./textures/skybox/");

const loadedTextures = { day: {} };

// Load textures
Object.entries(TextureMap).forEach(([key, paths]) => {
    const TextureDay = textureLoader.load(paths.day);
    TextureDay.flipY = false;
    TextureDay.generateMipmaps = false;
    TextureDay.colorSpace = THREE.SRGBColorSpace;
    loadedTextures.day[key] = TextureDay;
});
const envTexture = environmentMap.load([
    "px.webp", "nx.webp",
    "py.webp", "ny.webp",
    "pz.webp", "nz.webp"
]);
envTexture.colorSpace = THREE.SRGBColorSpace;


// ========== SCENE SETUP ==========
const scene = new THREE.Scene();
scene.environment = envTexture;
scene.background = envTexture;

// Materials
const glassMaterial = new THREE.MeshPhysicalMaterial({
    transmission: 0.1,
    color: 0xffffff,
    transparent: true,
    opacity: 1,
    roughness: 0,
    metalness: 0,
    ior: 1.5,
    thickness: 0.01,
    reflectivity: 0.5,
    envMap: envTexture,
    envMapIntensity: 1,
    depthWrite: false,
});

// ========== UI AND INTERACTION VARIABLES ==========
const Links = {
    "github": "https://github.com/HashimA-sudu/",
    "email": "mailto:hashimhamadalshawaf@gmail.com",
    "COOP": "https://github.com/HashimA-sudu/coopRecommender",
    "japaneseLink": "https://github.com/HashimA-sudu/QuickJapaneseLookup",
    "movie": "https://github.com/HashimA-sudu/MovieRecommender",
};

const modals = {
    about: document.querySelector(".modal.about"),
    projects: document.querySelector(".modal.projects"),
    education: document.querySelector(".modal.education"),
};

// Companion objects for signs
let about1 = null, about2 = null, project1 = null, project2 = null, project3 = null;
let projectLight = null, projectWire = null, aboutLight = null, aboutWire = null;
let monitor = null, hat = null, college = null, chair = null, acWind = null;
let hatRotationSpeed = 0.009;

// Fans
const xAxisFans = [];
const yAxisFans = [];
const zAxisFans = [];

// State variables
let touchHappened = false;
let modalShown = false;
let showcaseMode = false;
let showcasedObjects = [];
let previousCameraPosition = new THREE.Vector3();
let previousControlsTarget = new THREE.Vector3();
let gameboyScreenBody = null;
let gameboyScreen = null;
let initialAnimationObjs = [];

// ========== VIDEO SETUP ==========
const VideoElement = document.createElement("video");
VideoElement.src = "./textures/videos/monitor.mp4";
VideoElement.loop = true;
VideoElement.muted = true;
VideoElement.playsInline = true;
VideoElement.autoplay = true;

const VideoTexture = new THREE.VideoTexture(VideoElement);
VideoTexture.colorSpace = THREE.SRGBColorSpace;
VideoTexture.flipY = false;
VideoTexture.center.set(0.5, 0.5);
VideoTexture.rotation = (Math.PI / 2);
VideoTexture.repeat.set(1, 2);
VideoTexture.offset.set(0, -0.63);

// for sticky up
const VideoElementUp = document.createElement("video");
VideoElementUp.src = "./textures/videos/japanese_video.mp4";
VideoElementUp.loop = true;
VideoElementUp.muted = true;
VideoElementUp.playsInline = true;
VideoElementUp.autoplay = false;
VideoElementUp.currentTime = 0;

const VideoTextureUp = new THREE.VideoTexture(VideoElementUp);
VideoTextureUp.colorSpace = THREE.SRGBColorSpace;
VideoTextureUp.flipY = false;
VideoTextureUp.center.set(0.5, 0.5);
VideoTextureUp.rotation = (Math.PI / 2);
VideoTextureUp.repeat.set(0.8, 1);
VideoTextureUp.offset.set(0, -0.14);

// for sticky left
const VideoElementLeft = document.createElement("video");
VideoElementLeft.src = "./textures/videos/movies_video.mp4";
VideoElementLeft.loop = true;
VideoElementLeft.muted = true;
VideoElementLeft.playsInline = true;
VideoElementLeft.autoplay = false;
VideoElementLeft.currentTime = 0;

const VideoTextureLeft = new THREE.VideoTexture(VideoElementLeft);
VideoTextureLeft.colorSpace = THREE.SRGBColorSpace;
VideoTextureLeft.flipY = false;
VideoTextureLeft.center.set(0.5, 0.5);
VideoTextureLeft.rotation = (Math.PI / 2);
VideoTextureLeft.repeat.set(0.8, 1);
VideoTextureLeft.offset.set(0, -0.14);

// for sticky right
const VideoElementRight = document.createElement("video");
VideoElementRight.src = "./textures/videos/coop_video.mp4";
VideoElementRight.loop = true;
VideoElementRight.muted = true;
VideoElementRight.playsInline = true;
VideoElementRight.autoplay = false;
VideoElementRight.currentTime = 0;

const VideoTextureRight = new THREE.VideoTexture(VideoElementRight);
VideoTextureRight.colorSpace = THREE.SRGBColorSpace;
VideoTextureRight.flipY = false;
VideoTextureRight.center.set(0.5, 0.5);
VideoTextureRight.rotation = -(Math.PI / 2);
VideoTextureRight.repeat.set(0.8, 1);
VideoTextureRight.offset.set(0, 0.11);

// for gameboy
const VideoElementGame = document.createElement("video");
VideoElementGame.src = "./textures/videos/dkc2.mp4";
VideoElementGame.loop = true;
VideoElementGame.muted = true;
VideoElementGame.playsInline = true;
VideoElementGame.autoplay = false;
VideoElementGame.currentTime = 0;

const VideoTextureGame = new THREE.VideoTexture(VideoElementGame);
VideoTextureGame.colorSpace = THREE.SRGBColorSpace;
VideoTextureGame.flipY = false;
VideoTextureGame.center.set(0.5, 0.5);
VideoTextureGame.rotation = -(Math.PI / 2);
VideoTextureGame.repeat.set(0.9, 0.9);
VideoTextureGame.offset.set(0, 0);

// for TV
const VideoElementTV = document.createElement("video");
VideoElementTV.src = "./textures/videos/movies_video.mp4";
VideoElementTV.loop = true;
VideoElementTV.muted = true;
VideoElementTV.playsInline = true;
VideoElementTV.autoplay = true;
VideoElementTV.currentTime = 0;

const VideoTextureTV = new THREE.VideoTexture(VideoElementTV);
VideoTextureTV.colorSpace = THREE.SRGBColorSpace;
VideoTextureTV.flipY = false;
VideoTextureTV.center.set(0.5, 0.5);
VideoTextureTV.rotation = (Math.PI / 2);
VideoTextureTV.repeat.set(1.3, 1.3);
VideoTextureTV.offset.set(0.3, -0.1);

const showcaseVideos = new Map([
    ['monitorup', VideoElementUp],
    ['monitorleft', VideoElementLeft],
    ['tv_screen', VideoElementLeft],
    ['monitorright', VideoElementRight],
    ['gameboy_screen', VideoElementGame],
    ['stickyright', VideoElementRight],
    ['stickyleft', VideoElementLeft],
    ['casette', VideoElementLeft],
    ['stickyup', VideoElementUp],
    ['book', VideoElementUp],
]);

// ========== LOADING SCREEN FUNCTIONS ==========
let initialFinished = false;
function setupLoadingScreenButton() {
    const loadingScreen = document.querySelector(".loading-screen");
    const loadingScreenButton = document.querySelector(".loading-screen-button");
    const noSoundButton = document.querySelector(".no-sound-button");

    if (!loadingScreen || !loadingScreenButton) {
        console.error("Loading screen elements not found!");
        startExperience();
        return;
    }

    console.log("Setting up loading screen button...");

    // Style the button to show it's ready
    loadingScreenButton.textContent = "Enter!";
    loadingScreenButton.style.border = "8px solid #3d5166ff";
    loadingScreenButton.style.background = "#67809a";
    loadingScreenButton.style.color = "#3d5166ff";
    loadingScreenButton.style.paddingTop = "1px";
    loadingScreenButton.style.boxShadow = "rgba(0, 0, 0, 0.24) 0px 3px 8px";
    loadingScreenButton.style.cursor = "pointer";
    loadingScreenButton.style.pointerEvents = "auto";
    loadingScreenButton.style.transition = "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";

    noSoundButton.textContent = "Enter without music";
    noSoundButton.style.border = "8px solid #3d5166ff";
    noSoundButton.style.background = "#67809a";
    noSoundButton.style.color = "#3d5166ff";
    noSoundButton.style.paddingTop = "1px";
    noSoundButton.style.boxShadow = "rgba(0, 0, 0, 0.24) 0px 3px 8px";
    noSoundButton.style.cursor = "pointer";
    noSoundButton.style.pointerEvents = "auto";
    noSoundButton.style.transition = "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";


    noSoundButton.style.display = "block";

    let isDisabled = false;

    function handleEnter(withSound = true) {
        if (isDisabled) return;
        isDisabled = true;

        console.log("Entering experience...");

        if (noSoundButton) {
            noSoundButton.textContent = "Enter without music";
        }
        loadingScreenButton.style.cursor = "default";
        noSoundButton.style.cursor = "default";
        loadingScreenButton.style.border = "8px solid #3d5166ff";
        loadingScreenButton.style.background = "#67809a";
        loadingScreenButton.style.color = "#3d5166ff";
        loadingScreenButton.style.boxShadow = "none";
        loadingScreenButton.textContent = "~ Welcome ~";
        noSoundButton.textContent = "~ To Hashim's Room ~";
        loadingScreen.style.background = "#67809a";
        loadingScreen.style.border = "8px solid #3d5166ff";

        playReveal();
    }

    loadingScreenButton.addEventListener("mouseenter", () => {
        loadingScreenButton.style.transform = "scale(1.1)";
    });
    noSoundButton.addEventListener("mouseenter", () => {
        noSoundButton.style.transform = "scale(1.1)";
    });
    noSoundButton.addEventListener("mouseleave", () => {
        noSoundButton.style.transform = "none";
    });

    loadingScreenButton.addEventListener("touchend", (e) => {
        e.preventDefault();
        touchHappened = true;
        handleEnter();
    });

    loadingScreenButton.addEventListener("click", (e) => {
        if (touchHappened) {
            touchHappened = false;
            return;
        }
        handleEnter(true);
    });

    loadingScreenButton.addEventListener("mouseleave", () => {
        loadingScreenButton.style.transform = "none";
    });

    if (noSoundButton) {
        noSoundButton.addEventListener("click", (e) => {
            if (touchHappened) {
                touchHappened = false;
                return;
            }
            handleEnter(false);
        });
    }
}

function playReveal() {
    const loadingScreen = document.querySelector(".loading-screen");
    if (!loadingScreen) {
        startExperience();
        return;
    }

    const tl = gsap.timeline();
    tl.to(loadingScreen, {
        scale: 0.5,
        duration: 1.2,
        delay: 0.25,
        ease: "back.in(1.8)",
    }).to(loadingScreen, {
        y: "-200vh",
        transform: "perspective(1000px) rotateX(45deg) rotateY(-35deg)",
        duration: 1.2,
        ease: "back.in(1.8)",
        onComplete: () => {
            modalShown = false;
            startExperience();
            loadingScreen.remove();
        }
    }, "-=0.1");
}

function startExperience() {
    console.log("InitialFinished set to:"+initialFinished);
    console.log("Starting experience...");
    playInitialAnimation();
    console.log("Initial animation finished.");
    initialFinished = true;
    console.log("InitialFinished set to:"+initialFinished);
}


// ========== MODAL FUNCTIONS ==========
document.querySelectorAll(".modal-exit-button").forEach(button => {
    button.addEventListener("touchend", (e) => {
        e.preventDefault();
        e.stopPropagation();
        touchHappened = true;
        const modal = e.target.closest(".modal");
        hideModal(modal);
    }, { passive: false });

    button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (touchHappened) {
            touchHappened = false;
            return;
        }
        const modal = e.target.closest(".modal");
        hideModal(modal);
    });
});


const showModal = (modal) => {
    if (modalShown || !modal) return;
    modalShown = true;
    controls.enabled = false;
    modal.style.display = "block";

    gsap.set(modal, { opacity: 0 });
    gsap.to(modal, {
        opacity: 1,
        duration: 0.5,
    });
};

const hideModal = (modal) => {
    if (!modal) return;
    modalShown = false;
    controls.enabled = true;
    
    gsap.to(modal, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
            modal.style.display = "none";
        }
    });
};

// ========== RAYCASTER INTERACTION ==========
function handleRaycasterInteraction(){
    
    if(currentIntersects.length>0 && modalShown == false){
        const object = currentIntersects[0].object;
        Object.entries(Links).forEach(([key,url]) =>{ //for links
             if(object.name.includes(key)){ // if contains links keys
                const newWindow = window.open();
                newWindow.opener = null;
                newWindow.location = url;
                newWindow.target = "_blank";
                newWindow.rel = "noopener noreferrer";
            }
            else if(object.name.includes("Showcase")){
                if (!showcaseMode ) {
                        enterShowcaseMode(object);
                    }
            }
            else if(object.name.includes("chair_thirdT_Raycast_rotation")){
                playRotation("chair");
            }
            else if(object.name.includes("ac_wind_secondT_Raycast_backandforth")){
                playRotation("acWind");
            }

        } 
        ); // object entries end
        if(object.name.includes("about_sign")) {
            showModal(modals.about);
        }else if(object.name.includes("projects_sign")) {
            showModal(modals.projects);
        }else if(object.name.includes("education_sign")) {
            showModal(modals.education);
        }
    }
}


// ========== SHOWCASE MODE FUNCTIONS ==========

function enterShowcaseMode(object) {
    if (showcaseMode || modalShown|| !initialFinished) return;
    
    showcaseMode = true;
    gsap.killTweensOf(object);
    if(object.name.includes("Hover")){
        gsap.to(object.scale, 
        {
            x: object.userData.initialScale.x, 
            y: object.userData.initialScale.y,
            z: object.userData.initialScale.z,
            duration:0.2,
            ease: "power1.out(1.5)",
        });
        gsap.to(object.position, 
        {
            x: object.userData.initialPosition.x, 
            y: object.userData.initialPosition.y, 
            z: object.userData.initialPosition.z, 
            duration:0.2,
            ease: "power1.out(1.5)",
            
        });
    }
   
    if( object.name.includes("tv")|| object.name.includes("book")|| object.name.includes("casette") || object.name.includes("monitorleft") ||object.name.includes("monitorup")) {
        
    controls.maxPolarAngle = Math.PI/2;
    controls.maxAzimuthAngle = Math.PI;
    }
    // if( object.name.includes("monitor")) {
    //     controls.minDistance = 6;
    //     controls.maxDistance = 6;
    // }
   
        
   controls.disablePanLimits();

    // Start playing the appropriate video
    for (const [key, video] of showcaseVideos) {
        if (object.name.toLowerCase().includes(key)) {
            video.currentTime = 0;
            video.play();
            break;
        }
    }
    
    // Determine which objects to showcase
    let objectsToShowcase = [];
    
    if (object.name.toLowerCase().includes("gameboy")) {
        // Find all gameboy related objects
        scene.traverse((child) => {
            if (child.isMesh) {
                if (child.name.includes("gameboy_screen_Raycast_Showcase")) {
                    objectsToShowcase.push(child);
                    gameboyScreen = child;
                    
                } else if (child.name.includes("gameboyScreenBody_firstT_Raycast_Showcase")) {
                    objectsToShowcase.push(child);
                    gameboyScreenBody = child;

                    // Store initial rotation
                    if (!child.userData.InitialRotation) {
                    }
                } else if (child.name.includes("gameboy_body_secondT_Raycast_Showcase")) {
                    objectsToShowcase.push(child);
                }
            }
        });
    } else {
        // Single object showcase
        objectsToShowcase = [object];
    }
    
    if (objectsToShowcase.length === 0) return;
    
    showcasedObjects = objectsToShowcase;
    
    // Store current camera state
    previousCameraPosition.copy(camera.position);
    previousControlsTarget.copy(controls.target);
    
    // Calculate bounding box for all showcased objects
    const combinedBox = new THREE.Box3();
    objectsToShowcase.forEach(obj => {
        const box = new THREE.Box3().setFromObject(obj);
        combinedBox.union(box);
    });
    
    const center = combinedBox.getCenter(new THREE.Vector3());

    const size = combinedBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Calculate optimal camera distance
    const fov = camera.fov * (Math.PI / 180);
    let cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) *2;

    if (object.name.includes("monitor_screen_Raycast_Showcase")){
        cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) *1;
    }

    
    // Calculate camera position (offset from center)
    const direction = new THREE.Vector3()
        .subVectors(camera.position, controls.target)
        .normalize();
    const showcasePosition = new THREE.Vector3()
        .copy(center)
        .add(direction.multiplyScalar(cameraDistance));
    
    // Animate camera to showcase position
    gsap.to(camera.position, {
        x: showcasePosition.x,
        y: showcasePosition.y,
        z: showcasePosition.z,
        duration: 1,
        ease: "power2.inOut"
    });
    
    gsap.to(controls.target, {
        x: center.x,
        y: center.y,
        z: center.z,
        duration: 1,
        ease: "power2.inOut",
        onComplete: () => {
        controls.setPanLimitsAroundObject(center, 0);

        }
    });
    showShowcaseUI();
}
function exitShowcaseMode() {
    if (!showcaseMode) return;
    controls.maxDistance = 40;
    controls.disablePanLimits();
        
    controls.maxPolarAngle = Math.PI/2.5;
    controls.maxAzimuthAngle = Math.PI/2;
    controls.disablePanLimits();
    // Stop and reset all showcase videos
    for (const video of showcaseVideos.values()) {
        video.pause();
        video.currentTime = 0;
    }

    // Animate camera back to original position
    gsap.to(camera.position, {
        x: previousCameraPosition.x,
        y: previousCameraPosition.y,
        z: previousCameraPosition.z,
        duration: 1,
        ease: "power2.inOut"
    });
    
    gsap.to(controls.target, {
        x: previousControlsTarget.x,
        y: previousControlsTarget.y,
        z: previousControlsTarget.z,
        duration: 1.2,
        ease: "power2.inOut",
        onComplete: () => {
            // Clean up
            controls.restorePanLimits();

            showcaseMode = false;
            showcasedObjects = [];
            
            // Hide showcase UI
            hideShowcaseUI();

        }
    });
}


// UI functions for showcase mode
function showShowcaseUI() {
    // Create exit button if it doesn't exist
    let exitButton = document.getElementById('showcase-exit');
    if (!exitButton) {
        exitButton = document.createElement('button');
        exitButton.id = 'showcase-exit';
        exitButton.textContent = '✕ Exit';
        exitButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border: 2px solid white;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            z-index: 1000;
            transition: background 0.3s;
        `;
        exitButton.addEventListener('mouseenter', () => {
            exitButton.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        exitButton.addEventListener('mouseleave', () => {
            exitButton.style.background = 'rgba(0, 0, 0, 0.7)';
        });
        exitButton.addEventListener('click', exitShowcaseMode);
        exitButton.addEventListener('touchend', exitShowcaseMode);
        document.body.appendChild(exitButton);
    }
    exitButton.style.display = 'block';

}

function hideShowcaseUI() {
    const exitButton = document.getElementById('showcase-exit');
    const instructions = document.getElementById('showcase-instructions');
    
    if (exitButton) exitButton.style.display = 'none';
    if (instructions) instructions.style.display = 'none';

}


// ========== 3D MODEL LOADING ==========
loader.load("/models/portfolio_compressed-models.glb", (glb) => {
    console.log("3D Model loaded successfully!");
    
    glb.scene.traverse(child => {
        if (child.isMesh) {
            // Raycast objects
            if (child.name.includes("Raycast")) {
                raycasterObjects.push(child);
            }
            
            // Hover objects
            if (child.name.includes("Hover")) {
                child.userData.initialScale = new THREE.Vector3().copy(child.scale);
                child.userData.initialPosition = new THREE.Vector3().copy(child.position);
                child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
                child.userData.isAnimating = false;
            }

            // Video materials
            if (child.name.includes("monitor_screen")) {
                child.material = new THREE.MeshBasicMaterial({ map: VideoTexture });
            } else if (child.name.includes("glass")) {
                child.material = glassMaterial;
            } else if (child.name.includes("monitorup_Raycast_Showcase")) {
                child.material = new THREE.MeshBasicMaterial({ map: VideoTextureUp });
            } else if (child.name.includes("monitorright_Raycast_Showcase")) {
                child.material = new THREE.MeshBasicMaterial({ map: VideoTextureRight });
            } else if (child.name.includes("monitorleft_Raycast_Showcase")) {
                child.material = new THREE.MeshBasicMaterial({ map: VideoTextureLeft });
            } else if (child.name.includes("tv_screen_Raycasted_Showcase")) {
                child.material = new THREE.MeshBasicMaterial({ map: VideoTextureTV });
            } else if (child.name.includes("gameboy_screen_Raycast_Showcase")) {
                child.material = new THREE.MeshBasicMaterial({ map: VideoTextureGame });
            }

            // Store important objects
            if (child.name.includes("Hat")) {
                hat = child;
                child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
            }
            if (child.name.includes("college")) {
                college = child;
                child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
            }
            if (child.name.includes("chair_thirdT_Raycast_rotation")) {
                chair = child;
                child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
            }
            
            // Store companion objects
            if (child.name.includes("Projects_T_RaycastV_thirdT_Raycast_Hverup")) {
                project1 = child;
                child.userData.initialPosition = new THREE.Vector3().copy(child.position);
            }
            if (child.name.includes("Projects_book_secondT_Raycast_Hverdown")) {
                project2 = child;
                child.userData.initialPosition = new THREE.Vector3().copy(child.position);
            }
            if (child.name.includes("About_ps2_firstT_Raycast_Hverup")) {
                about1 = child;
                child.userData.initialPosition = new THREE.Vector3().copy(child.position);
            }
            if (child.name.includes("About_controller_secondT_Raycast_Hverdown")) {
                about2 = child;
                child.userData.initialPosition = new THREE.Vector3().copy(child.position);
            }
            if (child.name.includes("Projects_tv_screen_thirdT_Raycast_Hverup")) {
                project3 = child;
                child.userData.initialPosition = new THREE.Vector3().copy(child.position);
            }
            if (child.name.includes("ac_wind_secondT_Raycast_backandforth")) {
                acWind = child;
                child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
            }
            if (child.name.includes("projects_lights_secondT_Raycast_dropdown")) {
                projectLight = child;
                child.userData.initialPosition = new THREE.Vector3().copy(child.position);
            }
            if (child.name.includes("project_wire_firstT_Raycast_dropdown")) {
                projectWire = child;
                child.userData.initialPosition = new THREE.Vector3().copy(child.position);
            }
            if (child.name.includes("about_lights_firstT_Raycast_dropdown")) {
                aboutLight = child;
                child.userData.initialPosition = new THREE.Vector3().copy(child.position);
            }
            if (child.name.includes("about_wire_firstT_Raycast_dropdown")) {
                aboutWire = child;
                child.userData.initialPosition = new THREE.Vector3().copy(child.position);
            }

            // Fans
            if (child.name.includes("fan")) {
                if (child.name.includes("front")) {
                    xAxisFans.push(child);
                } else if (child.name.includes("back")) {
                    yAxisFans.push(child);
                } else {
                    zAxisFans.push(child);
                }
            }

            // Initial animation objects
            if (child.name.includes("Hover") || child.name.includes("sign") || 
                child.name.includes("light") || child.name.includes("wire") || 
                child.name.includes("hanging") || child.name.includes("pizza") || 
                child.name.includes("ps") || child.name.includes("controller") || 
                child.name.includes("japanese") || child.name.includes("gameboy") || 
                child.name.includes("speaker") || child.name.includes("casette")) {
                
                child.userData.initialScale = new THREE.Vector3().copy(child.scale);
                child.userData.initialPosition = new THREE.Vector3().copy(child.position);
                child.scale.set(0, 0, 0);
                initialAnimationObjs.push(child);
            }

            // Apply textures
            Object.keys(TextureMap).forEach(keys => {
                if (child.name.includes(keys)) {
                    const material = new THREE.MeshBasicMaterial({
                        map: loadedTextures.day[keys],
                    });
                    child.material = material;

                    if (child.material.map) {
                        child.material.map.minFilter = THREE.LinearFilter;
                    }
                }
            });
        }
    });
    
    scene.add(glb.scene);
    
    // Try to start video playback
    setTimeout(() => {
        try {
            VideoElement.play().catch(e => console.log("Video play failed:", e));
            VideoElementTV.play().catch(e => console.log("TV video play failed:", e));
        } catch (e) {
            console.log("Video element error:", e);
        }
    }, 1000);
    
}, undefined, (error) => {
    console.error("Error loading 3D model:", error);
});

// ========== ANIMATION FUNCTIONS ==========
function playInitialAnimation() {
    console.log("Playing initial animation for", initialAnimationObjs.length, "objects");
    
    if (initialAnimationObjs.length === 0) {
        console.warn("No objects to animate!");
        return;
    }
    
    const t1 = gsap.timeline({ ease: "back.out(1.5)" });
    
    for (let x = 0; x < initialAnimationObjs.length; x++) {
        t1.to(initialAnimationObjs[x].scale, {
            x: initialAnimationObjs[x].userData.initialScale.x,
            y: initialAnimationObjs[x].userData.initialScale.y,
            z: initialAnimationObjs[x].userData.initialScale.z,
            duration: 0.4,
            
        }, x * 0.05);

    }
}

function playSignAnimation(object, isHovering) {
    if (!about1 || !about2 || !project1 || !project2 || !project3 || !hat || !college || 
        !aboutWire || !aboutLight || !projectLight || !projectWire) return;
    
    if (showcaseMode) return;
    
    // Kill tweens for the sign object
    gsap.killTweensOf(object.scale);
    gsap.killTweensOf(object.position);
    gsap.killTweensOf(object.rotation);

    if (object.userData.isAnimating == true) return;

    if (isHovering) {
        if (object.name.includes("about")) {
            // Kill tweens for about objects
            gsap.killTweensOf(about1.position);
            gsap.killTweensOf(about2.position);
            gsap.killTweensOf(aboutWire.position);
            gsap.killTweensOf(aboutLight.position);
            
            gsap.to(object.position, {
                y: object.userData.initialPosition.y * 1.03,
                duration: 0.5,
                ease: "bounce.out(1.2)",
            });
            gsap.to(about1.position, {
                y: about1.userData.initialPosition.y * 1.08,
                duration: 0.5,
                ease: "bounce.out(1.2)",
            });
            gsap.to(about2.position, {
                y: about2.userData.initialPosition.y * 0.95,
                duration: 0.5,
                ease: "bounce.out(1.2)",
            });
            gsap.to(aboutWire.position, {
                y: aboutWire.userData.initialPosition.y * 0.94,
                duration: 0.2,
                ease: "back.out(0.3)",
            });
            gsap.to(aboutLight.position, {
                y: aboutLight.userData.initialPosition.y * 0.94,
                duration: 0.2,
                ease: "back.out(0.3)",
            });
        } else if (object.name.includes("education")) {
            // Speed up hat rotation
            hatRotationSpeed = 0.06;
            
            gsap.to(object.position, {
                y: object.userData.initialPosition.y * 1.03,
                duration: 0.5,
                ease: "bounce.out(1.2)",
            });
        } else if (object.name.includes("project")) {
            // Kill tweens for project objects
            gsap.killTweensOf(project1.position);
            gsap.killTweensOf(project2.position);
            gsap.killTweensOf(project3.position);
            gsap.killTweensOf(projectLight.position);
            gsap.killTweensOf(projectWire.position);
            
            gsap.to(object.position, {
                y: object.userData.initialPosition.y * 1.03,
                duration: 0.5,
                ease: "bounce.out(1.2)",
            });
            gsap.to(project1.position, {
                y: project1.userData.initialPosition.y * 1.09,
                duration: 0.5,
                ease: "bounce.out(1.2)",
            });
            gsap.to(project3.position, {
                y: project3.userData.initialPosition.y * 1.09,
                duration: 0.5,
                ease: "bounce.out(1.2)",
            });
            gsap.to(project2.position, {
                y: project2.userData.initialPosition.y * 0.97,
                duration: 0.5,
                ease: "back.out(0.3)",
            });
            gsap.to(projectLight.position, {
                y: projectLight.userData.initialPosition.y * 0.94,
                duration: 0.2,
                ease: "back.out(0.3)",
            });
            gsap.to(projectWire.position, {
                y: projectWire.userData.initialPosition.y * 0.94,
                duration: 0.2,
                ease: "back.out(0.3)",
            });
        }
    } else {
        // Kill all tweens when returning
        gsap.killTweensOf(about1.position);
        gsap.killTweensOf(about2.position);
        gsap.killTweensOf(project1.position);
        gsap.killTweensOf(project2.position);
        gsap.killTweensOf(project3.position);
        gsap.killTweensOf(projectLight.position);
        gsap.killTweensOf(projectWire.position);
        gsap.killTweensOf(aboutLight.position);
        gsap.killTweensOf(aboutWire.position);
        
        // Reset hat rotation speed to normal
        hatRotationSpeed = 0.009;
        
        gsap.to(object.position, {
            x: object.userData.initialPosition.x,
            y: object.userData.initialPosition.y,
            z: object.userData.initialPosition.z,
            duration: 0.3,
            ease: "power2.out",
        });
        gsap.to(about1.position, {
            x: about1.userData.initialPosition.x,
            y: about1.userData.initialPosition.y,
            z: about1.userData.initialPosition.z,
            duration: 0.3,
            ease: "power2.out",
        });
        gsap.to(about2.position, {
            x: about2.userData.initialPosition.x,
            y: about2.userData.initialPosition.y,
            z: about2.userData.initialPosition.z,
            duration: 0.3,
            ease: "power2.out",
        });
        gsap.to(project1.position, {
            x: project1.userData.initialPosition.x,
            y: project1.userData.initialPosition.y,
            z: project1.userData.initialPosition.z,
            duration: 0.3,
            ease: "power2.out",
        });
        gsap.to(project3.position, {
            x: project3.userData.initialPosition.x,
            y: project3.userData.initialPosition.y,
            z: project3.userData.initialPosition.z,
            duration: 0.3,
            ease: "power2.out",
        });
        gsap.to(project2.position, {
            x: project2.userData.initialPosition.x,
            y: project2.userData.initialPosition.y,
            z: project2.userData.initialPosition.z,
            duration: 0.3,
            ease: "power2.out",
        });
        gsap.to(projectLight.position, {
            x: projectLight.userData.initialPosition.x,
            y: projectLight.userData.initialPosition.y,
            z: projectLight.userData.initialPosition.z,
            duration: 0.3,
            ease: "power2.out",
        });
        gsap.to(projectWire.position, {
            x: projectWire.userData.initialPosition.x,
            y: projectWire.userData.initialPosition.y,
            z: projectWire.userData.initialPosition.z,
            duration: 0.3,
            ease: "power2.out",
        });
        gsap.to(aboutLight.position, {
            x: aboutLight.userData.initialPosition.x,
            y: aboutLight.userData.initialPosition.y,
            z: aboutLight.userData.initialPosition.z,
            duration: 0.3,
            ease: "power2.out",
        });
        gsap.to(aboutWire.position, {
            x: aboutWire.userData.initialPosition.x,
            y: aboutWire.userData.initialPosition.y,
            z: aboutWire.userData.initialPosition.z,
            duration: 0.3,
            ease: "power2.out",
        });
    }
}

function playHoverAnimation(object, isHovering) {
    gsap.killTweensOf(object.scale);
    if ((showcaseMode && !object.name.includes("Link")) || modalShown) {
        gsap.to(object.scale, {
            x: object.userData.initialScale.x,
            y: object.userData.initialScale.y,
            z: object.userData.initialScale.z,
            duration: 0.2,
            ease: "power1.out(1.5)",
        });
        gsap.to(object.position, {
            x: object.userData.initialPosition.x,
            y: object.userData.initialPosition.y,
            z: object.userData.initialPosition.z,
            duration: 0.2,
            ease: "power1.out(1.5)",
        });
    }

    gsap.killTweensOf(object.position);
    gsap.killTweensOf(object.rotation);
    if (object.userData.isAnimating == true) return;
    if (showcaseMode && !object.name.includes("Link")) return;
    
    if (isHovering) {
        if (object.name.includes("email") || object.name.includes("github") || object.name.includes("Link")) {
            gsap.to(object.scale, {
                x: object.userData.initialScale.x * 1.07,
                y: object.userData.initialScale.y * 1.07,
                z: object.userData.initialScale.z * 1.07,
                duration: 0.1,
                ease: "power1.in(1.2)",
            });
        } else {
            gsap.to(object.scale, {
                x: object.userData.initialScale.x * 1.05,
                y: object.userData.initialScale.y * 1.05,
                z: object.userData.initialScale.z * 1.05,
                duration: 0.1,
                ease: "back.out(1.2)",
            });
            gsap.to(object.position, {
                y: object.userData.initialPosition.y * 1.02,
                duration: 0.3,
                ease: "back.out(1.2)",
            });
        }
    } else {
        gsap.to(object.scale, {
            x: object.userData.initialScale.x,
            y: object.userData.initialScale.y,
            z: object.userData.initialScale.z,
            duration: 0.2,
            ease: "power1.out(1.5)",
        });
        gsap.to(object.position, {
            x: object.userData.initialPosition.x,
            y: object.userData.initialPosition.y,
            z: object.userData.initialPosition.z,
            duration: 0.2,
            ease: "power1.out(1.5)",
        });
    }
}

function playRotation(str="chair"){
    gsap.killTweensOf(chair.rotation);
    gsap.killTweensOf(acWind.rotation);
    if(str=="chair"){
        if(chair.userData.isAnimating==true) return;
            gsap.to(chair.rotation, 
        {
            y: chair.userData.initialRotation.y+=0.7, 
            duration:0.8,
            ease: "back.out(0.3)",
        });
    }
    
}

// ========== EVENT LISTENERS ==========
window.addEventListener("mousemove", (e) => {
    touchHappened = false;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("touchstart", (e) => {
    if (modalShown) return;
    e.preventDefault();
    pointer.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
}, { passive: false });

window.addEventListener("touchend", (e) => {
    if (modalShown) return;
    e.preventDefault();
    handleRaycasterInteraction();
}, { passive: false });

window.addEventListener("click", handleRaycasterInteraction);

// ========== RENDERER, CAMERA, CONTROLS ==========
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Set initial camera position
function isMobileDevice() {
    return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

if (isMobileDevice()) {
    camera.position.set(35, 12, 15);
    controls.target.set(0, 3, -5);
} else {
    controls.target.set(0.4400524357121032, 2.5418277507745324, -1.9949537530251464);
    camera.position.set(24.582005330007135, 11.721829673437739, 12.681810758706163);
}

// Control limitations
controls.minPolarAngle = 0;
controls.minAzimuthAngle = 0;
controls.maxPolarAngle = Math.PI / 2.5;
controls.maxAzimuthAngle = Math.PI / 2;
controls.minDistance = 1;
controls.maxDistance = 40;

// Add pan limit methods to controls
controls.setPanLimitsAroundObject = function(center, radius) {
    this.minPan = new THREE.Vector3(center.x - radius, center.y - radius, center.z - radius);
    this.maxPan = new THREE.Vector3(center.x + radius, center.y + radius, center.z + radius);
    this.enablePanLimits = true;
};


// ========== WINDOW RESIZE ==========
window.addEventListener("resize", () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    if (isMobileDevice()) {
        camera.position.set(35, 12, 15);
        controls.target.set(0, 3, -5);
    }
    
    controls.update();
});

// ========== RENDER LOOP ==========
const render = () => {

    controls.update();

    // Fans rotation
    zAxisFans.forEach((fan) => {
        fan.rotation.y += 0.01;
    });
    yAxisFans.forEach((fan) => {
        fan.rotation.z += 0.01;
    });
    xAxisFans.forEach((fan) => {
        fan.rotation.x += 0.01;
    });

    // Hat constant rotation
    if (hat && showcaseMode == false) {
        college.rotation.y += hatRotationSpeed;
        hat.rotation.y += hatRotationSpeed;
    }

    // AC Wind rotation
    if (acWind) {
        // Simplified AC wind rotation - you can improve this
        acWind.rotation.y += 0.01;
        acWind.rotation.y += 0.01;
        acWind.rotation.y += 0.01;
        acWind.rotation.y += 0.01;
        acWind.rotation.y -= 0.01;
        acWind.rotation.y -= 0.01;
        acWind.rotation.y -= 0.01;
        acWind.rotation.y -= 0.01;
    }

    // Raycaster
    raycaster.setFromCamera(pointer, camera);
    currentIntersects = raycaster.intersectObjects(raycasterObjects);

    if (currentIntersects.length > 0) {
        const currentIntersectObject = currentIntersects[0].object;

        // Handle sign animations separately
        if (currentIntersectObject.name.includes("sign") && modalShown == false) {
            if (currentIntersectObject !== currentHoverObject) {
                if (currentHoverObject) {
                    if (currentHoverObject.name.includes("sign")) {
                        playSignAnimation(currentHoverObject, false);
                    } else {
                        playHoverAnimation(currentHoverObject, false);
                    }
                }
                playSignAnimation(currentIntersectObject, true);
                currentHoverObject = currentIntersectObject;
            }
        } else if (currentIntersectObject.name.includes("Hover") && modalShown == false) {
            if (currentIntersectObject !== currentHoverObject) {
                if (currentHoverObject) {
                    if (currentHoverObject.name.includes("sign")) {
                        playSignAnimation(currentHoverObject, false);
                    } else {
                        playHoverAnimation(currentHoverObject, false);
                    }
                }
                playHoverAnimation(currentIntersectObject, true);
                currentHoverObject = currentIntersectObject;
            }
        }

        // Update cursor
        if (modalShown == false && showcaseMode == false) {
            if (currentIntersectObject.name.includes("Showcase") ||
                currentIntersectObject.name.includes("sign") ||
                currentIntersectObject.name.includes("chair") ||
                currentIntersectObject.name.includes("github") ||
                currentIntersectObject.name.includes("email") ||
                currentIntersectObject.name.includes("COOP")||
                currentIntersectObject.name.includes("Link")) {
                document.body.style.cursor = "pointer";
            }
        } else {
            document.body.style.cursor = "default";
           
        }
    } else {
        if (currentHoverObject) {
            if (currentHoverObject.name.includes("sign")) {
                playSignAnimation(currentHoverObject, false);
            } else {
                playHoverAnimation(currentHoverObject, false);
            }
            currentHoverObject = null;
        }
        document.body.style.cursor = "default";
    }

    renderer.render(scene, camera);
    window.requestAnimationFrame(render);
};

// Start the render loop
render();

// Safety fallback - if loading takes too long
setTimeout(() => {
    if (!resourcesLoaded) {
        console.warn("Loading timeout - forcing experience start");
        const loadingScreen = document.querySelector(".loading-screen");
        if (loadingScreen) {
            loadingScreen.remove();
        }
        startExperience();
    }
}, 10000); // 10 second timeout