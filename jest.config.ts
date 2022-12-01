import type {Config} from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
	verbose: true,
	noStackTrace: true,
	
	// Prior to Jest v27 this was needed in order to make `jest-circus` the test runner.
	// In Jest >= v27, the `jest-circus` was set to default.
	testRunner: "jest-circus/runner",
};

module.exports = config;