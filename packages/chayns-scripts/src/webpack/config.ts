import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin"
import HtmlWebpackPlugin from "html-webpack-plugin"
import MiniCssExtractPlugin from "mini-css-extract-plugin"
import OptimizeCssAssetsPlugin from "optimize-css-assets-webpack-plugin"
import path from "path"
// @ts-expect-error
import postcssPresetEnv from "postcss-preset-env"
import { Configuration, Plugin } from "webpack"

type Mode = "development" | "production"

interface CreateConfigOptions {
	mode: Mode
}

export function createConfig({ mode }: CreateConfigOptions): Configuration {
	let devtool: Configuration["devtool"]

	const plugins: Plugin[] = [
		new HtmlWebpackPlugin({
			template: path.resolve(process.cwd(), "src/index.html"),
		}),
	]

	switch (mode) {
		case "development":
			devtool = "cheap-module-eval-source-map"
			process.env.BROWSERSLIST = [
				"last 1 chrome version",
				"last 1 firefox version",
				"last 1 safari version",
			].join()

			plugins.push(new ReactRefreshWebpackPlugin())
			break
		case "production":
			devtool = "nosources-source-map"
			process.env.BROWSERSLIST = [">0.5%", "not dead", "not op_mini all"].join()

			plugins.push(
				new MiniCssExtractPlugin({
					filename: "[name].[contenthash].css",
					chunkFilename: "[id].[chunkhash].css",
				})
			)
			plugins.push(new OptimizeCssAssetsPlugin())
			break
	}

	return {
		entry: path.resolve(process.cwd(), "src/index"),
		mode,
		devtool,
		context: process.cwd(),
		output: {
			path: path.resolve(process.cwd(), "build"),
			hashDigestLength: 12,
			filename:
				mode === "development" ? "[name].js" : "[name].[contenthash].js",
		},
		resolve: {
			extensions: [".js", ".jsx", ".ts", ".tsx"],
		},
		module: {
			rules: [
				{
					test: /\.(js|jsx|ts|tsx)$/,
					use: {
						loader: "babel-loader",
						options: {
							presets: ["@chayns-scripts"],
						},
					},
					exclude: /node_modules/,
				},
				{
					test: /\.(css|scss)/,
					use: [
						mode === "development"
							? "style-loader"
							: MiniCssExtractPlugin.loader,
						"css-loader",
						{
							loader: "postcss-loader",
							options: {
								sourceMap: true,
								plugins: [postcssPresetEnv()],
							},
						},
						"sass-loader",
					],
				},
			],
		},
		plugins,
	}
}