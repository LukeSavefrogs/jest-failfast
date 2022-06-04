/**
 * This tells Jest to use our custom Environment for this specific file.
 * 
 * @jest-environment <rootDir>/src/jest-environment.js
 * @jest-environment-options { "failFast": {"enabled": true, "global": true} }
 */
describe("Multiple levels of nesting", () => {
	it("should succeed", async () => {
		expect(true).toBe(true);
	})

	describe("Some parent Describe", () => {
		it("should succeed", async () => {
			expect(true).toBe(true);
		})

		describe("Nested describe, will make the entire test suite fail", () => {
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

		it("should be skipped", async () => {
			throw new Error("This test should fail");
		})
		it("should be skipped", async () => {
			expect(true).toBe(true);
		})
	})

	describe("Another parent Describe", () => {
		it("should be skipped", async () => {
			expect(true).toBe(true);
		})
		it("should be skipped", async () => {
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

	it("should be skipped", async () => {
		expect(true).toBe(true);
	})
});