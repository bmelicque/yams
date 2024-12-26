import * as THREE from "three";
import * as CANNON from "cannon-es";
import { handleResults } from "./results";

const PARAMS = {
	SEGMENTS: 50,
	EDGE_RADIUS: 0.09,
	NOTCH_RADIUS: 0.12,
	NOTCH_DEPTH: 0.1,
};

function createDieGeometry() {
	let boxGeometry = new THREE.BoxGeometry(1, 1, 1, PARAMS.SEGMENTS, PARAMS.SEGMENTS, PARAMS.SEGMENTS);
	roundEdges(boxGeometry);
	etchDots(boxGeometry);
	return boxGeometry;
}

/**
 * @param {THREE.BoxGeometry} box
 */
function roundEdges(box) {
	const positionAttribute = box.attributes.position;

	for (let i = 0; i < positionAttribute.count; i++) {
		let position = new THREE.Vector3().fromBufferAttribute(positionAttribute, i);
		const subCubeHalfSize = 0.5 - PARAMS.EDGE_RADIUS;
		const subCube = new THREE.Vector3(
			Math.sign(position.x),
			Math.sign(position.y),
			Math.sign(position.z)
		).multiplyScalar(subCubeHalfSize);
		const addition = new THREE.Vector3().subVectors(position, subCube);
		if (
			Math.abs(position.x) > subCubeHalfSize &&
			Math.abs(position.y) > subCubeHalfSize &&
			Math.abs(position.z) > subCubeHalfSize
		) {
			addition.normalize().multiplyScalar(PARAMS.EDGE_RADIUS);
			position = subCube.add(addition);
		} else if (Math.abs(position.x) > subCubeHalfSize && Math.abs(position.y) > subCubeHalfSize) {
			addition.z = 0;
			addition.normalize().multiplyScalar(PARAMS.EDGE_RADIUS);
			position.x = subCube.x + addition.x;
			position.y = subCube.y + addition.y;
		} else if (Math.abs(position.x) > subCubeHalfSize && Math.abs(position.z) > subCubeHalfSize) {
			addition.y = 0;
			addition.normalize().multiplyScalar(PARAMS.EDGE_RADIUS);
			position.x = subCube.x + addition.x;
			position.z = subCube.z + addition.z;
		} else if (Math.abs(position.y) > subCubeHalfSize && Math.abs(position.z) > subCubeHalfSize) {
			addition.x = 0;
			addition.normalize().multiplyScalar(PARAMS.EDGE_RADIUS);
			position.y = subCube.y + addition.y;
			position.z = subCube.z + addition.z;
		}

		positionAttribute.setXYZ(i, position.x, position.y, position.z);
	}
}

/**
 * @param {THREE.BoxGeometry} box
 */
function etchDots(box) {
	const positionAttribute = box.attributes.position;

	const notchWave = (v) => {
		v *= 1 / PARAMS.NOTCH_RADIUS;
		v = Math.PI * Math.max(-1, Math.min(1, v));
		return PARAMS.NOTCH_DEPTH * (Math.cos(v) + 1);
	};
	const notch = (pos0, pos1) => notchWave(pos0) * notchWave(pos1);
	const offset = 0.23;

	for (let i = 0; i < positionAttribute.count; i++) {
		let position = new THREE.Vector3().fromBufferAttribute(positionAttribute, i);

		if (position.y === 0.5) {
			position.y -= notch(position.x, position.z);
		} else if (position.x === 0.5) {
			position.x -= notch(position.y + offset, position.z + offset);
			position.x -= notch(position.y - offset, position.z - offset);
		} else if (position.z === 0.5) {
			position.z -= notch(position.x - offset, position.y + offset);
			position.z -= notch(position.x, position.y);
			position.z -= notch(position.x + offset, position.y - offset);
		} else if (position.z === -0.5) {
			position.z += notch(position.x + offset, position.y + offset);
			position.z += notch(position.x + offset, position.y - offset);
			position.z += notch(position.x - offset, position.y + offset);
			position.z += notch(position.x - offset, position.y - offset);
		} else if (position.x === -0.5) {
			position.x += notch(position.y + offset, position.z + offset);
			position.x += notch(position.y + offset, position.z - offset);
			position.x += notch(position.y, position.z);
			position.x += notch(position.y - offset, position.z + offset);
			position.x += notch(position.y - offset, position.z - offset);
		} else if (position.y === -0.5) {
			position.y += notch(position.x + offset, position.z + offset);
			position.y += notch(position.x + offset, position.z);
			position.y += notch(position.x + offset, position.z - offset);
			position.y += notch(position.x - offset, position.z + offset);
			position.y += notch(position.x - offset, position.z);
			position.y += notch(position.x - offset, position.z - offset);
		}

		positionAttribute.setXYZ(i, position.x, position.y, position.z);
	}
}

/**
 * @param {THREE.Group} mesh
 */
