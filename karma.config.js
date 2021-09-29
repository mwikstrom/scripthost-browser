/* eslint-disable @typescript-eslint/no-var-requires */
// This file provides a Karma test runner configuration

// We use Google Chrome for testing, either headless (non-interactive) or interactive.
// These are common flags that we use for all chrome browsers.
// A complete list of flags with descriptions is available here:
// https://peter.sh/experiments/chromium-command-line-switches/
const chromeFlags = [
    "--disable-translate",
    "--disable-extensions",
    "--remote-debugging-port=9222",
];

// Use the Chrome installation provided by `puppeteer`
process.env.CHROME_BIN = require("puppeteer").executablePath();

const path = require("path");

// Export the configuration function that Karma calls to setup itself
module.exports = function(config) {
    config.set({
        // While Karma runs our tests, Jasmine is our test framework.
        frameworks: ["jasmine"],

        // Include all test files
        files: [
            "test/**/*.ts",
        ],

        // We're using Babel and Webpack to transpile our code to ES5. Webpack is needed to bundle
        // and transpile dependencies.
        preprocessors: {
            // Bundle and transpile test files
            "test/**/*.ts": ["webpack"],
        },

        // Tell Karma what kind of output we want to have reported when running tests
        reporters: [
            // Use `karma-spec-reporter` to pretty print test results in the console
            "spec",

            // Use `karma-jasmine-html-reporter` for getting a nice html ui when running an interactive
            // chrome browser. (`npm run test:interactive`)
            "kjhtml",

            // Use `karma-junit-reporter` to make our devops pipeline pretty
            "junit",

            // Use `karma-coverage-istanbul-reporter` to generate coverage reports
            "coverage-istanbul",
        ],

        coverageIstanbulReporter: {
            reports: [ "html", "text", "cobertura" ],
            dir: path.join(__dirname, "coverage"),
            fixWebpackSourcePaths: true,
            "report-config": {
                html: { outdir: "html" }
            }
        },


        // Set to LOG_DEBUG for detailed logging. The default is LOG_INFO.
        logLevel: config.LOG_INFO,

        // Do not watch files by default.
        // Overriden when running `npm run test:interactive` and `npm run test:watch`
        autoWatch: false,

        // Just run tests and exit by default.
        // Overriden when running `npm run test:interactive` and `npm run test:watch`
        singleRun: true,

        // By default we use a non-interactive headless chrome browser.
        browsers: ["NonInteractiveChrome"],

        // Limits the maximum number of browser instances that Karma can launch
        concurrency: Infinity,

        // Setup browsers
        customLaunchers: {
            // The non-interactive browser is used by default
            NonInteractiveChrome: {
                base: "ChromeHeadless",
                flags: chromeFlags,
            },

            // The interactive browser is used when running `npm run test:interactive`
            InteractiveChrome: {
                base: "Chrome",
                flags: chromeFlags,
            },
        },

        // Tell Karma which plugins we're using
        plugins: [
            // Use Jasmine test framwork
            "karma-jasmine",

            // Pretty html reports for Jasmine. For use in interactive mode.
            "karma-jasmine-html-reporter",

            // Pretty console reports
            "karma-spec-reporter",

            // Provides support for `Chrome` and `ChromeHeadless`
            "karma-chrome-launcher",

            // Webpack is needed for bundling
            "karma-webpack",

            // jUnit test report is used by our devops pipeline
            "karma-junit-reporter",

            // `karma-coverage-istanbul-reporter` is used to generate coverage reports
            "karma-coverage-istanbul-reporter",
        ],

        // Save jUnit report in `./temp/jUnit.xml`
        junitReporter: {
            outputDir: "temp",
            outputFile: "jUnit.xml",
            useBrowserName: false,
        },

        // Configure Webpack bundling
        // For more information see:
        // https://webpack.js.org/configuration/
        webpack: {
            // Use development mode -- we're testing stuff
            mode: "development",

            // Resolve JavaScript and TypeScript modules
            resolve: {
                extensions: [".js", ".ts", ".tsx"],
            },
            
            devtool: "inline-source-map",

            // Use Babel for transpiling JavaScript and TypeScript
            module: {
                rules: [
                    // We use ts-loader to compile all typescript into es6 
                    {
                        test: /\.tsx?$/,
                        use: "ts-loader"
                    },

                    // We load all ts-file with coverage instruments, except the test files.
                    {
                        test: /\.tsx?$/,
                        exclude: [ path.resolve(__dirname, "test") ],
                        enforce: "post",
                        use: {
                            loader: "istanbul-instrumenter-loader",
                            options: { esModules: true }
                        }
                    },

                    // Use the raw source for IFRAME_CODE
                    {
                        test: /scripthost-iframe\.js$/,
                        type: "asset/source"
                    }
                ]
            },
        },

        // Prevent console from being flooded with crap from `webpack-dev-middleware`
        webpackMiddleware: {
            logLevel: "error"
        },
    });
};
