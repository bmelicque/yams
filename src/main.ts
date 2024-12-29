import * as THREE from "three";
import * as CANNON from "cannon-es";
import { createDice, Die } from "./die";
import { createArena } from "./arena";
import { subscribe } from "./viewport";

const scene = new THREE.Scene();

let throwCount = 1;

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

function throwDice() {
	const maxX = (7 * innerWidth) / innerHeight; // this is basically empiric for now
	Die.dice.forEach((die, i) => die.throw(new CANNON.Vec3(maxX - 2, 3 + 2 * i, 4)));
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
	if (appState !== AppState.Playing) return;
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
	if (appState !== AppState.Playing) return;
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

const AppState = {
	Loading: "loader",
	ScorePage: "score",
	Playing: "playing",
};

let appState = AppState.Loading;
function updateAppState(newState) {
	console.log("update ", newState);
	appState = newState;
	for (let state of Object.values(AppState)) {
		if (state === AppState.Playing) continue;
		const layer = document.getElementById(state);
		layer.style.opacity = state === newState ? "1" : "0";
		layer.style.zIndex = state === newState ? "10" : "-10";
	}
	const playingMenu = document.querySelector("#playing menu") as HTMLMenuElement;
	playingMenu.style.display = newState === AppState.Playing ? "flex" : "none";
}

updateAppState(AppState.ScorePage);

let startedAnimation = false;
document.getElementById("throw").addEventListener("click", () => {
	if (!startedAnimation) {
		startedAnimation = true;
		renderer.setAnimationLoop(animate);
	}
	updateAppState(AppState.Playing);
	throwDice();
});
document.getElementById("throw-again").addEventListener("click", (e) => {
	switch (throwCount) {
		case 0:
		case 1:
			throwCount++;
			break;
		case 2:
			const btn = document.getElementById("throw-again") as HTMLButtonElement;
			btn.disabled = true;
		case 3:
			for (let die of Die.dice) {
				die.unlock();
			}
			throwCount = 1;
			document.getElementById("throw-again").innerHTML = "RELANCER";
			break;
	}
	throwDice();
});
document.getElementById("to-score").addEventListener("click", () => {
	updateAppState(AppState.ScorePage);
});
