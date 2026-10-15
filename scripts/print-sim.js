async function main() {
  const { Simulator } = await import("../server/simulator.js");

  const simulator = new Simulator();
  simulator.onUpdate((update) => console.log(JSON.stringify(update)));
  simulator.start();

  setTimeout(() => {
    simulator.stop();
    console.log("Stopped after 5 seconds.");
  }, 5000);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
