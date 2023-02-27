# @kjn/tsc-dual-build

Helps you build ESModules and CommonJS modules with ease.

Will compile the following project structure

```
./src
  /**.*ts
./package.json
./tsconfig.json
```

into something like this

```
./dist
  /esm
    index.js
    package.json
  /cjs
    index.js
    package.json
```

The idea is that we'll create 2 seperate folders, 1 for ESM and 1 for CJS. In both these folders we'll place a _local_ package.json file that contains the configuration solely for the module syntax of the directory.

e.g. `./dist/esm/package.json` contains

- type: "module"
- main: "./dist/esm/index.js"

whereas `./dist/cjs/package.json` contains

- type: "commonjs"
- main: "./dist/commonjs/index.js".

Additionally we assert that the root package.json contains the correct configuration to handle both imports and requires by enforcing the `exports` key to be present and setup correctly.

For `tsc-dual-build` to work you'd need 2 things

- extend your `tsconfig.json` with the required properties
- assert `package.json` contains the correct entry points for `import` and `require`

## tsconfig.json

```json
{
  "compilesOptions": {
    /** placeholder */
  },
  "include": [
    /** placeholder */
  ],

  /** Recommended setup */
  "tscDualBuild": {
    "esm": {
      "module": "es2022",
      "outDir": "./dist/esm"
    },
    "cjs": {
      "module": "commonjs",
      "outDir": "./dist/cjs"
    }
  }
}
```

The (recommended) setup above will built

- your `ECMAScript` module using `es2022` syntax of tsconfig. and will write its output to the folder `./dist/esm/\*\*`
- your `CommonJS` module using `CommonJS` syntax of tsconfig. and will write its output to the folder `./dist/cjs/\*\*`

The `module` and `outDir` properties are fully customisable aslong as they're valid tsconfig settings.

## package.json

For the tsconfig.json above we can configure the root package.json as follows:

```json
{
  "name": "<placeholder>",
  "version": "<placeholder>",
  "dependencies": {
    // <placeholder>
  },
  // ..
  // ..
  // etc..
  // ..
  "exports": {
    "import": "./dist/esm/index.js",
    "require": "./dist/cjs/index.js"
  }
}
```

# Limitations

This project was build with a specific structure and setup in mind, therefore it might not be the golden hammer you're looking for.

Right now we're only supporting `DUAL` exports. There is simply no need to support more exports as most modern applications require either CommonJS OR ESM modules. Additionally at the time of writing we don't really care about `old` systems and many edge-cases that come with.

Another limitation that limits the use of this project would be that this setup assumes that there is only a single entry point for the codebase. IF you need more entry points this project won't work out of the box for you.