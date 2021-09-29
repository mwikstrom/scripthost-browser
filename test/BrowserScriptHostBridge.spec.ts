import { BrowserScriptHostBridge } from "../src";

describe("BrowserScriptHostBridge", () => {
    it("can be constructed and disposed twice", () => {
        const bridge = new BrowserScriptHostBridge();
        expect(bridge).toBeInstanceOf(BrowserScriptHostBridge);
        bridge.dispose();
        bridge.dispose();
    });
});
