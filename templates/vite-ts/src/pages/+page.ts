import { onMount, onDestroy } from "webflow-router";

onMount(() => {
  console.log("Home page mounted!");
  return () => {
    console.log("Home page unmounted (cleanup)");
  };
});

onDestroy(() => {
  console.log("Home page onDestroy");
});
