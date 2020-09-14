import { Box, Text } from "ink"
import React, { useEffect, useState } from "react"
import type { Stats } from "webpack"
import Badge from "../components/Badge"
import AssetSize from "../components/buildScript/AssetSize"
import SizeIndicator from "../components/buildScript/SizeIndicator"
import Column from "../components/grid/Column"
import GridItem from "../components/grid/GridItem"
import LoadingMessage from "../components/LoadingMessage"
import StatusMessage from "../components/StatusMessage"
import { createWebpackCompiler } from "../util/createWebpackCompiler"

interface BuildProps {
	analyze: boolean
}

export default function Build({ analyze }: BuildProps): JSX.Element {
	const [buildResults, setBuildResults] = useState<Stats>()
	const [buildTime, setBuildTime] = useState<number>()

	useEffect(() => {
		process.env.BABEL_ENV = "production"
		process.env.NODE_ENV = "production"

		const compiler = createWebpackCompiler({ mode: "production", analyze })

		const startTime = Date.now()

		compiler.run((err, stats) => {
			setBuildResults(stats)
			setBuildTime((Date.now() - startTime) / 1000)

			if (err) {
				throw err
			}
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	if (!buildResults) {
		return <LoadingMessage>Bundling your code...</LoadingMessage>
	}

	const hasErrors = buildResults.hasErrors()

	if (hasErrors) {
		return (
			<>
				<StatusMessage badge={<Badge color="red">Error</Badge>}>
					Compilation failed.
				</StatusMessage>

				<Box flexDirection="column" marginBottom={1}>
					{buildResults.compilation.errors.map((e, i) => {
						return <Text key={i}>{e.error.toString()}</Text>
					})}
				</Box>
			</>
		)
	}

	const { assets } = buildResults.toJson()

	return (
		<>
			<StatusMessage badge={<Badge color="green">Success</Badge>}>
				<Text>Finished build in </Text>
				<Text color="blueBright">{buildTime}</Text>
				<Text> seconds.</Text>
			</StatusMessage>

			<Box marginBottom={1}>
				<Text>Outputted these files:</Text>
			</Box>
			<Box marginBottom={1}>
				<Column>
					{assets?.map((asset, index) => (
						<GridItem key={index}>
							<Text>{asset.name}</Text>
						</GridItem>
					))}
				</Column>
				<Column alignment="end">
					{assets?.map((asset, index) => (
						<AssetSize key={index} asset={asset} />
					))}
				</Column>
				<Column>
					{assets?.map((asset, index) => (
						<SizeIndicator key={index} asset={asset} />
					))}
				</Column>
			</Box>
		</>
	)
}
