import type {Config} from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
	verbose: true,
	noStackTrace: true,
	testEnvironment: "<rootDir>/src/jest-environment.js",
	testRunner: "jest-circus/runner",
	// testEnvironmentOptions: {
	// 	"enableFailFast": true
	// },
	transform: {
		"\\.[jt]sx?$": "babel-jest",
	},
	reporters: [ "default", "summary" ],
};

module.exports = config;