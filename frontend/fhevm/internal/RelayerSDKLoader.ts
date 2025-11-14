import type { FhevmRelayerSDKType, FhevmWindowType } from "./fhevmTypes";
import { SDK_CDN_URL, SDK_LOCAL_URL } from "./constants";

type TraceType = (message?: unknown, ...optionalParams: unknown[]) => void;

export class RelayerSDKLoader {
  private _trace?: TraceType;

  constructor(options: { trace?: TraceType }) {
    this._trace = options.trace;
  }

  public isLoaded() {
    if (typeof window === "undefined") {
      throw new Error("RelayerSDKLoader: can only be used in the browser.");
    }
    return isFhevmWindowType(window, this._trace);
  }

  public load(): Promise<void> {
    if (typeof window === "undefined") {
      return Promise.reject(new Error("RelayerSDKLoader: can only be used in the browser."));
    }

    if ("relayerSDK" in window) {
      if (!isFhevmRelayerSDKType(window.relayerSDK, this._trace)) {
        throw new Error("RelayerSDKLoader: Unable to load FHEVM Relayer SDK");
      }
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const alreadyLoaded =
        document.querySelector(`script[src="${SDK_CDN_URL}"]`) ||
        document.querySelector(`script[src="${SDK_LOCAL_URL}"]`);
      if (alreadyLoaded) {
        if (!isFhevmWindowType(window, this._trace)) {
          reject(
            new Error(
              "RelayerSDKLoader: window object does not contain a valid relayerSDK object."
            )
          );
          return;
        }
        resolve();
        return;
      }

      const tryLoad = (srcs: string[]) => {
        if (srcs.length === 0) {
          reject(new Error("RelayerSDKLoader: Failed to load Relayer SDK from all sources"));
          return;
        }
        const [src, ...rest] = srcs;
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.onload = () => {
          if (!isFhevmWindowType(window, this._trace)) {
            this._trace?.(
              `RelayerSDKLoader: script loaded from ${src}, but window.relayerSDK is invalid; trying next source if any.`
            );
            tryLoad(rest);
            return;
          }
          resolve();
        };
        script.onerror = () => {
          this._trace?.(`RelayerSDKLoader: failed to load from ${src}, trying fallback...`);
          tryLoad(rest);
        };
        document.head.appendChild(script);
      };

      tryLoad([SDK_CDN_URL, SDK_LOCAL_URL]);
    });
  }
}

export function isFhevmWindowType(
  win: unknown,
  trace?: TraceType
): win is FhevmWindowType {
  if (typeof win === "undefined" || win === null || typeof win !== "object") {
    trace?.("RelayerSDKLoader: window object is invalid");
    return false;
  }
  if (!("relayerSDK" in win)) {
    trace?.("RelayerSDKLoader: window does not contain 'relayerSDK' property");
    return false;
  }
  return isFhevmRelayerSDKType((win as FhevmWindowType).relayerSDK, trace);
}

function objHasProperty<
  T extends object,
  K extends PropertyKey,
  V extends string
>(
  obj: T,
  propertyName: K,
  propertyType: V,
  trace?: TraceType
): obj is T &
  Record<
    K,
    V extends "string"
      ? string
      : V extends "number"
      ? number
      : V extends "object"
      ? object
      : V extends "boolean"
      ? boolean
      : V extends "function"
      ? (...args: any[]) => any
      : unknown
  > {
  if (!obj || typeof obj !== "object") {
    return false;
  }

  if (!(propertyName in obj)) {
    trace?.(`RelayerSDKLoader: missing ${String(propertyName)}.`);
    return false;
  }

  const value = (obj as Record<K, unknown>)[propertyName];

  if (value === null || value === undefined) {
    trace?.(`RelayerSDKLoader: ${String(propertyName)} is null or undefined.`);
    return false;
  }

  if (typeof value !== propertyType) {
    trace?.(
      `RelayerSDKLoader: ${String(propertyName)} is not a ${propertyType}.`
    );
    return false;
  }

  return true;
}

export function isFhevmRelayerSDKType(
  o: unknown,
  trace?: TraceType
): o is FhevmRelayerSDKType {
  if (typeof o === "undefined") {
    trace?.("RelayerSDKLoader: relayerSDK is undefined");
    return false;
  }
  if (o === null) {
    trace?.("RelayerSDKLoader: relayerSDK is null");
    return false;
  }
  if (typeof o !== "object") {
    trace?.("RelayerSDKLoader: relayerSDK is not an object");
    return false;
  }
  if (!objHasProperty(o, "initSDK", "function", trace)) {
    trace?.("RelayerSDKLoader: relayerSDK.initSDK is invalid");
    return false;
  }
  if (!objHasProperty(o, "createInstance", "function", trace)) {
    trace?.("RelayerSDKLoader: relayerSDK.createInstance is invalid");
    return false;
  }
  if (!objHasProperty(o, "SepoliaConfig", "object", trace)) {
    trace?.("RelayerSDKLoader: relayerSDK.SepoliaConfig is invalid");
    return false;
  }
  if ("__initialized__" in o) {
    if (
      (o as { __initialized__?: boolean }).__initialized__ !== true &&
      (o as { __initialized__?: boolean }).__initialized__ !== false
    ) {
      trace?.("RelayerSDKLoader: relayerSDK.__initialized__ is invalid");
      return false;
    }
  }
  return true;
}

