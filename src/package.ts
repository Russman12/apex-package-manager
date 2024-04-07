import path from "path";
import { PROJECT_DIR } from "./constants.js";
import fs from "fs";

const PKG_NAME = "sfdxmod.json";
const PKG_PATH = path.join(PROJECT_DIR, PKG_NAME);

class Modules {
  dependencies: Dependencies;

  constructor() {
    this.dependencies = {};
  }

  /**
   * Adds depencency to the package file.
   * @param name Name of dependency
   * @param cloneUrl Repo clone URL
   * @param revision Git revision number
   */
  addDependancy(name: string, cloneUrl: string, revision: string) {
    this.dependencies[name] = `${cloneUrl} ${revision}`;
  }

  /**
   * Removes a dependancy from the package file.
   * @param name Name of dependancy to remove.
   */
  removeDependancy(name: string) {
    delete this.dependencies[name];
  }

  write() {
    fs.writeFileSync(PKG_PATH, JSON.stringify(this.dependencies, null, 2));
  }
}

type Dependencies = { [key: string]: string };

let PKG: Modules;
const load = () => {
  if (!PKG) {
    PKG = new Modules();
    if (fs.existsSync(PKG_PATH)) {
      const obj = JSON.parse(fs.readFileSync(PKG_PATH).toString());
      PKG.dependencies = obj.dependencies;
    }
  }
  return PKG;
};
export default load();
