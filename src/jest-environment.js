/*  
*************************************************************************

	Sources:
		- https://github.com/smooth-code/jest-puppeteer
		- https://stackoverflow.com/a/65904327/8965861

*************************************************************************
*/

/**
 * Jest default Environment that will be extended with custom functionality.
 */
const NodeEnvironment = require('jest-environment-node').default;

/**
 * This is the default Configuration that will be used by this Test Environment if it is not provided otherwise.
 * 
 * You can override this in 2 ways:
 * 
 * 1) By providing a valid configuration object in the `testEnvironmentOptions` property of the `jest.config.js` file.  
 *    Example: 
 * ```
 *     module.exports = {
 *         verbose: true,
 *         noStackTrace: true,
 *         testEnvironment: "<rootDir>/src/jest-environment.js",
 *         testEnvironmentOptions: {
 *             "enableFailFast": true,
 *             "scope": "global"
 *         }
 *     };
 *```
 * 2) By providing a valid configuration object in the docblock at the very start of the test file (remove the backslash in the comment).  
 *    Example: 
 * ```
 *     /**
 *      * This tells Jest to use our custom Environment for this specific file.
 *      * 
 *      * @jest-environment <rootDir>/src/jest-environment.js
 *      * @jest-environment-options { "failFast": {"enabled": true, "scope": "global"} }
 *     *\/
 *     describe("Start test", () => {});
 *```
 */
const DEFAULT_CONFIGURATION = {
	/**
	 * Increases the verbosity of the output, allowing more debug information to be displayed.
	 */
	verbose: false,
	failFast: {
		/**
		 * If set to `true`, the test will fail as soon as a test fails.
		 * @type {boolean}
		 */
		enabled: false,
			
		/**
		 * If set to `global`, a test failure will cause the entire test suite to fail.
		 * 
		 * Has effect only when `failFast.enabled` is `true`.
		 * @type {"global"|"block"}
		 */
		scope: "global",
	}
}

/**
 * Custom Node Environment that will be used by Jest to run the tests.
 * 
 * @class NodeEnvironmentFailFast
 * @classdesc Custom Node Environment that will be used by Jest to run the tests.
 */
class NodeEnvironmentFailFast extends NodeEnvironment {
	constructor(config, context) {
		super(config, context);
		
		this.configuration = Object.assign({}, DEFAULT_CONFIGURATION, config?.projectConfig?.testEnvironmentOptions);
		this.testPath = context.testPath;
		this.docblockPragmas = context.docblockPragmas;
		
		if (!["global", "block"].includes(this.configuration.failFast.scope)) {
			throw new TypeError("FailFast scope configuration should be 'global' or 'block'. Check your code.")
		}
		// console.log(`Global Config: ${JSON.stringify(config?.globalConfig, null, 4)}`);
		// console.log(`Project Config: ${JSON.stringify(config?.projectConfig, null, 4)}`);
		// console.log(`Environment Config: ${JSON.stringify(config?.projectConfig?.testEnvironmentOptions, null, 4)}`);
		// console.log(`TestPath: ${JSON.stringify(this.testPath, null, 4)}`);
		// console.log(`DocblockPragmas: ${JSON.stringify(this.docblockPragmas, null, 4)}`);
	}
	
	/**
	 * Current environment configuration.
	 * 
	 * @name NodeEnvironmentFailFast#configuration
	 * @type {typeof DEFAULT_CONFIGURATION}
	 */
	configuration   = null;

	/**
	 * The path to the test being run.
	 * 
	 * @name NodeEnvironmentFailFast#testPath
	 * @type {String}
	 */
	testPath        = null;

	/**
	 * @name NodeEnvironmentFailFast#docblockPragmas
	 * @type {Object}
	 * 
	 */
	docblockPragmas = null;

	/**
	 * Event handlers added by the `testEnvironment.registerTestEventHandler()` 
	 * method.
	 * 
	 * These get executed before the default ones.
	 * See `handleTestEvent()` method.
	 * 
	 * @name NodeEnvironmentFailFast#registeredEventHandler
	 * @type {eventHandler[]}
	 */
	registeredEventHandler = [];

	lastFailed = false;

