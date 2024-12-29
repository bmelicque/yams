import { Die } from "./die";
import { saveScore } from "./state";

enum UpperEntry {
	One = "one",
	Two = "two",
	Three = "three",
	Four = "four",
	Five = "five",
	Six = "six",
}

enum LowerEntry {
	ThreeOfAKind = "three-of-a-kind",
	FourOfAKind = "four-of-a-kind",
	FullHouse = "full-house",
	SmallStraight = "small-straight",
	BigStraight = "big-straight",
	Yams = "yams",
	Chance = "chance",
}

const Entry = { ...UpperEntry, ...LowerEntry };
type Entry = UpperEntry | LowerEntry;

class ScoreSheet {
	entries: Partial<Record<Entry, number>> = {};

	get upperSectionSubTotal() {
		return Object.values(UpperEntry).reduce((acc, curr) => acc + (this.entries[curr] ?? 0), 0);
	}

	get upperSectionBonus() {
		return this.upperSectionSubTotal >= 63 ? 35 : 0;
	}

	get upperSection() {
		return this.upperSectionSubTotal + this.upperSectionBonus;
	}

	get lowerSection() {
		return Object.values(LowerEntry).reduce((acc, curr) => acc + (this.entries[curr] ?? 0), 0);
	}

	get total() {
		return this.upperSection + this.lowerSection;
	}

	add(entry: Entry, score: number) {
		this.entries[entry] = score;
	}
}
const userSheet = new ScoreSheet();
export function isCompleted() {
	for (let entry of Object.values(Entry)) {
		if (userSheet.entries[entry] == null) return false;
	}
	return true;
}

const EntryTexts: Record<Entry, string> = {
	[UpperEntry.One]: "Total des 1",
	[UpperEntry.Two]: "Total des 2",
	[UpperEntry.Three]: "Total des 3",
	[UpperEntry.Four]: "Total des 4",
	[UpperEntry.Five]: "Total des 5",
	[UpperEntry.Six]: "Total des 6",

	[Entry.ThreeOfAKind]: "Brelan",
	[Entry.FourOfAKind]: "Carré",
	[Entry.FullHouse]: "Full House",
	[Entry.SmallStraight]: "Petite Suite",
	[Entry.BigStraight]: "Grande Suite",
	[Entry.Yams]: "Yam's",
	[Entry.Chance]: "Chance",
};

function saveEntry(entry: Entry, value: number) {
	userSheet.entries[entry] = value;
	const line = document.querySelector(`[data-id="${entry}"]`);
	(line.querySelector(".saved-score") as HTMLDivElement).innerText = value + "";
	document.querySelectorAll(".score-line").forEach((line: HTMLDivElement) => {
		line.querySelector("button").disabled = true;
	});
	saveScore();
}

export function refreshScoreTable() {
	const table = document.querySelector("#score .table");
	table.innerHTML = "";

	const sheet = generateScoreSheet(Die.results);

	const template = document.getElementById("score-line") as HTMLTemplateElement;
	const writeLine = (entry: Entry | undefined, label: string, saved: string, current: string) => {
		const line = template.content.cloneNode(true) as HTMLDivElement;
		(line.querySelector(".score-line") as HTMLDivElement).dataset.id = entry;
		const labelElement = line.querySelector(".label") as HTMLDivElement;
		labelElement.innerText = label;
		const savedElement = line.querySelector(".saved-score") as HTMLDivElement;
		savedElement.innerText = saved;

		const currentElement = line.querySelector(".current-score") as HTMLDivElement;
		if (entry) {
			if (userSheet.entries[entry] == null) {
				currentElement.innerText = current;
			}

			if (current != "")
				line.querySelector("button").addEventListener("click", () => saveEntry(entry, sheet.entries[entry]));
		}
		const button = line.querySelector("button");
		button.disabled = currentElement.innerText === "";
		button.style.visibility = currentElement.innerText === "" ? "hidden" : "visible";
		table.append(line);
	};

	Object.values(UpperEntry).forEach((entry) => {
		const saved = (userSheet.entries[entry] ?? "") + "";
		const current = (sheet.entries[entry] ?? "") + "";
		writeLine(entry, EntryTexts[entry], saved, current);
	});

	writeLine(null, "Bonus si > 62", userSheet.upperSectionBonus + "", "");
	writeLine(null, "Section supérieure", userSheet.upperSection + "", "");
	writeLine(null, "", "", "");

	Object.values(LowerEntry).forEach((entry) => {
		const saved = (userSheet.entries[entry] ?? "") + "";
		const current = (sheet.entries[entry] ?? "") + "";
		writeLine(entry, EntryTexts[entry], saved, current);
	});
	writeLine(null, "Section inférieure", userSheet.lowerSection + "", "");
	writeLine(null, "", "", "");

	writeLine(null, "Total", userSheet.total + "", "");
}

function findYams(results: number[]) {
	const exists = results.filter((el) => el === results[0]).length === 5;
	return exists ? results[0] : null;
}
// four of a kind
function findFOAK(results: number[]) {
	if (results.filter((el) => el === results[0]).length === 4) return results[0];
	if (results.filter((el) => el === results[1]).length === 4) return results[1];
}
// three of a kind
function findTOAK(results: number[]) {
	if (results.filter((el) => el === results[0]).length === 3) return results[0];
	if (results.filter((el) => el === results[1]).length === 3) return results[1];
	if (results.filter((el) => el === results[2]).length === 3) return results[2];
}
function findFullHouse(results: number[]) {
	const three = findTOAK(results);
	if (!three) return false;
	const others = results.filter((el) => el !== three);
	return others[0] === others[1];
}
function findSmallStraight(results: number[]) {
	if (results.indexOf(3) === -1) return false;
	if (results.indexOf(4) === -1) return false;

	const has1 = results.indexOf(1) !== -1;
	const has2 = results.indexOf(2) !== -1;
	const has5 = results.indexOf(5) !== -1;
	const has6 = results.indexOf(6) !== -1;
	return (has1 && has2) || (has2 && has5) || (has5 && has6);
}
function findBigStraight(results: number[]) {
	if (results.indexOf(2) === -1) return false;
	if (results.indexOf(3) === -1) return false;
	if (results.indexOf(4) === -1) return false;
	if (results.indexOf(5) === -1) return false;

	return results.indexOf(1) !== -1 || results.indexOf(6) !== -1;
}
function sum(results: number[]) {
	return results.reduce((acc, el) => acc + el, 0);
}

function generateScoreSheet(results: number[]): ScoreSheet {
	const sheet = new ScoreSheet();
	sheet.entries = {
		[Entry.One]: results.filter((el) => el === 1).length,
		[Entry.Two]: results.filter((el) => el === 2).length * 2,
		[Entry.Three]: results.filter((el) => el === 3).length * 3,
		[Entry.Four]: results.filter((el) => el === 4).length * 4,
		[Entry.Five]: results.filter((el) => el === 5).length * 5,
		[Entry.Six]: results.filter((el) => el === 6).length * 6,

		[Entry.ThreeOfAKind]: findTOAK(results) ? sum(results) : 0,
		[Entry.FourOfAKind]: findFOAK(results) ? sum(results) : 0,
		[Entry.FullHouse]: findFullHouse(results) ? 25 : 0,
		[Entry.SmallStraight]: findSmallStraight(results) ? 30 : 0,
		[Entry.BigStraight]: findBigStraight(results) ? 40 : 0,
		[Entry.Yams]: findYams(results) ? 50 : 0,
		[Entry.Chance]: sum(results),
	};
	return sheet;
}
