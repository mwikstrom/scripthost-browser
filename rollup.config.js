/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import pluginTypescript from "@rollup/plugin-typescript";
import pluginCommonjs from "@rollup/plugin-commonjs";
import pluginNodeResolve from "@rollup/plugin-node-resolve";
import { babel } from "@rollup/plugin-babel";
import { string } from "rollup-plugin-string";
import pkg from "./package.json";

const inputFileName = "src/index.ts";
const banner = `// ${pkg.name} - version ${pkg.version}`;

export default [
    {
        input: inputFileName,
        output: [
            {
                file: pkg.main,
                format: "cjs",
                sourcemap: true,
                banner,
            },
        ],
        external: id => {
            if (id.includes("scripthost-iframe")) {
                return false;
            } else {
                return (
                    !(id in (pkg.dependencies || {})) && 
                    !/(src|node_modules)/.test(id) && 
                    !/^\.+/.test(id)
                );
            }
        },
        plugins: [
            string({
                include: "node_modules/scripthost-iframe/dist/scripthost-iframe.js"
            }),
            pluginTypescript({
                target: "ES2019",
                include: [ "src/**/*.ts" ],
            }),
            pluginCommonjs({
                extensions: [".js", ".ts"],
            }),
            babel({
                babelHelpers: "runtime",
                extensions: [ ".ts", ".tsx" ],
            }),
            pluginNodeResolve({
                browser: false,
            }),
        ],
    },
];
