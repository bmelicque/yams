import { Die, throwDice } from "./die";
import { startAnimation } from "./main";

export enum AppState {
	Loading = "loader",
	ScorePage = "score",
	Playing = "playing",
}

let appState = AppState.Loading;
let startedAnimation = false;
let throwCount = 1;

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
	const btn = document.getElementById("throw-again") as HTMLButtonElement;
	btn.disabled = false;
	Die.unlockAll();
}

document.getElementById("throw").addEventListener("click", () => {
	console.log("start");
	updateAppState(AppState.Playing);
	resetThrowCount();
	throwDice();
});
document.getElementById("throw-again").addEventListener("click", (e) => {
	if (throwCount === 2) {
		const btn = document.getElementById("throw-again") as HTMLButtonElement;
		btn.disabled = true;
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
	updateAppState(AppState.Playing);
});

document.getElementById("start").style.visibility = "visible";
