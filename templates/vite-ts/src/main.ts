import { WebflowRouter } from "webflow-router"; // Assuming this is your actual package name
import type { RouterOptions } from "webflow-router";
import { generatedRoutes } from "./generated-wf-routes";

const routerOptions: RouterOptions = {
  pageScriptBasePath: "/src/app-pages",
};

const router = new WebflowRouter(generatedRoutes, routerOptions);

router.start();
