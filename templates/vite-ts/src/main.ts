import { WebflowRouter } from "webflow-router";
import type { RouterOptions } from "webflow-router";
import { generatedRoutes } from "./generated-wf-routes";

const routerOptions: RouterOptions = {};

const router = new WebflowRouter(
  generatedRoutes,
  import.meta.env.PROD,
  routerOptions
);

router.start();
