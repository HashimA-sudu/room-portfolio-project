import * as THREE from 'three';
import './style.scss'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter, ThreeMFLoader } from 'three/examples/jsm/Addons.js';
import { zip } from 'three/examples/jsm/libs/fflate.module.js';
import gsap from "gsap";

const raycaster = new THREE.Raycaster();
const raycasterObjects = [];

let currentIntersects = [];
let currentHoverObject = null;

const pointer = new THREE.Vector2();
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
    FirstT: {day:"/textures/mapping/firstTextureFinal.webp" },
    first:{day:"/textures/mapping/firstTextureFinal.webp" },
    secondT:{day: "/textures/mapping/secondTextureFinal.webp"},
    thirdT:{day: "/textures/mapping/thirdTextureSetFinal.webp"},
    inanimate_thirdT:{day: "/textures/mapping/thirdTextureSetFinal.webp"},
    leaf: {day: "/textures/mapping/leaf.png"},
    collegeT: {day:"/textures/mapping/collegeSetFinal.webp"},
    //glass: {day:""},
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
    TextureDay.generateMipmaps = false;
    TextureDay.colorSpace = THREE.SRGBColorSpace
    loadedTextures.day[key] = TextureDay;
    
});

const scene = new THREE.Scene();
scene.environment = envTexture;
scene.background = envTexture;

//materials
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

const Links = {
    "github":"https://github.com/HashimA-sudu/",
    "email":"mailto:hashimhamadalshawaf@gmail.com",
}

const modals = {
    about:document.querySelector(".modal.about"),
    projects:document.querySelector(".modal.projects"),
    education:document.querySelector(".modal.education"),
}

// Companion objects for signs
let about1 = null;
let about2 = null;
let project1 = null;
let project2 = null;
let project3 = null;

let hat = null;
let college = null;
let hatRotationSpeed = 0.009; // Base rotation speed
let chair = null;
let acWind = null;
let acActive = 0;


let touchHappened = false;
document.querySelectorAll(".modal-exit-button").forEach(button=>{
    button.addEventListener("touchend", (e)=>{
        touchHappened = true;
        const modal = e.target.closest(".modal");
        hideModal(modal);
    }, {passive:true}
    )

    button.addEventListener("click", (e)=>{
        if(touchHappened) return;
        const modal = e.target.closest(".modal");
        hideModal(modal);
    }, {passive:true}
    )
});

const showModal = (modal) => {
    modal.style.display = "block";

    gsap.set(modal, {opacity:0});
    gsap.to(modal, {
        opacity:1,
        duration: 0.5,
    })

};
const hideModal = (modal) => {

    gsap.set(modal, {opacity:1});
    gsap.to(modal, {
        opacity:0,
        duration: 0.5,
        onComplete: () =>{
            modal.style.display = "none";
        }
    })

};

//screen videos (gameMAN, monitor, tv screen, etc..)
const VideoElement = document.createElement("video");
VideoElement.src = "./textures/videos/monitor.mp4";
VideoElement.loop = true;
VideoElement.muted = true;
VideoElement.playsInline = true;
VideoElement.autoplay = true;
VideoElement.play();

const VideoTexture = new THREE.VideoTexture(VideoElement);
VideoTexture.colorSpace = THREE.SRGBColorSpace;
VideoTexture.flipY = false;

//fans of pc
const xAxisFans = []; //front fans
const yAxisFans = []; //back fans
const zAxisFans = []; //gpu fans