	/**
	 * Counter keeping track of the `describe` blocks entered as the test 
	 * goes on.
	 * 
	 * @name NodeEnvironmentFailFast#currentDescribeDepth
	 * @type {Number}
	 */
	currentDescribeDepth = 0;

	/**
	 * The `describe` block depth at which the error was found.
	 * 
	 * @name NodeEnvironmentFailFast#failedDescribeDepth
	 * @type {Number}
	 */
	failedDescribeDepth = 0;

	/**
	 * If set, contains the parent `describe` level that will be treated as
	 * "optional".
	 * If any error occurs inside it, it won't make the test suite fail.
	 * 
	 * Its value represents the `describe` block depth at which 
	 * the `markBlockAsOptional()` method was fired.
	 * 
	 * @name describeFailureDepthThreshold#failedDescribeDepth
	 * @type {Number}
	 */
	describeFailureDepthThreshold = 0;

	async setup() {
		await super.setup()
		this.global.testEnvironment = this;
	}

	async teardown() {
		await super.teardown();
	}

	/**
	 * Event handler function passed to the `registerTestEventHandler()` method.
	 * 
	 * @callback eventHandler
	 * @param {object} event
	 * @param {object} state
	*/

	/**
	 * Register a new Event Handler to the stack that will be executed
	 * before the default handlers.
	 * 
	 * @param {eventHandler} registeredEventHandler Function to be executed *before* any default handler. Check `event.name` to find out what event is being handled.
	 * 
	 * @example
	 * ```
	 * // testEnvironment is globally available (see above NodeEnvironmentFailFast.setup)
	 * testEnvironment.registerTestEventHandler(async (event, state) => {
	 * 	if (event.name === "test_fn_failure") {
	 * 		await takeScreenshot()
	 * 	}
	 * })
	 *
	 * ```
	 */
	registerTestEventHandler(registeredEventHandler) {
		this.registeredEventHandler.push(registeredEventHandler);
	}


	/**
	 * @deprecated Use `testEnvironment.markBlockAsOptional()` instead.
	 * 
	 * @param {Number} depth Depth of the current describe block (gets converted to boolean, so it is sufficient that it's higher than 0).
	 */
	setSkipLevel(depth = 0) {
		if (this.configuration.verbose)
			console.log(`Setting skip level to ${!!depth} (CurrentDepth: ${this.currentDescribeDepth})`);

		/**
		 * Imposto il livello a 0 o alla profondità corrente.
		 */
		this.describeFailureDepthThreshold = (depth == 0) ? 0 : this.currentDescribeDepth;
	}

	/**
	 * Marks the current block as optional.
	 * 
	 * If the marked block fails, it will not make the entire test suite fail as well,
	 * even if `scope` is set to `global`.
	 * 
	 * @type {never}
	 */
	markBlockAsOptional() {
		if (this.configuration.verbose)
			console.log(`Setting current block as OPTIONAL (CurrentDepth: ${this.currentDescribeDepth})`);

		/**
		 * 
		 */
		this.describeFailureDepthThreshold = this.currentDescribeDepth;
	}

	/**
	 * Enables or disables a more verbose output.
	 * Overrides the `verbose` set in the configuration.
	 * 
	 * Note that this MAY interfere with Jest's output, so use only if strictly 
	 * necessary. 
	 * 
	 * This should be used only when developing directly on the Environment, as in the case 
	 * of new features.
	 * 
	 * @param {Boolean} verbose Pass `true` to increase verbosity, `false` to decrease it.
	 */
	setVerbose(verbose = true) {
		this.configuration.verbose = !!verbose;
	}

	async executeTestEventHandlers(event, state) {
		for (let handler of this.registeredEventHandler) {
			await handler(event, state);
		}
	}