function fillDots(mesh) {
	const baseGeometry = new THREE.PlaneGeometry(1 - 2 * PARAMS.EDGE_RADIUS, 1 - 2 * PARAMS.EDGE_RADIUS);
	const fillingMaterial = new THREE.MeshStandardMaterial({ color: 0x000000, side: THREE.DoubleSide });

	const offset = 0.48;
	mesh.add(new THREE.Mesh(baseGeometry.clone().translate(0, 0, offset), fillingMaterial));
	mesh.add(new THREE.Mesh(baseGeometry.clone().translate(0, 0, -offset), fillingMaterial));
	mesh.add(
		new THREE.Mesh(
			baseGeometry
				.clone()
				.rotateX(0.5 * Math.PI)
				.translate(0, -offset, 0),
			fillingMaterial
		)
	);
	mesh.add(
		new THREE.Mesh(
			baseGeometry
				.clone()
				.rotateX(0.5 * Math.PI)
				.translate(0, offset, 0),
			fillingMaterial
		)
	);
	mesh.add(
		new THREE.Mesh(
			baseGeometry
				.clone()
				.rotateY(0.5 * Math.PI)
				.translate(-offset, 0, 0),
			fillingMaterial
		)
	);
	mesh.add(
		new THREE.Mesh(
			baseGeometry
				.clone()
				.rotateY(0.5 * Math.PI)
				.translate(offset, 0, 0),
			fillingMaterial
		)
	);
}

export function createDiceMesh() {
	const diceMesh = new THREE.Group();

	const outerMesh = new THREE.Mesh(createDieGeometry(), new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
	outerMesh.castShadow = true;
	diceMesh.add(outerMesh);

	fillDots(diceMesh);
	return diceMesh;
}

export function createDice(scene, physicsWorld) {
	const mesh = createDiceMesh();
	scene.add(mesh);

	const body = new CANNON.Body({
		mass: 1,
		shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
		sleepTimeLimit: 0.1,
	});
	physicsWorld.addBody(body);

	return new Die(mesh, body);
}

export class Die {
	static hoveredColor = "orange";
	static lockedColor = "orange";
	static defaultColor = "black";
	static dice = [];
	static stable = [];

	constructor(mesh, body) {
		this.mesh = mesh;
		this.body = body;
		this.locked = false;
		this.sleeping = false;

		this.body.addEventListener("sleep", () => {
			const face = this.getTopFace();
			this.body.allowSleep = face == null;
			this.sleeping = face != null;
			Die.stable.push(this);
			if (Die.stable.length === 5) handleResults();

			// TODO: rethrow if face is null
		});
	}

	onClick() {
		this.locked = !this.locked;
		this.changeDotColor(this.locked ? Die.lockedColor : Die.defaultColor);
	}

	onEnter() {
		this.changeDotColor(Die.hoveredColor);
	}

	onLeave() {
		this.changeDotColor(this.locked ? Die.lockedColor : Die.defaultColor);
	}

	changeDotColor(color) {
		for (let filler of this.mesh.children.slice(1)) {
			filler.material = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide });
		}
	}

	throw(position) {
		if (this.locked) {
			return;
		}
		Die.stable = Die.stable.filter((el) => el !== this);
		this.body.allowSleep = true;

		// reset from previous throw
		this.body.velocity.setZero();
		this.body.angularVelocity.setZero();

		// reset position
		this.body.position = position;
		this.mesh.position.copy(this.body.position);

		// set initial rotation
		this.mesh.rotation.set(2 * Math.PI * Math.random(), 0, 2 * Math.PI * Math.random());
		this.body.quaternion.copy(this.mesh.quaternion);

		const xImpulse = -(5 + 8 * Math.random());
		const zImpulse = -(5 + 8 * Math.random());
		this.body.applyImpulse(new CANNON.Vec3(xImpulse, 0, zImpulse));
	}

	unlock() {
		this.locked = false;
		this.changeDotColor(Die.defaultColor);
	}

	getTopFace() {
		const euler = new CANNON.Vec3();
		this.body.quaternion.toEuler(euler);

		const eps = 0.1;
		let isZero = (angle) => Math.abs(angle) < eps;
		let isHalfPi = (angle) => Math.abs(angle - 0.5 * Math.PI) < eps;
		let isMinusHalfPi = (angle) => Math.abs(0.5 * Math.PI + angle) < eps;
		let isPiOrMinusPi = (angle) => Math.abs(Math.PI - angle) < eps || Math.abs(Math.PI + angle) < eps;

		switch (true) {
			case isZero(euler.z) && isZero(euler.x):
				return 1;
			case isZero(euler.z) && isHalfPi(euler.x):
				return 4;
			case isZero(euler.z) && isMinusHalfPi(euler.x):
				return 3;
			case isZero(euler.z) && isPiOrMinusPi(euler.x):
				return 6;
			case isHalfPi(euler.z):
				return 2;
			case isMinusHalfPi(euler.z):
				return 5;
			default:
				return undefined;
		}
	}
}