function handleRaycasterInteraction(){
    if(currentIntersects.length>0){
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
                //put for showcase 
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

window.addEventListener("mousemove", (e)=>
{
    touchHappened = false;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener("touchstart", (e)=>
{
    e.preventDefault();
    pointer.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
},{passive: false});

window.addEventListener("touchend", (e)=>
{
    e.preventDefault();
    handleRaycasterInteraction();
},{passive: false});


//clicking on showcase objs or github/email
window.addEventListener("click", handleRaycasterInteraction);

//traversing children
loader.load("/models/portfolio_compressed-models.glb", (glb)=>
{ 
    glb.scene.traverse(child=>{
        
        if(child.isMesh){
            
            if(child.name.includes("Raycast")) {
                raycasterObjects.push(child);
                //console.log("Child "+child.name+" in raycast objects")
            }
            if(child.name.includes("Hover")) {
                    child.userData.initialScale = new THREE.Vector3().copy(child.scale);
                    child.userData.initialPosition = new THREE.Vector3().copy(child.position);
                    child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
                //console.log("Child "+child.name+" in raycast objects")
                    child.userData.isAnimating = false;
            }

            if(child.name.includes("monitor_screen")) {
                child.material = new THREE.MeshBasicMaterial({
                   map: VideoTexture,
                });}    
            else if(child.name.includes("glass")) {                    
                    child.material = glassMaterial;
            }
            
            // Store the hat
            if(child.name.includes("Hat")){
                hat = child;
                child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
            }
            if(child.name.includes("college")){
                college = child;
                child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
            }
            if(child.name.includes("chair_thirdT_Raycast_rotation")){
                chair = child;
                child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
            }
            
            // Store companion objects
            if(child.name.includes("Projects_T_RaycastV_thirdT_Raycast_Hverup")){
                project1 = child;
                child.userData.initialPosition = new THREE.Vector3().copy(child.position);
            }
            else if(child.name.includes("Projects_book_secondT_Raycast_Hverdown")){
                project2 = child;
                child.userData.initialPosition = new THREE.Vector3().copy(child.position);
            }
            else if(child.name.includes("About_ps2_firstT_Raycast_Hverup")){
                about1 = child;
                child.userData.initialPosition = new THREE.Vector3().copy(child.position);
            }
            else if(child.name.includes("About_controller_secondT_Raycast_Hverdown")){
                about2 = child;
                child.userData.initialPosition = new THREE.Vector3().copy(child.position);
            }
            else if(child.name.includes("Projects_tv_screen_thirdT_Raycast_Hverup")){
                project3 = child;
                child.userData.initialPosition = new THREE.Vector3().copy(child.position);
            }
            else if(child.name.includes("ac_wind_secondT_Raycast_backandforth")){
                acWind = child;
                child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
            }
            
            if(child.name.includes("fan")){
                if (child.name.includes("front")){
                    xAxisFans.push(child);
                }
                else if(child.name.includes("back")) {
                    yAxisFans.push(child);
                }
                else 
                    zAxisFans.push(child);
            }

            // Debug: Log all mesh names to console
             if (!child.name.includes("leaf")){console.log("Mesh found:", child.name);}
            
            Object.keys(TextureMap).forEach(keys=> { // assign materials
                if (child.name.includes(keys)) 
                    {
                        const material = new THREE.MeshBasicMaterial({
                        map: loadedTextures.day[keys],
                    });
                
                
                    child.material = material;

                    if(child.material.map)
                        { // fix distance thing
                            child.material.map.minFilter = THREE.LinearFilter;
                        }   
                    }
            });
        }
        // else {
        //     console.log("child is not mesh: ", child.name)
        // }

    })
    scene.add(glb.scene);

});

const camera = new THREE.PerspectiveCamera( 
    35,
    sizes.width / sizes.height,
    0.1,
    1000);
//default camera position
camera.position.set(27.751215392472087,9.279443596422004, 8.730269582361316);


const renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
renderer.setSize( sizes.width, sizes.height );
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))

camera.position.z = 5;

const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(2.978904510135682,2.7952939833198513 ,-6.329682566513317); 

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

function playSignAnimation(object, isHovering){
    if(!about1||!about2||!project1||!project2||!project3||!hat||!college) return;
    console.log("playing sign anim for:", object.name)
    
    // Kill tweens for the sign object
    gsap.killTweensOf(object.scale);
    gsap.killTweensOf(object.position);
    gsap.killTweensOf(object.rotation);

    if(object.userData.isAnimating==true) return;

    if(isHovering){
        
        if(object.name.includes("about")){
            // Kill tweens for about objects
            gsap.killTweensOf(about1.position);
            gsap.killTweensOf(about2.position);
            
            gsap.to(object.position, 
        {
            y: object.userData.initialPosition.y*1.03, 
            duration:0.5,
            ease: "bounce.out(1.2)",
            
        });
            gsap.to(about1.position, 
        {
            y: about1.userData.initialPosition.y*1.08, 
            duration:0.5,
            ease: "bounce.out(1.2)",
            
        });
            gsap.to(about2.position, 
        {
            y: about2.userData.initialPosition.y*0.95, 
            duration:0.5,
            ease: "bounce.out(1.2)",
            
        });
        }
        else if(object.name.includes("education")){
            // Speed up hat rotation
            
            hatRotationSpeed = 0.06; // Faster rotation speed
            
            gsap.to(object.position, 
        {
            y: object.userData.initialPosition.y*1.03, 
            duration:0.5,
            ease: "bounce.out(1.2)",
            
        });
        }
        else if(object.name.includes("project")){
            // Kill tweens for project objects
            gsap.killTweensOf(project1.position);
            gsap.killTweensOf(project2.position);
            gsap.killTweensOf(project3.position);
            
            gsap.to(object.position, 
        {
            y: object.userData.initialPosition.y*1.03, 
            duration:0.5,
            ease: "bounce.out(1.2)",
            
        });
            gsap.to(project1.position, 
        {
            y: project1.userData.initialPosition.y*1.08, 
            duration:0.5,
            ease: "bounce.out(1.2)",
            
        });
            gsap.to(project3.position, 
        {
            y: project3.userData.initialPosition.y*1.08, 
            duration:0.5,
            ease: "bounce.out(1.2)",
            
        });
            gsap.to(project2.position, 
        {
            y: project2.userData.initialPosition.y*0.95, 
            duration:0.5,
            ease: "bounce.out(1.2)",
            
        });
        }
    
    }else {
        
        // Kill all tweens when returning
        gsap.killTweensOf(about1.position);
        gsap.killTweensOf(about2.position);
        gsap.killTweensOf(project1.position);
        gsap.killTweensOf(project2.position);
        gsap.killTweensOf(project3.position);
        
        // Reset hat rotation speed to normal
        hatRotationSpeed = 0.009;
        
        
        gsap.to(object.position, 
        {
            x: object.userData.initialPosition.x, 
            y: object.userData.initialPosition.y, 
            z: object.userData.initialPosition.z, 
            duration:0.3,
            ease: "power2.out",
            
        });
        gsap.to(about1.position, 
        {
            x: about1.userData.initialPosition.x, 
            y: about1.userData.initialPosition.y, 
            z: about1.userData.initialPosition.z, 
            duration:0.3,
            ease: "power2.out",
            
        });
        gsap.to(about2.position, 
        {
            x: about2.userData.initialPosition.x, 
            y: about2.userData.initialPosition.y, 
            z: about2.userData.initialPosition.z, 
            duration:0.3,
            ease: "power2.out",
            
        });
        gsap.to(project1.position, 
        {
            x: project1.userData.initialPosition.x, 
            y: project1.userData.initialPosition.y, 
            z: project1.userData.initialPosition.z, 
            duration:0.3,
            ease: "power2.out",
            
        });
        gsap.to(project3.position, 
        {
            x: project3.userData.initialPosition.x, 
            y: project3.userData.initialPosition.y, 
            z: project3.userData.initialPosition.z, 
            duration:0.3,
            ease: "power2.out",
            
        });
        gsap.to(project2.position, 
        {
            x: project2.userData.initialPosition.x, 
            y: project2.userData.initialPosition.y, 
            z: project2.userData.initialPosition.z, 
            duration:0.3,
            ease: "power2.out",
            
        });
    }
}

function playHoverAnimation(object, isHovering){
    gsap.killTweensOf(object.scale);
    gsap.killTweensOf(object.position);
    gsap.killTweensOf(object.rotation);

    if(object.userData.isAnimating==true) return;

    if(isHovering){
        if(object.name.includes("college")){
            gsap.to(object.position, 
        {
            y: object.userData.initialPosition.y*1.4, 
            duration:0.5,
            ease: "bounce.out(1)",
            
        });}
        else{
            gsap.to(object.position, 
            {
                y: object.userData.initialPosition.y*1.03, 
                duration:0.5,
                ease: "bounce.out(1.2)",
                
            });
        }
    
    }else {
        gsap.to(object.scale, 
        {
            x: object.userData.initialScale.x, 
            y: object.userData.initialScale.y,
            z: object.userData.initialScale.z,
            duration:0.2,
            ease: "bounce.out(1.5)",
        });
        gsap.to(object.position, 
        {
            x: object.userData.initialPosition.x, 
            y: object.userData.initialPosition.y, 
            z: object.userData.initialPosition.z, 
            duration:0.2,
            ease: "bounce.out(1.5)",
            
        });
    }
}

function playRotation(str){
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
    else if(str=="acWind"){
        console.log("clicked on ac wind thing");
        if(acActive>3){
            acActive=0
        }else
            acActive+=1;
        console.log("now it is: "+acActive);
    }
}
const render = () =>{
    controls.update();
    // console.log(camera.position);
    // console.log("------");
    // console.log(controls.target);

    //fans rotation (yes this is correctly implemented)
    zAxisFans.forEach((fan)=>{
        fan.rotation.y+=0.01;
    });
    yAxisFans.forEach((fan)=>{
        fan.rotation.z+=0.01;
    });
    xAxisFans.forEach((fan)=>{
        fan.rotation.x+=0.01;
    });

    // Hat constant rotation
    if(hat) {
        college.rotation.y+=hatRotationSpeed;
        hat.rotation.y += hatRotationSpeed;
    }

    // if(acActive<3){
    //     console.log("AC rotation is: "+acWind.rotation.y);
    //     if(acWind.rotation.y==1){
    //         acWind.rotation.y-=0.01;
    //     }
    //     else if (acWind.rotation.y==0)
    //     {
    //         acWind.rotation.y+=0.01;
    //     }
    // }

    //raycaster

    raycaster.setFromCamera(pointer, camera);

    currentIntersects = raycaster.intersectObjects(raycasterObjects);

    for (let i = 0; i<currentIntersects.length; i++){
       // currentIntersects[i].object.material.color.set(0xff0000);
    }

    if(currentIntersects.length>0){ //if there are intersects

        const currentIntersectObject = currentIntersects[0].object;

        // Handle sign animations separately
        if(currentIntersectObject.name.includes("sign")){
            if(currentIntersectObject!==currentHoverObject){
                if(currentHoverObject) {
                    if(currentHoverObject.name.includes("sign")){
                        playSignAnimation(currentHoverObject, false);
                    } else {
                        playHoverAnimation(currentHoverObject, false);
                    }
                }
                playSignAnimation(currentIntersectObject, true); 
                currentHoverObject = currentIntersectObject;
            }
        }
        else if(currentIntersectObject.name.includes("Hover")){
            if(currentIntersectObject!==currentHoverObject){
                if(currentHoverObject) {
                    if(currentHoverObject.name.includes("sign")){
                        playSignAnimation(currentHoverObject, false);
                    } else {
                        playHoverAnimation(currentHoverObject, false);
                    }
                }
                playHoverAnimation(currentIntersectObject, true); 
                currentHoverObject = currentIntersectObject;
            }
        }
        

        if(currentIntersectObject.name.includes("Showcase")){ //showcase objects
        document.body.style.cursor = "pointer";
        }
        else if (currentIntersectObject.name.includes("sign")) { // signs
        document.body.style.cursor = "pointer";
        }
        else if (currentIntersectObject.name.includes("chair")) { // rotating chair
        document.body.style.cursor = "pointer";
        }
        else if(currentIntersectObject.name.includes("github")) { // 
        document.body.style.cursor = "pointer";
        }
        else if(currentIntersectObject.name.includes("email")) { // 
        document.body.style.cursor = "pointer";
        }
        else if(currentIntersectObject.name.includes("backandforth")){
        document.body.style.cursor = "pointer";

        }
        else
        {        
            document.body.style.cursor = "default";    
        }

    
    }
    else {

        if(currentHoverObject) 
            {
                if(currentHoverObject.name.includes("sign")){
                    playSignAnimation(currentHoverObject, false);
                } else {
                    playHoverAnimation(currentHoverObject, false);
                }
                currentHoverObject = null;
            }
        document.body.style.cursor = "default";} // no intersects
        
    renderer.render( scene, camera );
    window.requestAnimationFrame(render)
}

render()