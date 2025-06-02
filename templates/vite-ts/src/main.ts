import { WebflowRouter } from "webflow-router";
import type { RouterOptions } from "webflow-router";
import { generatedRoutes } from "./generated-wf-routes";

const isProd = import.meta.env.PROD;

const routerOptions: RouterOptions = {
  pageScriptBasePath: isProd ? "/pages" : "/src/pages",
};

const router = new WebflowRouter(generatedRoutes, routerOptions);

router.start();
