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

function findShortStraight(results) {
	if (results.indexOf(3) === -1) return false;
	if (results.indexOf(4) === -1) return false;

	const has1 = results.indexOf(1) !== -1;
	const has2 = results.indexOf(2) !== -1;
	const has5 = results.indexOf(5) !== -1;
	const has6 = results.indexOf(6) !== -1;
	return (has1 && has2) || (has2 && has5) || (has5 && has6);
}
function findLongStraight(results) {
	if (results.indexOf(2) === -1) return false;
	if (results.indexOf(3) === -1) return false;
	if (results.indexOf(4) === -1) return false;
	if (results.indexOf(5) === -1) return false;

	return results.indexOf(1) === -1 || results.indexOf(6) === -1;
}

function sum(results) {
	return results.reduce((acc, el) => acc + el, 0);
}

export function handleResults() {
	const results = Die.stable.map((die) => die.getTopFace()).filter(Boolean);

	for (let i = 1; i <= 6; i++) {
		const element = document.querySelector(`[data-id="${i}"]`);
		const count = results.filter((el) => el === i).length;
		element.innerHTML = count * i + "";
	}

	document.querySelector('[data-id="toak"]').innerHTML = findTOAK(results) ? sum(results) : 0;
	document.querySelector('[data-id="foak"]').innerHTML = findFOAK(results) ? sum(results) : 0;
	document.querySelector('[data-id="full"]').innerHTML = findFullHouse(results) ? "25" : "0";
	document.querySelector('[data-id="short-straight"]').innerHTML = findShortStraight(results) ? "30" : "0";
	document.querySelector('[data-id="long-straight"]').innerHTML = findLongStraight(results) ? "40" : "0";
	document.querySelector('[data-id="yams"]').innerHTML = findYams(results) ? "50" : "0";
	document.querySelector('[data-id="chance"]').innerHTML = sum(results);
}
