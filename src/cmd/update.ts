import { Command } from "commander";
import modules from "../modfile.js";
import { TEMP_DIR } from "../constants.js";

const exec = (program: Command) => {
  program
    .command("update")
    .description("Update a module already in the mod manifest")
    .argument("[git-clone-url]", "clone url for repo")
    .argument("[revision]", "revision from the repo to use")
    .action(handler);
};
export default exec;

const handler = async (cloneUrl: string, revision: string = "HEAD") => {
  if (cloneUrl) {
    const dep = modules.find(cloneUrl);
    if (!dep) {
      console.log("dependency not installed");
      return;
    }

    dep.revision = revision;
    dep.install();

    modules.toModfile().write();
  }
};
