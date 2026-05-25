import ora from "ora";
import pc from "picocolors";

export function createLogger() {
  return {
    success(message) {
      console.log(`${pc.green("✔")} ${message}`);
    },
    warn(message) {
      console.warn(`${pc.yellow("!")} ${message}`);
    },
    info(message) {
      console.log(message);
    },
    spinner(message) {
      return ora(message).start();
    },
  };
}
