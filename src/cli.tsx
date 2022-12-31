#!/usr/bin/env node

import React from "react";
import ReactDOMServer from "react-dom/server";
import { writeFileSync } from "fs";

import { processDir } from "./process-dir.js";
import { Tree } from "./Tree";

import { createArgument, createCommand, createOption } from "commander";

const cliHandler = async (args: string[], opts: any) => {
  const rootPath = args[0];
  const { maxDepth, color, exclude, excludeGlob, output } = opts;

  const excludedPaths = exclude.split(",").map((str) => str.trim());
  // Split on semicolons instead of commas since ',' are allowed in globs, but ';' are not + are not permitted in file/folder names.
  const excludedGlobs = excludeGlob.split(";");

  const data = await processDir(rootPath, excludedPaths, excludedGlobs);

  const componentCodeString = ReactDOMServer.renderToStaticMarkup(
    <Tree
      data={data}
      maxDepth={+maxDepth}
      colorEncoding={color}
      customFileColors={{}}
      filesChanged={[]}
    />
  );

  writeFileSync(output, componentCodeString);

  console.log("All set!");
};

const program = createCommand("repo-visualizer")
  .version(require("../package.json").version ?? "0.0.0")
  .addArgument(
    createArgument("path", "Path of the repository").default("").argOptional()
  )
  .addOption(createOption("-d,--max-depth <number>").default(9))
  .addOption(
    createOption("-c,--color <string>", "Color encoding")
      .choices(["type", "last-change", "number-of-changes"])
      .default("type")
  )
  .addOption(
    createOption(
      "-e,--exclude <string>",
      "List of path to exclude (commas separated)"
    ).default(
      "node_modules,bower_components,dist,out,build,eject,.next,.netlify,.yarn,.git,.vscode,package-lock.json,yarn.lock"
    )
  )
  .addOption(
    createOption(
      "-g,--exclude-glob <string>",
      "Glob to exclude (semicolons separated)"
    ).default("")
  )
  .addOption(
    createOption("-o,--output <string>", "Output file").default("./diagram.svg")
  )
  .action(cliHandler);

program.parseAsync();
