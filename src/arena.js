import * as THREE from "three";
import * as CANNON from "cannon-es";
import { maxX } from "./main";
import { subscribe } from "./viewport";

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
	const back = createWall(physicsWorld);
	back.position.z = -10;

	const front = createWall(physicsWorld);
	front.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
	front.position.z = 5;

	const left = createWall(physicsWorld);
	left.position.x = -maxX;
	subscribe(() => (left.position.x = -maxX));
	left.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);

	const right = createWall(physicsWorld);
	right.position.x = maxX;
	subscribe(() => (right.position.x = maxX));
	right.quaternion.setFromAxisAngle(new THREE.Vector3(0, -1, 0), Math.PI / 2);
}

export function createArena(scene, physicsWorld) {
	createFloor(scene, physicsWorld);
	createWalls(physicsWorld);
}
