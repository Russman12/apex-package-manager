import path from "path";
import { v4 as uuidv4 } from "uuid";
import os from "os";

export const PROJECT_DIR = process.cwd();
export const MODULES_DIR = path.join(PROJECT_DIR, "sfdx_modules");
export const TEMP_DIR = path.join(os.tmpdir(), uuidv4());
