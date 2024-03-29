/**
 * This test will retain the default Jest behaviour.
 * 
 * EXPECTED RESULT:
 *     The failed tests will have NO impact on other tests.
 */
describe("First describe", () => {
	it("should succeed", async () => {
		expect(true).toBe(true);
	})

	describe("Second nested Describe", () => {
		it("should succeed", async () => {
			expect(true).toBe(true);
		})
		it("should fail", async () => {
			throw new Error("This test should fail");
		})

		describe("Third nested Describe", () => {
			it("should fail", async () => {
				throw new Error("This test should fail");
			})
			it("should succeed", async () => {
				expect(true).toBe(true);
			})
		})
	
		it("should succeed", async () => {
			expect(true).toBe(true);
		})
	})

	it("should succeed", async () => {
		expect(true).toBe(true);
	})
});