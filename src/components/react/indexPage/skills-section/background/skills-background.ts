import CSS from './style.css?inline';
import { renderHTML } from './render';
import * as THREE from 'three';
import { Box3, MathUtils, SphereGeometry, Vector3 } from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Shapes } from './types';
import earthShapeURL from './shapes/earth2.glb?url';
import jupiterShapeURL from './shapes/jupiter.glb?url';
export class SkillsBackground extends HTMLElement {
  get #width() {
    return window.innerWidth
  }
  get #height() {
    return window.innerHeight
  }
  get orbitCenter() {
    if(this.#width>this.#height * 1.33){
      // biggest screen
      return new Vector3(-1 * this.sphereRadius, 0, 0)
    }
    const cqw = this.pixelsToUnit(this.#width);
    const endCenterX = -1*cqw/2;
    if(this.#height>=this.#width){
      // we get back more than 50% (60%) to fit it in most phones
      return new Vector3(endCenterX*1.2, 0, 0)
    }
    const contentContainerWidth = this.pixelsToUnit(this.#height )
    const contentCenter = endCenterX + (contentContainerWidth/2);
    const padding =  endCenterX - contentCenter ;
    const x = padding + this.sphereRadius;
    console.log(x);
    
    return new Vector3(x, 0, 0)
  }
  get sphereRadius() {
    // console.log(this.#sphereFillPercent);
   return this.getRadiusBaseOnPercent(this.#sphereFillPercent);
  }
  getRadiusBaseOnPercent(percent:number){
     return (this.pixelsToUnit(this.#height * (percent / 100))) / 2;
  }
  #sphereFillPercent = 45;
  get sphereFillPercent() {
    return this.#sphereFillPercent;
  }
  set sphereFillPercent(value: number) {
    console.log(value);

    this.#sphereFillPercent = value;
    this.#setPositions();
  }
  #canvas: HTMLCanvasElement;
  #camera: THREE.PerspectiveCamera | null = null;
  #renderer: THREE.WebGLRenderer | null = null;
  #scene: THREE.Scene | null = null;
  #shapes: Shapes = {
    core: null,
    earth: null,
    jupiter: null,
    jupiterOrbit: null,
    earthOrbit: null,
  }
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ delegatesFocus: false, mode: 'open' });
    const html = `<style>${CSS}</style>\n${renderHTML()}`;
    const element = document.createElement('template');
    element.innerHTML = html;
    shadowRoot.appendChild(element.content.cloneNode(true));
    this.#canvas = shadowRoot.querySelector(".bg-canvas")!

  }
  connectedCallback() {
    window.addEventListener("resize", () => {
      this.#setPositions();
    })
    this.#initScenes();
  }
  static get observedAttributes() {
    return ['sphere-fill-percent'];
  }
  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    switch (name) {
      case 'sphere-fill-percent':
        this.sphereFillPercent = Number(newValue);
        break;
    }
  }
  #setPositions() {
    this.#renderer?.setSize(this.#width, this.#height);
    this.#shapes.core?.position.copy(this.orbitCenter);
    this.#shapes.core?.geometry.dispose();
    this.#shapes.core!.geometry = new SphereGeometry(this.sphereRadius, 16, 16);
    //size
    const maxSize = (this.sphereRadius * 2) * 1 / 6;
    this.#shapes.earth?.scale.setScalar(this.#calcModelScale(this.#shapes.earth, maxSize));
    //set scale
    const jupiterMaxSize = (this.sphereRadius * 2) * 2 / 6;
    this.#shapes.jupiter?.scale.setScalar(this.#calcModelScale(this.#shapes.jupiter, jupiterMaxSize));
    //pos
    this.#shapes.jupiterOrbit?.position.copy(this.orbitCenter);
    this.#shapes.jupiter?.position.setX(this.sphereRadius * 1.6)
    this.#shapes.earthOrbit?.position.copy(this.orbitCenter);
    this.#shapes.earth?.position.setX(this.sphereRadius * 2);
    this.#renderer?.render(this.#scene!, this.#camera!);
  }
  #setupCamera() {
    const camera = new THREE.PerspectiveCamera(40, this.#width / this.#height, 0.01, 10);
    camera.position.z = 1;

    this.#camera = camera;
  }
  //for debug purpose
  // #setupOrbitControl() {
  //   const controls = new OrbitControls(this.#camera!, this.#canvas);
  //   controls.target.set(0, 0, 0);
  //   controls.zoom0 = 0;
  //   controls.update();
  // }
  #setupLight() {
    const color = 0xffffff;
    const light = new THREE.DirectionalLight(color, 2);
    light.position.set(10, 5, 20);
    light.target.position.set(0, 0, -5);
    this.#scene?.add(light);
    this.#scene?.add(light.target);
    //bottom light
    const bottomLight = new THREE.DirectionalLight(color, 0.4);
    bottomLight.position.set(-10, -5, 20);
    bottomLight.target.position.set(0, 0, 0);
    this.#scene?.add(bottomLight);
    this.#scene?.add(bottomLight.target);
  }
  async #initScenes() {
    // init
    this.#setupCamera();
    this.#scene = new THREE.Scene();
    this.#renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this.#canvas, alpha: true });
    this.#renderer.setSize(this.#width, this.#height);
    this.#renderer.setAnimationLoop(this.#animate.bind(this));
    // to make background transparent
    this.#scene.background = null;
    // this.#setupOrbitControl();
    this.#setupLight();
    await this.#initShapes();
    this.#addShapesToScenes();
    this.#setPositions();
  }
  #addShapesToScenes() {
    this.#scene!.add(this.#shapes.core!);
    this.#scene?.add(this.#shapes.earthOrbit!);
    this.#scene?.add(this.#shapes.jupiterOrbit!);
  }
  async #initShapes() {
    const geometry = new THREE.SphereGeometry(this.sphereRadius, 16, 16);
    // const material = new THREE.MeshNormalMaterial();
    // const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    // const material = new THREE.MeshLambertMaterial({ color: 0xeeeeff, flatShading: true });
    const mat = new THREE.MeshPhysicalMaterial({
      map: null,
      color: 0xb4f2ff,
      metalness: 0,
      roughness: 0,
      opacity: 0.3,
      side: THREE.FrontSide,
      transparent: true,
      envMapIntensity: 7,
      premultipliedAlpha: true,
      reflectivity: 2.15,
      flatShading: true,
      // shininess: 15,
    });
    const mesh = new THREE.Mesh(geometry, mat);
    this.#shapes.core = mesh;
    await this.#loadExternalAsset();
  }
  #initEarth(gltf: GLTF) {
    const model = gltf.scene;

    const center = new THREE.Vector3();
    const box = new Box3().setFromObject(model);
    box.getCenter(center);
    model.position.sub(center);
    //because earth model has wrong x center we have to create a pivot with correct center
    const pivot = new THREE.Group();
    pivot.add(model);
    this.#shapes.earth = pivot;
    //now we add earth orbit
    const orbit = new THREE.Group();
    this.#shapes.earthOrbit = orbit
    orbit.add(pivot);
  }
  #calcModelScale(model: THREE.Group<THREE.Object3DEventMap>, targetSize: number) {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = targetSize / maxDim;
    return scale
  }
  #initJupiter(gltf: GLTF) {
    const model = gltf.scene;

    //
    const center = new THREE.Vector3();
    const box = new Box3().setFromObject(model);
    box.getCenter(center);
    model.position.sub(center);
    //because jupiter model has wrong x center we have to create a pivot with correct center
    const pivot = new THREE.Group();
    pivot.add(model);
    this.#shapes.jupiter = pivot;
    //now we add earth orbit
    const orbit = new THREE.Group();
    this.#shapes.jupiterOrbit = orbit
    orbit.add(pivot);
  }
  async #loadExternalAsset() {
    const loader = new GLTFLoader();
    const earthGLTF = await loader.loadAsync(earthShapeURL)
    this.#initEarth(earthGLTF);

    //jupiter
    const jupiterGLTF = await loader.loadAsync(jupiterShapeURL);
    this.#initJupiter(jupiterGLTF);
    return;
  }
  #prevTime: number = 0;
  #animate(time: number) {
    const dt = time - this.#prevTime;
    const orbitTime = time;
    this.#shapes.core!.rotation.y = time / 10000;
    if (this.#shapes.earth) {
      const tilt = MathUtils.degToRad(-23.5);
      this.#shapes.earth.rotation.y = time / 400;
      this.#shapes.earth.rotation.x = tilt;
      //rotate orbit


      const orbitTilt = MathUtils.degToRad(330);
      this.#shapes.earthOrbit!.rotation.y = orbitTime / 1400
      this.#shapes.earthOrbit!.rotation.x = orbitTilt
      this.#shapes.earthOrbit!.rotation.z = MathUtils.degToRad(0)
    }
    if (this.#shapes.jupiter) {
      const jupiterTime = orbitTime - 1500;
      const tilt = MathUtils.degToRad(5);
      this.#shapes.jupiter.rotation.y = time / 600;
      this.#shapes.jupiter.rotation.x = tilt;
      //rotate orbit
      const orbitTilt = MathUtils.degToRad(30);
      this.#shapes.jupiterOrbit!.rotation.y = jupiterTime / 2400
      this.#shapes.jupiterOrbit!.rotation.x = orbitTilt
      this.#shapes.jupiterOrbit!.rotation.z = MathUtils.degToRad(0)
    }
    if (this.#shapes.jupiter && this.#shapes.earth) {
      const boxA = new THREE.Box3().setFromObject(this.#shapes.earth);
      const boxB = new THREE.Box3().setFromObject(this.#shapes.jupiter);
      if (boxA.intersectsBox(boxB)) {
        //on planet hit
      } else {
        //on planet not hit
      }
    }


    this.#renderer?.render(this.#scene!, this.#camera!);
    this.#prevTime = time;
  }
  #pixelsPerUnitAtZ() {
    //distance of an object from camera
    const zFromCamera = 1;
    const vFov = THREE.MathUtils.degToRad(this.#camera!.fov);
    const heightAtZ = 2 * Math.tan(vFov / 2) * zFromCamera; // world units
    return this.#renderer!.domElement.clientHeight / heightAtZ;
  }
  unitsToPixel(units: number) {
    const ppu = this.#pixelsPerUnitAtZ();
    return units * ppu;
  }
  pixelsToUnit(pixels: number) {
    const ppu = this.#pixelsPerUnitAtZ();
    return pixels / ppu;
  }
}
const myElementNotExists = !customElements.get('skills-background');
if (myElementNotExists) {
  window.customElements.define('skills-background', SkillsBackground);
}