#!/usr/bin/env node

/**
 * Dual build will do both a `esm` build and a `cjs` build based on a tsconfig file.
 */
import fs from "fs";
import path from "path";
import json from "json5";
import assert from "node:assert";
import { exec } from "child_process";

/**
 * Expected minimal package.json type
 */
type PackageJson = {
  exports: {
    import: string;
    require: string;
  };
};

/**
 * Expected dualBuild config type
 */
type DualBuildConfig = {
  esm: {
    module: string;
    outDir: string;
  };
  cjs: {
    module: string;
    outDir: string;
  };
  types: {
    outDir: string;
  };
};
let [, , tsConfigFile] = process.argv;

console.log(`2️⃣  tsc-dual-build <tsConfigFile>`);

if (!tsConfigFile) {
  console.log(`⛑  no <tsConfigFile>\n  defaulting to "tsconfig.json"`);
  tsConfigFile = "tsconfig.json";
}
assert(tsConfigFile, `Invalid tsConfig file. Usage: tsc-dual-build <tsConfigFile>`);

async function tscDualBuild() {
  const config = getConfig();

  // Build ESM
  await tscBuild(config.esm.module, config.esm.outDir);

  // Build CJS
  await tscBuild(config.cjs.module, config.cjs.outDir);

  await tscBuildTypes(config.types.outDir);

  // Add local package.jsons
  compileLocalPackageJson(config.packageJson, config.esm.outDir, config.cjs.outDir);

  console.log(`🏁 tsc-dual-build finished`);
}

// npx

function tscBuild(moduleOverride: string, outDirOverride: string) {
  return new Promise<void>((resolve, reject) => {
    console.log(`🔨 tsc-build\n  module: "${moduleOverride}"\n  outDir: "${outDirOverride}"`);

    exec(
      `tsc --pretty -p tsconfig.json --module ${moduleOverride} --outDir ${outDirOverride}`,
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

function tscBuildTypes(outDir: string) {
  return new Promise<void>((resolve, reject) => {
    console.log(`🔨 tsc-build-types\n  outDir: "${outDir}"`);

    exec(
      `tsc --pretty -p tsconfig.json --declaration true --declarationMap true --emitDeclarationOnly true --outDir ${outDir}`,
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

function compileLocalPackageJson(packageJson: PackageJson, esmOutDir: string, cjsOutDir: string) {
  const { exports, ...basePackageJson } = packageJson;

  const esmPackageJson = { ...basePackageJson, type: "module", main: exports.import };
  const cjsPackageJson = { ...basePackageJson, type: "commonjs", main: exports.require };

  console.log(`⚙️ Exporting package.json`);
  fs.writeFileSync(path.join(esmOutDir, "package.json"), JSON.stringify(esmPackageJson, null, 2), {
    encoding: "utf8",
    flag: "w",
  });
  console.log(`  created "${path.join(esmOutDir, "package.json")}"`);
  fs.writeFileSync(path.join(cjsOutDir, "package.json"), JSON.stringify(cjsPackageJson, null, 2), {
    encoding: "utf8",
    flag: "w",
  });
  console.log(`  created "${path.join(cjsOutDir, "package.json")}"`);
}

/**
 * Fetches (and validates) the `tscDualBuild` config from tsconfig.json
 */
function getConfig() {
  assert(process?.env?.npm_package_json, "Expeceted npm_package_json env to be set");
  const rootDir = path.dirname(process.env.npm_package_json);

  const fileContents = fs.readFileSync(path.join(rootDir, tsConfigFile), {
    encoding: "utf8",
    flag: "r",
  });
  const tsConfig = json.parse(fileContents) as { tscDualBuild: DualBuildConfig };

  assert(tsConfig?.tscDualBuild?.esm, "tsconfig.json tscDualBuild.esm is not set");
  assert(tsConfig?.tscDualBuild?.esm?.module, "tsconfig.json tscDualBuild.esm.module is not set");
  assert(tsConfig?.tscDualBuild?.esm?.outDir, "tsconfig.json tscDualBuild.esm.outDir is not set");

  assert(tsConfig?.tscDualBuild?.cjs, "tsconfig.json tscDualBuild.cjs is not set");
  assert(tsConfig?.tscDualBuild?.cjs?.module, "tsconfig.json tscDualBuild.cjs.module is not set");
  assert(tsConfig?.tscDualBuild?.cjs?.outDir, "tsconfig.json tscDualBuild.cjs.outDir is not set");

  assert(tsConfig?.tscDualBuild?.types, "tsconfig.json tscDualBuild.types is not set");
  assert(
    tsConfig?.tscDualBuild?.types?.outDir,
    "tsconfig.json tscDualBuild.types.outDir is not set"
  );

  const pjFileContents = fs.readFileSync(process.env.npm_package_json, {
    encoding: "utf8",
    flag: "r",
  });
  const packageJson = json.parse(pjFileContents);
  assert(packageJson?.exports, "package.json exports is not set");
  assert(packageJson?.exports?.import, "package.json exports.import is not set");
  assert(packageJson?.exports?.require, "package.json exports.require is not set");

  return {
    ...tsConfig.tscDualBuild,
    exports: packageJson.exports,
    packageJson: packageJson as PackageJson,
  };
}

tscDualBuild();
