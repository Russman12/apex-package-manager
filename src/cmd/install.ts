import { Command } from "commander";
import { v4 as uuidv4 } from "uuid";
import os from "os";
import path from "path";
import fs from "fs";
import modules, { Dependency } from "../modfile.js";

const TEMP_DIR = path.join(os.tmpdir(), uuidv4());

const addCommand = (program: Command) => {
  program
    .command("install")
    .description("Install a module from a git repo")
    .argument("[git-clone-url]", "clone url for repo")
    .argument("[revision]", "revision from the repo to use")
    .action(handler);
};

const handler = async (cloneUrl: string, revision: string = "HEAD") => {
  if (cloneUrl) {
    const dep = new Dependency(cloneUrl, revision.trim());
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
export default addCommand;
