interface NavigatorUAData {
  readonly platform: string
  readonly brands?: { brand: string; version: string }[]
  readonly mobile?: boolean
  readonly getHighEntropyValues?: (hints: string[]) => Promise<Record<string, string>>
  readonly toJSON?: () => string
}

interface Navigator {
  readonly userAgentData?: NavigatorUAData
}

/**
 * The LaunchParams interface of the Launch Handler API is used
 * when implementing custom launch navigation handling in a PWA.
 *
 * [MDN](https://developer.mozilla.org/en-US/docs/Web/API/LaunchParams)
 */
interface LaunchParams {
  readonly files: FileSystemHandle[]
  readonly targetURL: string | null
}

interface LaunchQueue {
  /**
   * A callback function that handles custom navigation for the PWA.
   * @param callback A LaunchParams object instance
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/API/LaunchQueue/setConsumer)
   */
  setConsumer: (callback: (launchParams: LaunchParams) => void) => void
}

interface Window {
  /**
   * LaunchQueue provides access to functionality that allows custom launch navigation handling to be implemented in the PWA.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/API/LaunchQueue)
   */
  launchQueue?: LaunchQueue
}
