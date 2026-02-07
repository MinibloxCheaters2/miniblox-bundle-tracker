// Downloads the latest Miniblox bundle from the website.
// Boring and I basically just pressed TAB to the AI completions because I don't care.

import init, { format } from "@fmt/biome-fmt";
import remap from "./remap.ts";
import { DiffResult, simpleGit } from "simple-git";

const startDate = new Date();

await init();

export default async function getBundle() {
	const page = await fetch("https://miniblox.io/");
	const text = await page.text();
	// <script type="module" crossorigin="" src="/assets/index-{randomCharacters}.js"></script>
	// example: <script type="module" crossorigin src="/assets/index-CqJGkZPn.js"></script>
	const regex = /\/assets\/index-([^\.]+).js/gm;
	const match = regex.exec(text);
	if (!match) {
		throw new Error("Couldn't find the latest bundle!");
	}
	const latestBundle = match[1];

	// Download the latest bundle.
	const bundle = await fetch(
		`https://miniblox.io/assets/index-${latestBundle}.js`,
	);
	const bundleText = await bundle.text();
	console.info("Downloaded bundle! Formatting... (may take a while)");
	console.time("Formatting");
	let formattedText = format(bundleText, "bundle.js");
	console.timeEnd("Formatting");
	console.info("Removing useless jsContent variable (bloats & breaks diff)...");
	const jsContentRegex = /const jsContent =[\t\s]*['"](?:[^\\]|\\.)+['"] *$/m;
	formattedText = formattedText.replace(jsContentRegex, "const ");
	console.info("Done!");
	return [formattedText, latestBundle];
}

function isBoring(summary: DiffResult): [true, string] | [false] {
	if (summary.deletions === summary.insertions) {
		return [true, "deletion count == insertion count"];
	}
	if (summary.files.length === 1 && summary.files[0].file === "bundle.js") {
		return [true, "only changed unmapped bundle"];
	}
	return [false];
}

if (import.meta.main) {
	const [bundle, id] = await getBundle();
	await Deno.writeTextFile(`bundle.js`, bundle);
	await Deno.writeTextFile(`bundle-remapped.js`, remap(bundle));
	console.info("Wrote bundle!");
	console.info(`Committing bundle to git...`);
	const sg = simpleGit();
	const diffSummary = await sg.diffSummary();
	const [boring, boringReason] = isBoring(diffSummary);

	if (boring)
		console.info(`Bundle is boring (${boringReason}).`);

	await sg
		.add("bundle.js")
		.add("bundle-remapped.js")
		.commit(
			`chore: update bundle to ${id}${boring ? " [boring]" : ""}${
				boringReason ? `\n(${boringReason})` : ""
			}`);

	// changes only to bundle-remapped.js shouldn't be tagged,
	// since they are usually i.e. maps being updated
	if (diffSummary.files.length > 1 && diffSummary.files.some(f => f.file === "bundle.js")) {
		const timePrefix = [
			startDate.getUTCMonth() + 1,
			startDate.getUTCDate(),
			startDate.getUTCFullYear(),
			"_",
			startDate.getUTCHours(),
			startDate.getUTCMinutes(),
		].join("-");
		sg.addTag(`${timePrefix}-${id}`);
		sg.pushTags();
	}
}
