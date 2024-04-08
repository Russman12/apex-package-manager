import { Command } from "commander";
import install from "./cmd/install.js";
import update from "./cmd/update.js";

export const exec = () => {
  const program = new Command();

  program
    .name("sfmod")
    .description("manages dependencies for a Salesforce project");

  install(program);
  update(program);

  program.parse();
};
