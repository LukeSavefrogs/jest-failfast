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
  *             "global": false
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
 *      * @jest-environment-options { "failFast": {"enabled": true, "global": true} }
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
		  * If set to `true`, a test failure will cause the entire test suite to fail.
		  * 
		  * Has effect only when `failFast.enabled` is `true`.
		  * @type {boolean}
		  */
		 global: true,
	 }
 }
 
 /**
  * Custom Node Environment that will be used by Jest to run the tests.
  */
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
		 // console.log(`Environment Config: ${JSON.stringify(config?.projectConfig?.testEnvironmentOptions, null, 4)}`);
		 // console.log(`TestPath: ${JSON.stringify(this.testPath, null, 4)}`);
		 // console.log(`DocblockPragmas: ${JSON.stringify(this.docblockPragmas, null, 4)}`);
	 }
	 
	 /**
	  * @type {Function[]}
	  */
	 registeredEventHandler = [];
 
	 lastFailed = false;
 
	 currentDescribeDepth = 0;
	 failedDescribeDepth = 0;
	 describeFailureDepthThreshold = 0;
 
	 skipTest = false;
	 skipBlockDepth = new Set();
 
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
	  * This means that if the block fails, it will not make the entire test suite fail as well.
	  */
	 markBlockAsOptional() {
		 if (this.configuration.verbose)
			 console.log(`Setting current block as OPTIONAL (CurrentDepth: ${this.currentDescribeDepth})`);
 
		 /**
		  * 
		  */
		 this.describeFailureDepthThreshold = this.currentDescribeDepth;
	 }
 
	 skipNextTest() {
		 if (this.configuration.verbose)
			 console.log(`Skipping next test (CurrentDepth: ${this.currentDescribeDepth})`);
		 this.skipTest = true;
	 }
 
	 skipThisBlock(status = true) {
		 if (this.configuration.verbose)
			 console.log(`Skipping this block (CurrentDepth: ${this.currentDescribeDepth})`);
		 
		 if (status) {
			 this.skipBlockDepth.add(this.currentDescribeDepth);
		 } else {
			 this.skipBlockDepth.delete(this.currentDescribeDepth);
		 }
	 }
 
	 setVerbose(verbose = false) {
		 this.configuration.verbose = !!verbose;
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
				  * If it is the end of a block that was marked as skipped, 
				  * reset the skip block depth so that it is not propagated outside of the scope.
				  */
				 if (this.skipBlockDepth.size > 0 && this.currentDescribeDepth < Math.max(...this.skipBlockDepth)) {
					 this.skipBlockDepth.delete(Math.max(...this.skipBlockDepth));
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
					 console.error(event.test?.errors);
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
					 if (this.configuration.verbose) 
						 console.error(`[Starting] ${event.test?.parent?.name} > ${event.test?.name}`);
 
				 if (this.skipBlockDepth.size > 0 && this.currentDescribeDepth >= Math.max(...this.skipBlockDepth)) {
					 if (this.configuration.verbose)
						 console.error(`Salto del blocco attivo. Salto il test ${event.test?.name}`);
					 event.test.mode = "skip";
					 break;
				 }
 
				 /**
				  * If the test was purposefully skipped
				  */
				 if (this.skipTest) {
					 if (this.configuration.verbose)
						 console.error(`Skipping test '${event.test?.name}'`);
					 this.skipTest = false;
					 event.test.mode = "skip";
					 break;
				 }
 
				 /**
				  * If this is the first run of the test, we check if the previous failed.
				  * If so, we skip the current test.
				  */
				 if (event.test.invocations == 1 && this.configuration.failFast.enabled) {
					 /**
					  * If a block has been scoped through the `testEnvironment.setSkipLevel()` method,
					  * we need to check if the current test is in the scope and if the current scope
					  * has at least one failed test.
					  * 
					  * If so, we skip the test.
					  */
					 if (this.describeFailureDepthThreshold > 0) {
						 if (this.failedDescribeDepth > 0 && this.currentDescribeDepth >= this.failedDescribeDepth && this.currentDescribeDepth >= this.describeFailureDepthThreshold) {
							 if (this.configuration.verbose)
								 console.error(`Scope ${this.failedDescribeDepth} has failed tests (current: ${this.currentDescribeDepth}). Skipping test '${event.test?.name}'`);
 
							 event.test.mode = "skip";
							 break;
						 }
					 }
 
					 /**
					  * If at least one test has failed, skip all the tests inside the whole test suite.
					  */
					 if (this.configuration.failFast.global && this.lastFailed) {
						 if (this.configuration.verbose)
							 console.error(`Global fail-fast enabled. Skipping test '${event.test?.name}'`);
						 event.test.mode = "skip";
						 break;
					 }
 
					 if (!this.configuration.failFast.global) {
						 /**
						  * Should fail only if the current test is inside a block that has failed.
						  */
						 if (this.describeFailureDepthThreshold == 0) {
							 if (this.failedDescribeDepth > 0 && this.currentDescribeDepth >= this.failedDescribeDepth) {
								 if (this.configuration.verbose)
									 console.error(`Scope ${this.failedDescribeDepth} has failed tests (current: ${this.currentDescribeDepth}). Skipping test '${event.test?.name}'`);
								 event.test.mode = "skip";
								 break;
							 }
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
 
	 runScript(script) {
		 return super.runScript(script);
	 }
 }
 
 module.exports = NodeEnvironmentFailFast;