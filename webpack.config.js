const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");

module.exports = {
    entry: "./src/index.js",

    resolve: {
        modules: [
            path.resolve(__dirname, "node_modules")
        ]
    },

    module: {
        rules: [
            {
                test: /\.worker.js$/,
                loader: "worker-loader"
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
                test: /\.(eot|woff|woff2|ttf|svg|)$/,
                loader: "file-loader"
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
            filename: "styles.css"
        })
    ]
};