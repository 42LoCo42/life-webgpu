import { defineConfig, type Plugin } from "vite";
import * as wgslender from "wgslender";

function wgslenderPlugin(): Plugin {
	let isProductionBuild = false;

	return {
		name: "wgslender",
		enforce: "pre",

		async configResolved(config) {
			isProductionBuild = config.command === "build" && config.isProduction;
			if (isProductionBuild) await wgslender.initialize();
		},

		transform(source, id) {
			if (!isProductionBuild || !id.split("?")[0]?.endsWith(".wgsl"))
				return null;

			const match = source.match(/^export default (".*")$/);
			if (!match) return;

			console.log(`Minifying WGSL shader ${id}`);

			const shader = JSON.parse(match[1]!);
			const minified = wgslender.minify(shader).code;

			return {
				code: `export default ${JSON.stringify(minified)}`,
			};
		},
	};
}

export default defineConfig({
	plugins: [wgslenderPlugin()],

	server: {
		watch: {
			ignored: ["**/.direnv/**", "**/result/**"],
		},
	},
});
