const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");

module.exports = (env, argv) => {

    console.log("----------------------------")
    console.log(" ", argv.mode);
    console.log("----------------------------\n")

    const isProd = argv.mode === "production";
    const filename = isProd ? "[contenthash]" : "[name]"

    const res = {
        entry: "./src/index.js",
        output: {
            filename: filename + ".js"
        },
        resolve: {
            modules: [
                path.resolve(__dirname, "node_modules")
            ]
        },
        module: {
            rules: [
                {
                    test: /\.worker.js$/,
                    loader: "worker-loader",
                    options: {
                        filename: filename + ".js"
                    }
                },
                {
                    test: /\.js$/,
                    use: [
                        {
                            loader: "babel-loader",
                            options: {
                                presets: ["@babel/preset-env", "@babel/preset-react"],
                                plugins: [
                                    "@babel/plugin-proposal-object-rest-spread",
                                    "@babel/plugin-proposal-class-properties",
                                    "@babel/plugin-syntax-dynamic-import"
                                ]
                            }
                        },
                        {
                            loader: "eslint-loader",
                            options: {
                                configFile: "./eslintrc.js"
                            }
                        }
                    ]
                },
                {
                    test: /\.html$/,
                    loader: "html-loader"
                },
                {
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        "css-loader"
                    ]
                },
                {
                    test: /\.(eot|woff|woff2|ttf|svg|ico)$/,
                    loader: "file-loader",
                    options: {
                        name: filename + ".[ext]"
                    }
                }
            ]
        },
        plugins: [
            //Use template html file.
            new HtmlWebPackPlugin({
                template: "./index.html"
            }),
            //Extract css styles as external file.
            new MiniCssExtractPlugin({
                filename: filename + ".css"
            })
        ]
    };

    if (argv.mode === "production") {
        res.output.path = path.resolve(__dirname, "docs");
    }

    return res;
};