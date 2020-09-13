const typescriptRules = {
	"react/prop-types": "off",
	"react/require-default-props": "off",
	"@typescript-eslint/no-use-before-define": [
		"error",
		{ functions: false, classes: false, variables: false, enums: false },
	],
}

module.exports = typescriptRules
