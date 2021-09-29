import { BrowserScriptHostBridge } from "../src";

describe("BrowserScriptHostBridge", () => {
    it("can be constructed", () => {
        const bridge = new BrowserScriptHostBridge();
        expect(bridge).toBeInstanceOf(BrowserScriptHostBridge);
    });
});
