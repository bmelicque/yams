import * as THREE from "three";
import * as CANNON from "cannon-es";
import { CAMERA } from "./main";
import { subscribe } from "./viewport";

function getFrontZ() {
	return CAMERA.position.z - CAMERA.position.y / Math.tan(CAMERA.bottomAngle);
}

function getBackZ() {
	const diceSize = 1;
	return CAMERA.position.z - (CAMERA.position.y - diceSize) / Math.tan(CAMERA.topAngle);
}

function getBottomDistance() {
	return CAMERA.position.y / Math.sin(CAMERA.bottomAngle);
}

function getPerspectiveHeight(d) {
	return d * Math.sin((CAMERA.fov * Math.PI) / 360) * 2;
}

function getFrontWidth() {
	return (getPerspectiveHeight(getBottomDistance()) * innerWidth) / innerHeight;
}

const getX = () => (-getFrontWidth() * CAMERA.position.z) / (2 * (getFrontZ() - CAMERA.position.z)) - 1;
const getSideAngle = () => Math.atan(getFrontWidth() - getX() / getFrontZ());

function createFloor(scene, physicsWorld) {
	// 0x0f4d0f
	const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshStandardMaterial({ color: 0x888888 }));
	mesh.receiveShadow = true;
	mesh.quaternion.setFromAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI * 0.5);
	scene.add(mesh);

	const body = new CANNON.Body({
		type: CANNON.Body.STATIC,
		shape: new CANNON.Plane(),
	});
	body.position.copy(mesh.position);
	body.quaternion.copy(mesh.quaternion);
	physicsWorld.addBody(body);
}

function createWall(physicsWorld) {
	const body = new CANNON.Body({
		type: CANNON.Body.STATIC,
		shape: new CANNON.Plane(),
	});
	physicsWorld.addBody(body);
	return body;
}

// TODO: update wall positions to screen ratio
function createWalls(physicsWorld) {
	console.log(getX());
	const back = createWall(physicsWorld);
	back.position.z = getBackZ();

	const front = createWall(physicsWorld);
	front.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
	front.position.z = getFrontZ();

	const left = createWall(physicsWorld);
	left.position.x = -getX();
	subscribe(() => (left.position.x = -getX()));
	left.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI - getSideAngle());

	const right = createWall(physicsWorld);
	right.position.x = getX();
	subscribe(() => (right.position.x = getX()));
	right.quaternion.setFromAxisAngle(new THREE.Vector3(0, -1, 0), Math.PI - getSideAngle());
}

export function createArena(scene, physicsWorld) {
	createFloor(scene, physicsWorld);
	createWalls(physicsWorld);
}
