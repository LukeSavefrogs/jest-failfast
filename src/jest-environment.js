/*  
*************************************************************************

	Source:
		- https://github.com/smooth-code/jest-puppeteer
		- https://stackoverflow.com/a/65904327/8965861

*************************************************************************
*/
const NodeEnvironment = require('jest-environment-node').default;

const DEFAULT_CONFIGURATION = {
	/**
	 * If set to `true`, the test will fail as soon as a test fails.
	 * @type {boolean}
	 */
	enableFailFast: false,
}

class NodeEnvironmentFailFast extends NodeEnvironment {
	constructor(config, context) {
		super(config, context);

		this.testPath = context.testPath;
		this.docblockPragmas = context.docblockPragmas;

		/**
		 * @type {typeof DEFAULT_CONFIGURATION}
		 */
		this.configuration = Object.assign({}, DEFAULT_CONFIGURATION, config?.projectConfig?.testEnvironmentOptions);

		// console.log(`Global Config: ${JSON.stringify(config?.globalConfig, null, 4)}`);
		// console.log(`Project Config: ${JSON.stringify(config?.projectConfig, null, 4)}`);
		console.log(`Environment Config: ${JSON.stringify(config?.projectConfig?.testEnvironmentOptions, null, 4)}`);
		// console.log(`Context: ${JSON.stringify(context, null, 4)}`);
		console.log(`TestPath: ${JSON.stringify(this.testPath, null, 4)}`);
		console.log(`DocblockPragmas: ${JSON.stringify(this.docblockPragmas, null, 4)}`);
	}
	
	registeredEventHandler = [];
	verbose = false;

	lastFailed = false;

	currentDescribeDepth = 0;
	failedDescribeDepth = 0;
	describeFailureDepthThreshold = 0;

	async setup() {
		await super.setup()
		this.global.testEnvironment = this;
	}

	async teardown() {
		await super.teardown();
	}

	/**
	 * 
	 * @param {Function} registeredEventHandler Function to be executed *before* any default handler. Check `event.name` to find out what event is being handled.
	 * 
	 * @example
	 * ```
	 * // testEnvironment is globally available (see above NodeEnvironmentFailFast.setup)
	 * testEnvironment.registerTestEventHandler(async (event) => {
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


	setSkipLevel(depth = 0) {
		console.log(`Setting skip level to ${!!depth} (CurrentDepth: ${this.currentDescribeDepth})`);

		// If we are going to set the scope to block, we need to skip if there is already an error.
		// Otherwise The checks will still be done even if there was already an error.
		// if (depth != 0 && this.lastFailed)
		// 	return;

		/**
		 * Imposto il livello a 0 o alla profondità corrente.
		 */
		this.describeFailureDepthThreshold = (depth == 0) ? 0 : this.currentDescribeDepth;
	}


	setVerbose(verbose = false) {
		this.verbose = !!verbose;
	}

	async executeTestEventHandlers(event, state) {
		for (let handler of this.registeredEventHandler) {
			await handler(event, state);
		}
	}

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
				/**
				 * If this is the end of a scoped block, we need to reset the scope.
				 */
				if (this.currentDescribeDepth < this.describeFailureDepthThreshold) {
					this.describeFailureDepthThreshold = 0;
				}

				/**
				 * If this is the end of a block that caused a failure, reset the FAILURE depth.
				 */
				if (this.currentDescribeDepth <= this.failedDescribeDepth) {
					this.failedDescribeDepth = 0;
				}
	

				this.currentDescribeDepth--;
				break;

			case 'test_skip':
				if (this.verbose) 
					console.error(`[SKIPPED ] ${event.test?.parent?.name} > ${event.test?.name}`)
				break;
			case "hook_failure": {
				const describeBlockName = event.hook.parent.name;

				this.failedDescribeDepth = this.currentDescribeDepth;
				this.lastFailed = true;

				// hook errors are not displayed if tests are skipped, so display them manually
				if (this.verbose) 
					console.error(`ERROR: ${describeBlockName} > ${event.hook.type}\n\n`, event.error, "\n");
				break;
			}
			case "test_fn_failure": {
				if (this.verbose) {
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
					if (this.verbose) console.error(`[Starting] ${event.test?.parent?.name} > ${event.test?.name}`);

				/**
				 * If this is the first run of the test, we check if the previous failed.
				 * If so, we skip the current test.
				 */
				if (event.test.invocations == 1) {
					console.error(`Should skip at first failed test: ${this.configuration.enableFailFast} / Has failed: ${this.lastFailed}`);

					/**
					 * If at least one test has failed, skip all the tests inside the whole test suite.
					 */
					if (this.configuration.enableFailFast && this.lastFailed) {
						event.test.mode = "skip";
						break;
					}
					/* if (this.describeFailureDepthThreshold == 0 && this.lastFailed) {
						event.test.mode = "skip";
					} 
					else*/ 
					if (this.describeFailureDepthThreshold > 0 && this.failedDescribeDepth > 0) {
						if (this.currentDescribeDepth >= this.failedDescribeDepth) {
							event.test.mode = "skip";
						}
					}
				}

				
				break;
			}
		}

		if (["run_describe_start", "run_describe_finish", "test_fn_failure", "test_fn_success", "test_start"].includes(event.name)) {
			// console.log(`\n`);
			// console.log(`=======================================================`);
			// console.log(`    Event Name   : ${event.name} ${event.test?.name ? ` (${event.test.name})` : (event.describeBlock?.name ? ` (${event.describeBlock.name})` : '')}`);
			// console.log(`    Current Depth: ${this.currentDescribeDepth}`);
			// console.log(`    Failure Depth: ${this.failedDescribeDepth}`);
			// console.log(`    Thresh. Depth: ${this.describeFailureDepthThreshold}`);
			// console.log(`=======================================================`);
			// console.log(`\n`);
		}

		if (super.handleTestEvent) {
			super.handleTestEvent(event, state);
		}
	}
}

module.exports = NodeEnvironmentFailFast;