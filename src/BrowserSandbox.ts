import { isGenericMessage, ScriptSandbox, ScriptValue } from "scripthost-core";
import IFRAME_LIB from "scripthost-iframe/dist/scripthost-iframe.js";

/**
 * A script host brigde that runs code inside an IFRAME element
 * @public
 */
export class BrowserSandbox implements ScriptSandbox {
    private readonly _unsafe: boolean;
    private _iframePromise: Promise<HTMLIFrameElement> | null;
    private _disposed;

    constructor(options: BrowserSandboxOptions = {}) {
        const { unsafe = false } = options;
        this._unsafe = unsafe;
        this._iframePromise = null;
        this._disposed = false;
    }

    async ready(): Promise<void> {
        await this._getIFrame();
    }

    async dispose(): Promise<void> {
        if (this._iframePromise !== null) {
            (await this._iframePromise).remove();
        }
        this._iframePromise = null;
        this._disposed = true;
    }

    post(message: ScriptValue): void {
        this._getIFrame().then(
            ({contentWindow}) => {
                if (contentWindow) {
                    contentWindow.postMessage(message, "*");
                } else {
                    console.error("Cannot post message to browser sandbox, because it does not have a content window");
                }
            },
            error => this._logNotAvailable(error),
        );
    }
    
    listen(handler: (message: ScriptValue) => void): () => void {
        let active = true;
        let listener: ((e: MessageEvent) => void) | null = null;
        this._getIFrame().then(
            ({contentWindow}) => active && window.addEventListener("message", listener = (e: MessageEvent): void => {
                const { origin, source, data } = e;

                // Silently ignore messages that can't be understood
                if (!isGenericMessage(data)) {
                    return;
                }

                const rejectMessage = this._getRejectMessage(origin, source, contentWindow);

                if (rejectMessage !== null) {
                    console.warn(`Browser sandbox: Rejecting message: ${rejectMessage}`);
                    return;
                }
                
                try {
                    handler(data);
                } catch (error) {
                    console.error("Browser sandbox: Listener threw exception:", error);
                }
            }),
            error => this._logNotAvailable(error),
        );
        return () => {
            active = false;
            if (listener !== null) {
                window.removeEventListener("message", listener);
            }
        };
    }

    private _getRejectMessage(
        origin: string, 
        source: MessageEventSource | null, 
        contentWindow: Window | null,
    ): string | null {
        if (this._unsafe) {
            return null;
        }

        if (!source) {
            return "No source";
        }

        if (!contentWindow) {
            return "Unbound window";
        }

        if (!("top" in source) || source.top !== contentWindow.top) {
            return "Invalid source";
        }

        if (origin !== window.origin && origin !== "null") {
            return `Invalid origin: ${origin}`;
        }

        return null;
    }

    private _getIFrame(): Promise<HTMLIFrameElement> {
        if (this._iframePromise === null) {
            if (this._disposed) {
                this._iframePromise = new Promise<HTMLIFrameElement>((_, reject) => reject(new Error(
                    "Browser sandbox is disposed"
                )));
            } else {
                this._iframePromise = setupIFrame(this._unsafe);
            }
        }
        return this._iframePromise;
    }

    private _logNotAvailable(error: unknown): void {
        // Don't log "not available"-error after disposal
        if (!this._disposed) {
            console.error("Browser sandbox is not available:", error);
        }
    }
}

/**
 * Options for the {@link BrowserSandbox} constructor
 * @public
 */
export interface BrowserSandboxOptions {
    /**
     * Controls whether the browser sandbox shall be unsafe, meaning that it is not run in
     * a sandboxed iframe element. DO NOT set this property to `true` unless you're in a
     * testing environment that doesn't support sandboxed iframes.
     */
    unsafe?: boolean;
}

const setupIFrame = (unsafe: boolean): Promise<HTMLIFrameElement> => new Promise((resolve, reject) => {
    try {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        if (unsafe) {
            document.body.appendChild(iframe);
            const { contentDocument } = iframe;
            if (contentDocument === null) {
                throw new Error("Unsafe browser sandbox IFRAME element does not expose content document");
            }
            const script = contentDocument.createElement("script");
            script.text = IFRAME_CODE;
            contentDocument.body.appendChild(script);
            resolve(iframe);
        } else {
            iframe.sandbox.add("allow-scripts");
            iframe.srcdoc = IFRAME_HTML;
            document.body.appendChild(iframe);
            const timeoutId = setTimeout(
                () => reject(new Error("Browser sandbox IFRAME element did not load")),
                3000
            );
            iframe.addEventListener("load", () => {
                clearTimeout(timeoutId);
                resolve(iframe);
            });
        }
    } catch (err) {
        reject(err);
    }
});

const IFRAME_CODE = `\n${IFRAME_LIB}\nscripthostIFrame.setupIFrame();\n`;
const IFRAME_HTML = `<html><head><script>${IFRAME_CODE}</script></head></html>`;