import * as THREE from "three";
import * as CANNON from "cannon-es";
import { createDice, Die } from "./die";
import { createArena } from "./arena";
import { subscribe } from "./viewport";
import { AppState, getAppState } from "./state";

const scene = new THREE.Scene();

function createLighting() {
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
	scene.add(ambientLight);
	const topLight = new THREE.DirectionalLight(0xffffff, 4);
	topLight.position.set(10, 20, 0);
	topLight.castShadow = true;
	topLight.shadow.mapSize.width = 2048;
	topLight.shadow.mapSize.height = 2048;
	topLight.shadow.camera.near = 0;
	topLight.shadow.camera.far = 400;
	topLight.shadow.camera.left = -10;
	topLight.shadow.camera.right = 10;
	topLight.shadow.camera.bottom = -10;
	topLight.shadow.camera.top = 10;
	scene.add(topLight);
}
createLighting();

const canvas = document.getElementById("canvas");
const menu = document.getElementById("menu");
const height = innerHeight - menu.getBoundingClientRect().height;
const width = innerWidth;
const aspect = width / height;

const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.shadowMap.enabled = true;
subscribe((w, h) => renderer.setSize(w, h));
// document.body.appendChild(renderer.domElement);

export const CAMERA = {
	/** degrees */
	fov: 20,
	/** radians */
	orientation: Math.PI * 0.3,
	position: {
		x: 0,
		y: 30,
		z: 20,
	},

	/** angle between horizontal plane and top of camera */
	get topAngle() {
		return this.orientation - (this.fov * Math.PI) / 360;
	},

	/** angle between horizontal plane and bottom of camera */
	get bottomAngle() {
		return this.orientation + (this.fov * Math.PI) / 360;
	},
};
const camera = new THREE.PerspectiveCamera(CAMERA.fov, aspect, 5, 50);
camera.position.set(0, 30, 20);
/** radians */
camera.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), CAMERA.orientation);

const physicsWorld = new CANNON.World({
	gravity: new CANNON.Vec3(0, -50, 0),
	allowSleep: true,
});
physicsWorld.defaultContactMaterial.restitution = 0.3;

createArena(scene, physicsWorld);

const NUMBER_OF_DICE = 5;
Die.dice = new Array(NUMBER_OF_DICE);
for (let i = 0; i < NUMBER_OF_DICE; i++) {
	Die.dice[i] = createDice(scene, physicsWorld);
}
const ids = {};
for (let i = 0; i < NUMBER_OF_DICE; i++) {
	const mesh = Die.dice[i].mesh;
	ids[mesh.uuid] = i;
	for (let child of mesh.children) {
		ids[child.uuid] = i;
	}
}

function findHoveredDie(e) {
	const mouse = new THREE.Vector2(
		(e.clientX / renderer.domElement.clientWidth) * 2 - 1,
		-(e.clientY / renderer.domElement.clientHeight) * 2 + 1
	);

	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(mouse, camera);

	var intersects = raycaster.intersectObjects(Die.dice.map(({ mesh }) => mesh));
	return Die.dice[ids[intersects[0]?.object.uuid]];
}

let currentDie = null;
document.body.addEventListener("mousemove", (e) => {
	if (getAppState() !== AppState.Playing) return;
	const die = findHoveredDie(e);
	if (die == currentDie) {
		return;
	}
	currentDie?.onLeave();
	die?.onEnter();
	currentDie = die;
	document.body.style.cursor = die ? "pointer" : "default";
});

document.addEventListener("mousedown", function (e) {
	if (getAppState() !== AppState.Playing) return;
	e.preventDefault();
	findHoveredDie(e)?.onClick();
});

function animate() {
	physicsWorld.fixedStep();

	for (let die of Die.dice) {
		die.mesh.position.copy(die.body.position);
		die.mesh.quaternion.copy(die.body.quaternion);
	}

	// redraw the scene
	renderer.render(scene, camera);
}
export function startAnimation() {
	renderer.setAnimationLoop(animate);
}

import("./state.js");
