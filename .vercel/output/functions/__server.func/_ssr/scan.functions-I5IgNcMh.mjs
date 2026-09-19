import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/scan.functions-I5IgNcMh.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var runScan_createServerFn_handler = createServerRpc({
	id: "ba0addaea20e0d22d67637393a8ed148f84a4056172add5aded1fa69b1b23c1f",
	name: "runScan",
	filename: "src/lib/scanner/scan.functions.ts"
}, (opts) => runScan.__executeServer(opts));
var runScan = createServerFn({ method: "POST" }).validator((data) => {
	return { force: Boolean((data && typeof data === "object" ? data : {}).force) };
}).handler(runScan_createServerFn_handler, async ({ data }) => {
	const { executeScan } = await import("./run.server-BkfOaSst.mjs");
	return executeScan(data.force);
});
//#endregion
export { runScan_createServerFn_handler };
