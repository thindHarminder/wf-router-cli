import { onMount, onDestroy } from "webflow-router";

onMount(() => {
  console.log("About page mounted!");
  return () => {
    console.log("About page unmounted (cleanup)");
  };
});

onDestroy(() => {
  console.log("About page onDestroy");
});
