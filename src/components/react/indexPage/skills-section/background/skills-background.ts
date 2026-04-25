import CSS from './style.css?inline';
import { renderHTML } from './render';
import * as THREE from 'three';
import { Box3, MathUtils, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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
    this.#initThreeShape();
  }
  #setupCamera() {
    const camera = new THREE.PerspectiveCamera(70, this.#width / this.#height, 0.01, 10);
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
  #initThreeShape() {
    // init
    this.#setupCamera();
    this.#initShapes();
    this.#scene = new THREE.Scene();

    this.#scene.add(this.#shapes.core!);
    this.#renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this.#canvas, alpha: true });
    this.#renderer.setSize(this.#width, this.#height);
    this.#renderer.setAnimationLoop(this.#animate.bind(this));
    // to make background transparent
    this.#scene.background = null;
    // this.#setupOrbitControl();
    this.#setupLight();
  }
  #initShapes() {
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
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
    this.#loadExternalAsset();
  }
  #loadExternalAsset() {
    const loader = new GLTFLoader();

    loader.load(earthShapeURL, (gltf) => {
      const model = gltf.scene;
      model.scale.setScalar(0.009);
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
      orbit.position.copy(this.#shapes.core!.position);
      pivot.position.set(0.8, 0, 0)
      orbit.add(pivot);
      this.#scene?.add(orbit);
    }, undefined, (err) => console.error(err));
    //jupiter
    loader.load(jupiterShapeURL, (gltf) => {
      const model = gltf.scene;
      model.scale.setScalar(0.015);
      const center = new THREE.Vector3();
      const box = new Box3().setFromObject(model);
      box.getCenter(center);
      model.position.sub(center);
      //because earth model has wrong x center we have to create a pivot with correct center
      const pivot = new THREE.Group();
      pivot.add(model);
      this.#shapes.jupiter = pivot;
      //now we add earth orbit
      const orbit = new THREE.Group();
      this.#shapes.jupiterOrbit = orbit
      orbit.position.copy(this.#shapes.core!.position);
      pivot.position.set(0.5, 0, 0)
      orbit.add(pivot);
      this.#scene?.add(orbit);
    }, undefined, (err) => console.error(err));
  }
  #prevTime: number = 0;
  #earthReverse = false;
  #animate(time: number) {
    const dt = time - this.#prevTime;
    const orbitTime = time;
    this.#shapes.core!.rotation.y = time / 10000;
    if (this.#shapes.earth) {
      const tilt = MathUtils.degToRad(-23.5);
      this.#shapes.earth.rotation.y = time / 400;
      this.#shapes.earth.rotation.x = tilt;
      //rotate orbit
      console.log("rev", this.#earthReverse);

      const orbitTilt = MathUtils.degToRad(330);
      this.#shapes.earthOrbit!.rotation.y = orbitTime / 1000
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
      this.#shapes.jupiterOrbit!.rotation.y = jupiterTime / 2000
      this.#shapes.jupiterOrbit!.rotation.x = orbitTilt
      this.#shapes.jupiterOrbit!.rotation.z = MathUtils.degToRad(0)
    }
    if (this.#shapes.jupiter && this.#shapes.earth) {
      const boxA = new THREE.Box3().setFromObject(this.#shapes.earth);
      const boxB = new THREE.Box3().setFromObject(this.#shapes.jupiter);
      if (boxA.intersectsBox(boxB)) {
        this.#earthReverse = true;
      } else {
        this.#earthReverse = false;
      }
    }


    this.#renderer?.render(this.#scene!, this.#camera!);
    this.#prevTime = time;
  }
}
const myElementNotExists = !customElements.get('skills-background');
if (myElementNotExists) {
  window.customElements.define('skills-background', SkillsBackground);
}