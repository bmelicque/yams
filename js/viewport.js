const menu = document.getElementById("menu");

const subscribers = [];

export function subscribe(cb) {
	subscribers.push(cb);
	let height = innerHeight - menu.getBoundingClientRect().height;
	let width = innerWidth;
	cb(width, height);
}

function broadcast() {
	let height = innerHeight - menu.getBoundingClientRect().height;
	let width = innerWidth;

	for (let subscriber of subscribers) {
		subscriber(width, height);
	}
}

window.addEventListener("resize", () => {
	broadcast();
});
