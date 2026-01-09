export namespace Compatibility {
  export interface CompatibilityInfo {
    key: string
    name: string
    description?: string
    impact: string
    severity: 'info' | 'warn' | 'danger'
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
