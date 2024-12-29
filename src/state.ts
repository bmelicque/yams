import { Die, throwDice } from "./die";
import { startAnimation } from "./main";
import { isCompleted, refreshScoreTable } from "./score";

export enum AppState {
	Loading = "loader",
	ScorePage = "score",
	Playing = "playing",
}

let appState = AppState.Loading;
let startedAnimation = false;
let throwCount = 1;
let saved = false;

export function updateAppState(newState: AppState) {
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
export function getAppState() {
	return appState;
}
export function getThrowCount() {
	return throwCount;
}
function resetThrowCount() {
	throwCount = 0;
	getButtonById("throw-again").disabled = false;
	Die.unlockAll();
}
export function saveScore() {
	saved = true;
	getButtonById("cancel").disabled = true;
	if (!isCompleted()) getButtonById("throw").disabled = false;
}

document.getElementById("throw").addEventListener("click", () => {
	if (!saved) return;
	saved = false;
	refreshScoreTable();
	getButtonById("throw").disabled = true;
	getButtonById("cancel").disabled = false;
	updateAppState(AppState.Playing);
	resetThrowCount();
	throwCount++;
	throwDice();
});
document.getElementById("throw-again").addEventListener("click", (e) => {
	if (throwCount === 2) {
		getButtonById("throw-again").disabled = true;
	}
	throwCount++;
	throwDice();
	document.querySelector("#remaining span").innerHTML = 3 - throwCount + "";
});
document.getElementById("to-score").addEventListener("click", () => {
	updateAppState(AppState.ScorePage);
});

document.getElementById("start").addEventListener("click", () => {
	updateAppState(AppState.Playing);
	if (!startedAnimation) {
		startedAnimation = true;
		startAnimation();
	}
	throwDice();
});

document.getElementById("cancel").addEventListener("click", () => {
	if (saved) return;
	updateAppState(AppState.Playing);
});

document.getElementById("start").style.visibility = "visible";

function getButtonById(id: string): HTMLButtonElement {
	return document.getElementById(id) as HTMLButtonElement;
}
