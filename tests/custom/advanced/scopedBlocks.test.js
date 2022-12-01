
/**
 * This tells Jest to use our custom Environment for this specific file.
 * 
 * @jest-environment <rootDir>/src/jest-environment.js
 * @jest-environment-options { "failFast": {"enabled": true, "scope": "global"} }
 */
describe("Multiple levels of nesting", () => {
	it("should succeed", async () => {
		expect(true).toBe(true);
	})

	describe("Example of 'Local scope', a failure does not affect the test suite", () => {
		it("should succeed", async () => {
			expect(true).toBe(true);
		})

		describe("Scoped describe error, does not cause the test suite to fail", () => {
			/**
			 * THIS IS THE KEY.
			 * 
			 * This tells the Jest Test Environment to treat this block as "optional".
			*/
			beforeAll(async () => {
				testEnvironment.markBlockAsOptional();
			})

			it("should fail", async () => {
				throw new Error("This test should fail");
			})
			it("should be skipped", async () => {
				expect(true).toBe(true);
			})
			it("should be skipped", async () => {
				expect(true).toBe(true);
			})
		})
	
		it("should succeed", async () => {
			expect(true).toBe(true);
		})

		it("should succeed", async () => {
			expect(true).toBe(true);
		})
		it("should succeed", async () => {
			expect(true).toBe(true);
		})
	})

	describe("Example of 'Global scope', a failure here cause the entire test suite to fail", () => {
		it("should succeed", async () => {
			expect(true).toBe(true);
		})

		describe("Nested describe", () => {
			it("should succeed", async () => {
				expect(true).toBe(true);
			})
			it("should fail", async () => {
				throw new Error("This test should fail");
			})
			it("should be skipped", async () => {
				expect(true).toBe(true);
			})
		})
	
		it("should be skipped", async () => {
			expect(true).toBe(true);
		})
	})

	it("should be skipped, since there was an error in global scope", async () => {
		expect(true).toBe(true);
	})
});