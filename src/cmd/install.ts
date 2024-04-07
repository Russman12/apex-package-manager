import { Command } from "commander";
import child_process from "child_process";
import os from "os";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import tar from "tar";
import { PROJECT_DIR } from "../constants.js";
import pkg from "../modfile.js";

const MODULES_DIR = path.join(PROJECT_DIR, "sfdx_modules");

const addCommand = (program: Command) => {
  program
    .command("install")
    .description("Install a module from a git repo")
    .argument("<git-clone-url>", "clone url for repo")
    .argument("[revision]", "revision from the repo to use")
    .action(handler);
};

const handler = (cloneUrl: string, revision: string) => {
  //determine project name
  const moduleName = cloneUrl.substring(
    cloneUrl.lastIndexOf("/") + 1,
    cloneUrl.lastIndexOf(".git"),
  );

  const tempDir = path.join(os.tmpdir(), uuidv4());
  const tempProjectPath = path.join(tempDir, moduleName);

  //perform git clone to temp dir
  child_process.execSync(`git clone "${cloneUrl}" "${tempProjectPath}"`);

  if (!revision) {
    revision = child_process
      .execSync(`git rev-parse --short HEAD`, { cwd: tempProjectPath })
      .toString();
  } else {
    child_process.execSync(`git reset --hard "${revision}"`, {
      cwd: tempProjectPath,
    });
  }

  //copy archive content apex_modules directory
  const archivePath = path.join(tempDir, `${moduleName}.tar`);
  child_process.execSync(`git archive --format=tar -o ${archivePath} HEAD`, {
    cwd: tempProjectPath,
  });

  const modulePath = path.join(MODULES_DIR, moduleName);
  if (fs.existsSync(modulePath)) {
    fs.rmSync(modulePath, { recursive: true, force: true });
  }
  fs.mkdirSync(modulePath, { recursive: true });
  tar.extract({ file: archivePath, cwd: modulePath, sync: true });

  //update apex-package.json with installed dependancy version
  pkg.addDependancy(moduleName, cloneUrl, revision.toString().trim());

  pkg.write();

  //delete temp project dir
  fs.rmSync(tempDir, { recursive: true, force: true });
};
export default addCommand;
