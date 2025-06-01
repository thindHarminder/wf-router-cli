import { onMount, onDestroy } from "webflow-router";

onMount(() => {
  console.log("Root layout mounted!");
  return () => {
    console.log("Root layout unmounted");
  };
});

onDestroy(() => {
  console.log("Root layout onDestroy");
});
