import type {Config} from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
	verbose: true,
	noStackTrace: true,
	testRunner: "jest-circus/runner",
	testEnvironment: "<rootDir>/src/jest-environment.js",
	// testEnvironmentOptions: {
	// 	"enableFailFast": true
	// },
	transform: {
		"\\.[jt]sx?$": "babel-jest",
	},
	reporters: [ "default", "summary" ],
};

module.exports = config;