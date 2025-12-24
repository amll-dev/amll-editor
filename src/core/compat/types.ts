export namespace Compatibility {
  export interface CompatibilityInfo {
    key: string
    name: string
    description: string
    severity: 'info' | 'warning' | 'error'
    referenceUrls?: {
      label: string
      url: string
    }[]
  }
  export interface CompatibilityItem extends CompatibilityInfo {
    meet: boolean
    why?: string
  }
}
