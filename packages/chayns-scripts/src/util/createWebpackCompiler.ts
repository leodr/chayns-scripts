import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin"
import { CleanWebpackPlugin } from "clean-webpack-plugin"
import Dotenv from "dotenv-webpack"
import * as fs from "fs"
import HtmlWebpackPlugin from "html-webpack-plugin"
import { kebabCase } from "lodash"
import MiniCssExtractPlugin from "mini-css-extract-plugin"
import OptimizeCssAssetsPlugin from "optimize-css-assets-webpack-plugin"
import * as path from "path"
import webpack, { Compiler, Plugin } from "webpack"
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer"
import { setBrowsersListEnv } from "../features/environment/browserslist"
import { resolveProjectPath } from "./resolveProjectPath"

type Mode = "development" | "production"

interface CreateConfigOptions {
	mode: Mode
	analyze: boolean
	singleBundle: boolean
	outputFilename: string
}

export function createWebpackCompiler({
	mode,
	analyze,
	outputFilename,
	singleBundle,
}: CreateConfigOptions): Compiler {
	const plugins: Plugin[] = [
		new Dotenv({
			path: "./.env.local",
			systemvars: true,
		}),
	]

	const hasHTMLFile = fs.existsSync(resolveProjectPath("src/index.html"))
	// eslint-disable-next-line
	const packageJson: { name: string } = require(resolveProjectPath(
		"package.json"
	))
	const packageName = packageJson.name

	if (hasHTMLFile) {
		const minify =
			mode === "production"
				? {
						removeComments: true,
						collapseWhitespace: true,
						removeRedundantAttributes: true,
						useShortDoctype: true,
						removeEmptyAttributes: true,
						removeStyleLinkTypeAttributes: true,
						keepClosingSlash: true,
						minifyJS: true,
						minifyCSS: true,
						minifyURLs: true,
				  }
				: undefined

		plugins.push(
			new HtmlWebpackPlugin({
				template: path.resolve(process.cwd(), "src/index.html"),
				minify,
			})
		)
	}

	if (analyze) {
		plugins.push(new BundleAnalyzerPlugin())
	}

	if (mode === "production") {
		plugins.push(new CleanWebpackPlugin())
	}

	setBrowsersListEnv(mode)

	if (mode === "development") {
		plugins.push(new ReactRefreshWebpackPlugin())
	}

	if (mode === "production" && !singleBundle) {
		plugins.push(
			new MiniCssExtractPlugin({
				filename: `static/css/${packageName}.[contenthash].css`,
				chunkFilename: `static/css/${packageName}.[chunkhash].chunk.css`,
			})
		)
		plugins.push(new OptimizeCssAssetsPlugin())
	}

	const shouldUseSourceMaps = mode !== "production"

	return webpack({
		entry: resolveProjectPath("src/index"),
		mode,
		devtool: shouldUseSourceMaps ? "cheap-module-eval-source-map" : false,
		context: process.cwd(),
		output: {
			path: resolveProjectPath("build/"),
			hashDigestLength: 12,
			filename: getOutputPath({ mode, filename: outputFilename, singleBundle }),
		},
		resolve: { extensions: [".js", ".jsx", ".ts", ".tsx"] },
		module: {
			rules: [
				{
					test: /\.(js|jsx|ts|tsx)$/,
					use: {
						loader: "babel-loader",
						options: {
							presets: ["@chayns-scripts"],
							babelrc: false,
							configFile: false,
							compact: mode === "production",
						},
					},
					exclude: /node_modules/,
				},
				{
					test: /\.(css|scss)/,
					use: [
						mode === "development" || singleBundle
							? "style-loader"
							: MiniCssExtractPlugin.loader,
						"css-loader",
						{
							loader: "postcss-loader",
							options: {
								postcssOptions: {
									plugins: [
										[
											"postcss-preset-env",
											{
												autoprefixer: { flexbox: "no-2009" },
												stage: 2,
											},
										],
										"postcss-flexbugs-fixes",
										"cssnano",
									].filter(Boolean),
								},
							},
						},
						"sass-loader",
					],
				},
				{
					test: /\.(png|jpe?g|gif|webp)$/i,
					use: {
						loader: "url-loader",
						options: {
							limit: singleBundle ? Infinity : 10000,
							fallback: {
								loader: "file-loader",
								options: { name: "static/media/[contenthash:12].[ext]" },
							},
						},
					},
				},
				{
					test: /\.svg$/,
					use: "@svgr/webpack",
				},
			],
		},
		plugins,
		optimization: {
			splitChunks: singleBundle
				? false
				: {
						chunks: "all",
						name: false,
				  },
		},
		performance: false,
	})
}

function getOutputPath({
	mode,
	filename,
	singleBundle,
}: {
	mode: "development" | "production"
	filename: string
	singleBundle: boolean
}) {
	const outputPath = singleBundle ? "" : "static/js/"

	// eslint-disable-next-line
	const pkg: { name: string } = require(resolveProjectPath("package.json"))

	const preparedFilename = filename.replace("[package]", kebabCase(pkg.name))

	if (mode === "development") {
		return `${outputPath}bundle.js`
	}
	return outputPath + preparedFilename
}
