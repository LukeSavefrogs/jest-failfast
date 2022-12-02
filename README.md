<p align="center">
	<h1 align="center">FailFast</h1>
	<p align="center">
		<strong><i>A configurable Jest Environment</i></strong>
	</p>
</p>

## Description
This package allows to have more control over the way Jest handles failed tests.

### Features
- Global or block-scoped test failures
- Mark `describe` block as optional (if a failure happens it does not propagate)


## Configuration
To use it, you just need to add the following lines at the top of the test file:
```Javascript
/**
 * This tells Jest to use our custom Environment for this specific file.
 * 
 * @jest-environment <rootDir>/src/jest-environment.js
 * @jest-environment-options { "failFast": {"enabled": true, "scope": "global"} }
 */
```

From there, you'll be able to change the configuration using the following schema:
<table>
	<thead>
		<tr><th>Option name</th><th>Description</th><th>Type</th><th>Default</th></tr>
	</thead>
	<tbody>
		<tr>
			<td><code>verbose</code></td>
			<td>
				If set to true increases the verbosity of the messages printed on screen.<br>
				<br>
				Used for debugging.
			</td>
			<td>Boolean</td>
			<td><code>false</code></td>
		</tr>
		<tr>
			<td><code>failFast.enabled</code></td>
			<td>
				Wether to enable the failFast option or not.<br>
				<br>
				Setting it to <code>false</code> fallbacks to the original Jest behaviour.
			</td>
			<td>Boolean</td>
			<td><code>false</code></td>
		</tr>
		<tr>
			<td><code>failFast.scope</code></td>
			<td>
				The scope of the failure:
				<ul>
					<li><code>global</code>: A single test failure will cause the entire test suite to fail.</li>
					<li><code>block</code>: A single test failure will cause to fail only the nearest <code>describe</code> block to fail. All subsequent tests inside that block will be skipped.</li>
				</ul>
				Takes effect only if <code>failFast.enabled</code> is set to <code>true</code>.
			</td>
			<td><code>"global"|"block"</code></td>
			<td><code>global</code></td>
		</tr>
	</tbody>
</table>

## Methods
#### `testEnvironment.markBlockAsOptional()`
Marks the current `describe` block as "optional". This means that any test failure inside that block won't cause a test suite failure **even if** `failFast.scope` is set to `global`.

This is used when you don't want that block status to influence the test suite exit code (i.e. some preconditions or tests that *may fail*).

#### `testEnvironment.setVerbose(boolean)`
Programmatically set the `verbose` option.

#### `testEnvironment.registerTestEventHandler(function)`
> Originally made by [@ysfaran](https://github.com/ysfaran) for [this SO answer](https://stackoverflow.com/a/65904327/8965861).
> 
Use this method to specify a [custom function](https://jestjs.io/docs/configuration#testenvironment-string#:~:text=handleTestEvent) that will be called for **every event fired by Jest**.


##### Example
In the following example it will be called the `takeScreenshot()` function whenever a **test fails**:
```Javascript
// The `testEnvironment` variable is globally available
testEnvironment.registerTestEventHandler(async (event, state) => {
	if (event.name === "test_fn_failure") {
		await takeScreenshot()
	}
})
```

##### Events
The up-to-date list of events can be found [here](https://github.com/facebook/jest/blob/main/packages/jest-types/src/Circus.ts). These are the ones i found **most useful**:
<table>
	<thead>
		<tr><th colSpan=2><center><b><i>Test suite</i></b></center></th></tr>
		<tr><th>Event name</th><th>Description</th></tr>
	</thead>
	<tbody>
		<tr>
			<td><code>setup</code></td>
			<td>
				First event to be fired.<br>
				<br>
				Can be used to define a <code>constructor</code> of sorts.
			</td>
		</tr>
		<tr>
			<td><code>teardown</code></td>
			<td>
				Last event to be fired.<br>
				<br>
				Fired after everything is finished. Can be used to define a <code>destructor</code> of sorts.
			</td>
		</tr>
	</tbody>
</table>

<table>
	<thead>
		<tr><th colSpan=2><center><b><i><code>test</code> block</i></b></center></th></tr>
		<tr><th>Event name</th><th>Description</th></tr>
	</thead>
	<tbody>
		<tr>
			<td><code>test_start</code></td>
			<td>
				A test has <b>started</b>.
			</td>
		</tr>
		<tr>
			<td><code>test_skip</code></td>
			<td>
				A test has been <b>skipped</b>.
			</td>
		</tr>
		<tr>
			<td><code>test_fn_start</code></td>
			<td>
				Fired when the <b>function passed</b> to a <code>test</code> <b>starts</b>.
			</td>
		</tr>
		<tr>
			<td><code>test_fn_failure</code></td>
			<td>
				Fired when the <b>function passed</b> to a <code>test</code> <b>fails</b>.
			</td>
		</tr>
		<tr>
			<td><code>test_fn_success</code></td>
			<td>
				Fired when the <b>function passed</b> to a <code>test</code> <b>succeeds</b>.
			</td>
		</tr>
	</tbody>
</table>

<table>
	<thead>
		<tr><th colSpan=2><center><b><i><code>describe</code> block</i></b></center></th></tr>
		<tr><th>Event name</th><th>Description</th></tr>
	</thead>
	<tbody>
		<tr>
			<td><code>run_describe_start</code></td>
			<td>
				Fired when a <code>describe</code> block <b>starts</b>.
			</td>
		</tr>
		<tr>
			<td><code>run_describe_finish</code></td>
			<td>
				Fired when a <code>describe</code> block <b>ends</b>.
			</td>
		</tr>
	</tbody>
</table>

## Sources
- [This answer](https://stackoverflow.com/questions/51250006/jest-stop-test-suite-after-first-fail/65904327#65904327)
- [This package](https://www.npmjs.com/package/jest-environment-steps)