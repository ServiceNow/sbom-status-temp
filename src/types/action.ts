export interface StatusActionArguments {
  secrets: ActionSecretArguments
  bomRecordId: string
  maxStatusPollAttempts: number
  statusAttemptInterval: number
  fetchPackageInfo: boolean
  fetchVulnerabilityInfo: boolean
}

export interface ActionSecretArguments {
  snSbomUser: string
  snSbomPassword: string
  snInstanceUrl: string
}

export interface StatusApiResponseBody {
  result: {
    bomRecordId: string
    uploadStatus: string
    additionalInfoStatus: string
    buildId: string
    uploadSummary?: StatusApiUploadSummaryResponseBody
    statusCode?: number
    status?: string
    detail?: string
  }
}

export interface StatusApiUploadSummaryResponseBody {
  components?: StatusApiComponentsResponseBody
  vulnerabilityInfo?: StatusApiVulnerabilityInfoResponseBody
  packageInfo?: StatusApiPackageInfoResponseBody
}

export interface StatusApiComponentsResponseBody {
  added: number
  removed: number
  total: number
}

export interface StatusApiVulnerabilityInfoResponseBody {
  critical: number
  high: number
  medium: number
  low: number
  none: number
}

export interface StatusApiPackageInfoResponseBody {
  stale: number
  abandoned: number
}
