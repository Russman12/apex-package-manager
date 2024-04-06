import { Command } from "commander";
// import * as child_process from "child_process";

const addCommand = (program: Command) => {
  program
    .command("install")
    .description("Install a module from a git repo")
    .argument("<git-clone-url>", "clone url for repo")
    .action(handler);
};
const handler = (cloneUrl: any) => {
  //separate cloneUrl to components
  const idx = cloneUrl.lastIndexOf("@");
  const url = cloneUrl.substring(0, idx);
  const revision = cloneUrl.substring(idx + 1);

  console.log(url);
  console.log(revision);

  //perform git clone to temp dir
  // child_process.execSync("git clone ");
  // cloneUrl;

  //copy non-git project files to apex_modules directory
  //update apex-package.json with installed dependancy version
};

export default addCommand;
