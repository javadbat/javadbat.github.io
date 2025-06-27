import CSS from './style.css?inline';
import { renderHTML } from './render';
import * as THREE from 'three';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { Shapes } from './types';
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
    core: null
  }
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ delegatesFocus: false, mode: 'open' });
    const html = `<style>${CSS}</style>` + '\n' + renderHTML();
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
      flatShading:true,
      // shininess: 15,
    });
    const mesh = new THREE.Mesh(geometry, mat);
    this.#shapes.core = mesh
  }
  #animate(time: number) {
    // mesh.rotation.x = time / 2000;
    this.#shapes.core!.rotation.y = time / 10000;
    this.#renderer?.render(this.#scene!, this.#camera!);
  }
}
const myElementNotExists = !customElements.get('skills-background');
if (myElementNotExists) {
  window.customElements.define('skills-background', SkillsBackground);
}