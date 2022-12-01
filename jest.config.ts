import type {Config} from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
	verbose: true,
	noStackTrace: true,
	testRunner: "jest-circus/runner",
};

module.exports = config;