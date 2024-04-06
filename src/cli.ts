import { Command } from "commander";
import install from "./cmd/install.js";

export const exec = () => {
  const program = new Command();

  program
    .name("apex-package-manager")
    .description(
      "manages dependencies on git repositories in the salesforce ecosystem",
    );

  install(program);

  program.parse();
};
