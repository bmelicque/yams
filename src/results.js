import { Die } from "./die";

export function findYams(results) {
	const exists = results.filter((el) => el === results[0]).length === 5;
	return exists ? results[0] : null;
}

// four of a kind
export function findFOAK(results) {
	if (results.filter((el) => el === results[0]).length === 4) return results[0];
	if (results.filter((el) => el === results[1]).length === 4) return results[1];
}

// three of a kind
export function findTOAK(results) {
	if (results.filter((el) => el === results[0]).length === 3) return results[0];
	if (results.filter((el) => el === results[1]).length === 3) return results[1];
	if (results.filter((el) => el === results[2]).length === 3) return results[2];
}

export function findFullHouse(results) {
	const three = findTOAK(results);
	if (!three) return false;
	const others = results.filter((el) => el !== three);
	return others[0] === others[1];
}

export function handleResults() {
	const results = Die.stable.map((die) => die.getTopFace()).filter(Boolean);

	if (findYams(results)) console.log("Yam's");
	else if (findFOAK(results)) console.log("carré");
	else if (findTOAK(results)) console.log("brelan");
}
