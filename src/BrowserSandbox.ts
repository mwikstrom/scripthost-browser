import { ScriptSandbox, ScriptValue } from "scripthost-core";
import IFRAME_CODE from "scripthost-iframe/dist/scripthost-iframe.js";

/**
 * A script host brigde that runs code inside an IFRAME element
 * @public
 */
export class BrowserSandbox implements ScriptSandbox {
    private readonly _global: typeof window;
    private readonly _iframe: HTMLIFrameElement;
    private readonly _ready: Promise<void>;

    constructor(global = window) {
        const iframe = global.document.createElement("iframe");
        iframe.style.display = "none";
        iframe.sandbox.add("allow-scripts");
        iframe.srcdoc = `
            <html><head><script>\n
            debugger; // Giving you a chance to set breakpoints in this code\n
            ${IFRAME_CODE}\n
            scripthostIFrame.setupIFrame();\n
            </script></head></html>
        `;
        global.document.body.appendChild(iframe);
        this._global = window;
        this._iframe = iframe;
        this._ready = new Promise(resolve => {
            iframe.addEventListener("load", () => {
                resolve();
            });
        });
    }

    dispose(): void {
        this._iframe.remove();
    }

    post(message: ScriptValue): void {
        this._ready.then(() => {
            const { contentWindow } = this._iframe;
            if (contentWindow) {
                contentWindow.postMessage(message, "*");
            }
        });
    }
    
    listen(handler: (message: ScriptValue) => void): () => void {
        const listener = (e: MessageEvent): void => {
            const { origin, source, data } = e;
            const { contentWindow } = this._iframe;
            if (origin === "null" && !!source && source === contentWindow) {
                handler(data);
            }
        };
        this._global.addEventListener("message", listener);
        return () => {
            this._global.removeEventListener("message", listener);
        };
    }
}
