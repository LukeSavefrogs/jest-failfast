
/**
 * This tells Jest to use our custom Environment for this specific file.
 * 
 * @jest-environment <rootDir>/src/jest-environment.js
 * @jest-environment-options { "failFast": {"enabled": true, "global": false} }
 */
describe("Multiple levels of nesting", () => {
	it("should succeed", async () => {
		expect(true).toBe(true);
	})

	describe("Two different scopes of failures", () => {
		it("should succeed", async () => {
			expect(true).toBe(true);
		})

		describe("Nested describe, only the second test will be skipped", () => {
			it("should fail", async () => {
				throw new Error("This test should fail");
			})
			it("should be skipped", async () => {
				expect(true).toBe(true);
			})
		})
	
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

	describe("Parent scope", () => {
		it("should succeed", async () => {
			expect(true).toBe(true);
		})
		it("should fail", async () => {
			throw new Error("This test should fail");
		})

		describe("Nested describe, will be entirely skipped", () => {
			it("should be skipped", async () => {
				expect(true).toBe(true);
			})
			it("should be skipped", async () => {
				expect(true).toBe(true);
			})
		})
	
		it("should be skipped", async () => {
			expect(true).toBe(true);
		})
	})

	it("should succeed too", async () => {
		expect(true).toBe(true);
	})
});