import path from "path";
import { PROJECT_DIR, MODULES_DIR } from "./constants.js";
import fs from "fs";
import child_process from "child_process";
import tar from "tar";
import { TEMP_DIR } from "./constants.js";

const PKG_NAME = "sfdxmod.json";
const PKG_PATH = path.join(PROJECT_DIR, PKG_NAME);
const SEMANTIC_VERSION_RE = new RegExp(
  `^v?(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$`,
);

class Modules {
  direct: Dependency[];
  indirect: Dependency[];

  constructor() {
    this.direct = new Array();
    this.indirect = new Array();
  }

  /**
   * Adds depencency to the package file.
   * @param dependency dependency to add
   */
  addDependancy(dependency: Dependency) {
    this.direct.push(dependency);
  }

  /**
   * Removes a dependancy from the package file.
   * @param name Name of dependancy to remove.
   */
  removeDependancy(name: string) {
    delete this.direct[this.direct.findIndex((dep) => dep.name === name)];
  }

  /**
   * Returns Dependency from direct and indirect. Returns undefined if not found.
   * @param cloneUrl clone url to find
   * @returns Dependency found, otherwise undefined
   */
  public find(cloneUrl: string): Dependency | undefined {
    let d;
    d = this.direct.find((dep) => dep.url === cloneUrl);

    return d ? d : this.indirect.find((dep) => dep.url === cloneUrl);
  }

  /**
   * Returns modfile form of this
   * @returns ModFile
   */
  toModfile() {
    const modfile = new ModFile();
    this.direct.forEach(
      (dep) => (modfile.direct[dep.name] = dep.modFileEntryValue()),
    );
    this.indirect.forEach(
      (dep) => (modfile.indirect[dep.name] = dep.modFileEntryValue()),
    );
    return modfile;
  }

  /**
   * Returns Modules from ModFile
   * @returns Modules
   */
  static fromModfile(modfile: ModFile) {
    const mods = new Modules();

    if (modfile.direct) {
      for (const [_, value] of Object.entries(modfile.direct)) {
        const data = value.split(" ");
        mods.direct.push(new Dependency(data[0], data[1]));
      }
    }

    if (modfile.indirect) {
      for (const [_, value] of Object.entries(modfile.indirect)) {
        const data = value.split(" ");
        mods.indirect.push(new Dependency(data[0], data[1]));
      }
    }

    return mods;
  }
}

export class Dependency {
  private _name: string = "";

  public url: string;
  public revision: string;
  public path: string;
  public isInstalled: boolean;
  private tmpProjectDir: string;

  constructor(url: string, revision: string) {
    this.url = url;
    this.revision = revision;
    this.path = path.join(MODULES_DIR, this.name);
    this.isInstalled = fs.existsSync(this.path);
    this.tmpProjectDir = path.join(TEMP_DIR, this.name);
  }

  public get name() {
    if (!this._name) {
      const moduleName = this.url.substring(
        this.url.lastIndexOf("/") + 1,
        this.url.lastIndexOf(".git"),
      );
      this._name = moduleName;
    }
    return this._name;
  }

  public async install() {
    //perform git clone to temp dir
    child_process.execSync(`git clone "${this.url}" "${this.tmpProjectDir}"`);

    //revision is provided, check it out
    if (this.revision) {
      child_process.execSync(`git reset --hard "${this.revision}"`, {
        cwd: this.tmpProjectDir,
      });
    }

    //set revision
    this.revision = this.getRevision();

    //copy archive content modules directory
    this.copyToProject();

    console.log(`installed ${this.name}@${this.revision}`);
  }

  /**
   * Returns semantic version tag of current commit if exists, else returns the commit sha
   * @returns git revision
   */
  private getRevision(): string {
    const semanticVersion = child_process
      .execSync(`git tag --points-at HEAD`, {
        cwd: this.tmpProjectDir,
      })
      .toString()
      .trim()
      .split("\n")
      .find((tag) => SEMANTIC_VERSION_RE.test(tag));
    if (semanticVersion) {
      return semanticVersion;
    }
    return child_process
      .execSync(`git rev-parse --short=16 HEAD`, { cwd: this.tmpProjectDir })
      .toString()
      .trim();
  }

  /**
   * Archives project at given directory and copies content to project modules
   */
  private copyToProject() {
    const archivePath = path.join(TEMP_DIR, `${this.name}.tar`);
    child_process.execSync(`git archive --format=tar -o ${archivePath} HEAD`, {
      cwd: this.tmpProjectDir,
    });

    if (fs.existsSync(this.path)) {
      fs.rmSync(this.path, { recursive: true, force: true });
    }
    fs.mkdirSync(this.path, { recursive: true });
    tar.extract({ file: archivePath, cwd: this.path, sync: true });

    //delete temp project dir
    fs.rmSync(this.tmpProjectDir, { recursive: true, force: true });
  }

  public modFileEntryValue() {
    return `${this.url} ${this.revision}`;
  }
}

let MOD: Modules;
const load = () => {
  if (!MOD) {
    MOD = new Modules();
    if (fs.existsSync(PKG_PATH)) {
      const modfile: ModFile = JSON.parse(fs.readFileSync(PKG_PATH).toString());
      MOD = Modules.fromModfile(modfile);
    }
  }
  return MOD;
};
export default load();

type Dependencies = { [key: string]: string };
class ModFile {
  direct: Dependencies;
  indirect: Dependencies;

  constructor() {
    this.direct = {};
    this.indirect = {};
  }

  write() {
    fs.writeFileSync(PKG_PATH, JSON.stringify(this, emptyKeyReplacer, 2));
  }
}

function emptyKeyReplacer(key: string, value: Object) {
  return value === "" || JSON.stringify(value) === "{}" ? undefined : value;
}
