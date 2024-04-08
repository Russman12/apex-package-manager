import { Command } from "commander";
import fs from "fs";
import modules, { Dependency } from "../modfile.js";
import { TEMP_DIR } from "../constants.js";

const exec = (program: Command) => {
  program
    .command("install")
    .description("Install a module from a git repo")
    .argument("[git-clone-url]", "clone url for repo")
    .argument("[revision]", "revision from the repo to use")
    .action(handler);
};
export default exec;

const handler = async (cloneUrl: string, revision: string = "HEAD") => {
  if (cloneUrl) {
    const dep = new Dependency(cloneUrl, revision.trim());

    if (dep.isInstalled) {
      //TODO: if is indirect, move to direct
      //TODO: add to pkg if not already
      console.log("module is already installed");
      return;
    }

    await dep.install(TEMP_DIR);

    //update apex-package.json with installed dependancy version
    modules.addDependancy(dep);
  } else {
    //determine mods not installed
    const missingDeps = modules.direct.filter((dep) => !dep.isInstalled);

    await Promise.all(missingDeps.map((dep) => dep.install(TEMP_DIR)));
    console.log("done");
  }

  modules.toModfile().write();

  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true });
  }
};