	/**
	 * Method used to customize the way Jest handles events.
	 * 
	 * @param {*} event Event object
	 * @param {*} state State object
	 */
	async handleTestEvent(event, state) {
		await this.executeTestEventHandlers(event, state);

		switch (event.name) {
			case 'run_describe_start':
				this.currentDescribeDepth++;

				// Reset if there is a second main describe block
				if(event.describeBlock.parent?.name === "ROOT_DESCRIBE_BLOCK")
					this.lastFailed = false;
				

				break;

			case 'run_describe_finish':
				this.currentDescribeDepth--;

				/**
				 * If this is the end of a scoped block, we need to reset the errors so that they are not 
				 * propagated outside of the scope.
				 */
				if (this.currentDescribeDepth < this.describeFailureDepthThreshold) {
					this.describeFailureDepthThreshold = 0;
					this.failedDescribeDepth = 0;
					this.lastFailed = false;
				}

				/**
				 * If this is the end of a block that caused a failure, reset the FAILURE depth.
				 */
				if (this.currentDescribeDepth < this.failedDescribeDepth) {
					this.failedDescribeDepth = 0;
				}
	

				break;

			case 'test_skip':
				if (this.configuration.verbose)
					console.error(`[SKIPPED ] ${event.test?.parent?.name} > ${event.test?.name}`)
				break;
			case "hook_failure": {
				const describeBlockName = event.hook.parent.name;

				this.failedDescribeDepth = this.currentDescribeDepth;
				this.lastFailed = true;

				// hook errors are not displayed if tests are skipped, so display them manually
				if (this.configuration.verbose) 
					console.error(`ERROR: ${describeBlockName} > ${event.hook.type}\n\n`, event.error, "\n");
				break;
			}
			case "test_fn_failure": {
				if (this.configuration.verbose) {
					console.error(`[FAILED  ] ${event.test?.parent?.name} > ${event.test?.name} (${event.test?.errors})`)
					console.error(event.errors);
				}

				this.failedDescribeDepth = this.currentDescribeDepth;
				this.lastFailed = true;
				break;
			}
			case "test_fn_success": {
				/**
				 * If the test has been retried (using `jest.retryTimes(N)`) and has succeeded,
				 * we need to reset the `lastFailed` flag.
				 */
				if (event.test.invocations > 1) {
					this.lastFailed = false;
				}
				this.failedDescribeDepth = 0;

				break;
			}
			case "test_start": {
				if (event.test?.mode != "skip") 
					if (this.configuration.verbose) console.error(`[Starting] ${event.test?.parent?.name} > ${event.test?.name}`);

				/**
				 * If this is the first run of the test, we check if the previous failed.
				 * If so, we skip the current test.
				 */
				if (event.test.invocations == 1 && this.configuration.failFast.enabled) {
					/**
					 * If a lock has been scoped through the `testEnvironment.setSkipLevel()` method,
					 * we need to check if the current test is in the scope and if the current scope
					 * has at least one failed test.
					 * 
					 * If so, we skip the test.
					 */
					if (this.describeFailureDepthThreshold > 0) {
						if (this.failedDescribeDepth > 0 && this.currentDescribeDepth >= this.failedDescribeDepth && this.currentDescribeDepth >= this.describeFailureDepthThreshold) {
							event.test.mode = "skip";
							break;
						}
					}

					/**
					 * If at least one test has failed, skip all the tests inside the whole test suite.
					 */
					if (this.configuration.failFast.scope == "global" && this.lastFailed) {
						event.test.mode = "skip";
						break;
					}

					if (this.configuration.failFast.scope == "block") {
						/**
						 * Should fail only if the current test is inside a block that has failed.
						 */
						if (this.describeFailureDepthThreshold == 0) {
							if (this.failedDescribeDepth > 0 && this.currentDescribeDepth >= this.failedDescribeDepth) {
								event.test.mode = "skip";
								break;
							}
						}
					}
				}
				break;
			}
		}

		// Additionally, we can print an header when running in verbose mode
		// if (this.configuration.verbose && ["run_describe_start", "run_describe_finish", "test_fn_failure", "test_fn_success", "test_start"].includes(event.name)) {
		// 	console.log(`\n`);
		// 	console.log(`=======================================================`);
		// 	console.log(`    Event Name   : ${event.name} ${event.test?.name ? ` (${event.test.name})` : (event.describeBlock?.name ? ` (${event.describeBlock.name})` : '')}`);
		// 	console.log(`    Current Depth: ${this.currentDescribeDepth}`);
		// 	console.log(`    Failure Depth: ${this.failedDescribeDepth}`);
		// 	console.log(`    Thresh. Depth: ${this.describeFailureDepthThreshold}`);
		// 	console.log(`=======================================================`);
		// 	console.log(`\n`);
		// }

		if (super.handleTestEvent) {
			super.handleTestEvent(event, state);
		}
	}
}

module.exports = NodeEnvironmentFailFast;