import * as THREE from "three";
import * as CANNON from "cannon-es";
import { createDice } from "./js/die";
import { createArena } from "./js/arena";
import { subscribe } from "./js/viewport";

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
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(20, aspect, 0.1, 300);
camera.position.set(0, 30, 20);
camera.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI * 0.3);
export let maxX;
subscribe((w, h) => {
	camera.aspect = w / h;
	camera.updateProjectionMatrix();
	maxX = (14 * camera.aspect) / 2;
});

const physicsWorld = new CANNON.World({
	gravity: new CANNON.Vec3(0, -50, 0),
	allowSleep: true,
});
physicsWorld.defaultContactMaterial.restitution = 0.3;

createArena(scene, physicsWorld);

const NUMBER_OF_DICE = 5;
const dice = new Array(NUMBER_OF_DICE);
for (let i = 0; i < NUMBER_OF_DICE; i++) {
	dice[i] = createDice(scene, physicsWorld);
}
const ids = {};
for (let i = 0; i < NUMBER_OF_DICE; i++) {
	const mesh = dice[i].mesh;
	ids[mesh.uuid] = i;
	for (let child of mesh.children) {
		ids[child.uuid] = i;
	}
}

function throwDice() {
	dice.forEach((die, i) => die.throw(new CANNON.Vec3(maxX - 2, 3 + 2 * i, 4)));
}
throwDice();

function findHoveredDie(e) {
	const mouse = new THREE.Vector2(
		(e.clientX / renderer.domElement.clientWidth) * 2 - 1,
		-(e.clientY / renderer.domElement.clientHeight) * 2 + 1
	);

	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(mouse, camera);

	var intersects = raycaster.intersectObjects(dice.map(({ mesh }) => mesh));
	return dice[ids[intersects[0]?.object.uuid]];
}

document.addEventListener("mousedown", function (e) {
	e.preventDefault();
	findHoveredDie(e)?.onClick();
});

function animate() {
	physicsWorld.fixedStep();

	for (let die of dice) {
		die.mesh.position.copy(die.body.position);
		die.mesh.quaternion.copy(die.body.quaternion);
	}

	const results = dice
		.filter((die) => die.sleeping)
		.map((die) => die.getTopFace())
		.filter(Boolean);
	document.getElementById("results").innerHTML = results.join(" ");

	// redraw the scene
	renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

document.getElementById("relaunch").addEventListener("click", () => {
	throwDice();
});

let currentDie = null;
document.body.addEventListener("mousemove", (e) => {
	const die = findHoveredDie(e);
	if (die == currentDie) {
		return;
	}
	currentDie?.onLeave();
	die?.onEnter();
	currentDie = die;
	document.body.style.cursor = die ? "pointer" : "default";
});
