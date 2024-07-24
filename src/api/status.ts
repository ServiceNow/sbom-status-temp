import { StatusActionArguments, StatusApiResponseBody } from '@/src/types/action'
import { REQUEST_STATUS_ERROR_INSUFFICIENT_DATA } from '@/src/types/errors'
import * as core from '@actions/core'
import ProgressBar from '@/src/utils/summary'
import * as process from 'node:process'
import * as statusUtils from '@/src/api/status'

export function generateStatusUrl(actionArguments: StatusActionArguments) {
  let statusSearchParams = new URLSearchParams()
  statusSearchParams.append('bomRecordId', actionArguments.bomRecordId)
  let url = new URL('/api/sbom/core/upload/status', actionArguments.secrets.snInstanceUrl)
  url.search = statusSearchParams.toString()
  return url
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function status(actionArguments: StatusActionArguments) {
  if (actionArguments.bomRecordId == undefined) {
    throw new Error(REQUEST_STATUS_ERROR_INSUFFICIENT_DATA('Missing bomRecordId').message)
  }

  let statusUrl = generateStatusUrl(actionArguments)
  let numPolls = 0
  const MAX_NUM_POLLS = actionArguments.maxStatusPollAttempts
  let pollHistory: StatusApiResponseBody[] = []

  console.log('Polling processing status...')
  const total = 100
  const progressBar = new ProgressBar(total, MAX_NUM_POLLS)
  let current = 0
  let processingComplete = false

  let doWaitForAdditionalInfo = actionArguments.fetchPackageInfo || actionArguments.fetchVulnerabilityInfo

  while (numPolls++ < MAX_NUM_POLLS) {
    let results = await statusUtils._performStatus(
      statusUrl,
      actionArguments.secrets.snSbomUser,
      actionArguments.secrets.snSbomPassword
    )
    pollHistory.push(results)
    current += total / MAX_NUM_POLLS
    progressBar.update(current)

    core.debug(`Status attempt #${numPolls} response...`)
    core.debug(`${JSON.stringify(results, null, 2)}`)
    core.debug('\n')

    console.log(results)

    let haltingCondition =
      (results.result.uploadStatus === 'processed' && !doWaitForAdditionalInfo) ||
      (results.result.uploadStatus === 'processed' &&
        doWaitForAdditionalInfo &&
        results.result.additionalInfoStatus === 'complete')
    if (haltingCondition) {
      processingComplete = true
      break
    }

    await sleep(actionArguments.statusAttemptInterval)
  }

  if (!processingComplete) {
    console.log('Timed out before completion...')
    await core.summary
      .addSeparator()
      .addQuote(
        '⚠️️ The maximum status poll attempts has been reached. Please consider increasing the maximum number of poll attempts (maxStatusPollAttempts) or time between poll attempts (statusAttemptInterval) before re-running.'
      )
      .addHeading('Current Status Polling Configuration', 4)
      .addCodeBlock(
        JSON.stringify({
          maxStatusPollAttempts: actionArguments.maxStatusPollAttempts,
          statusAttemptInterval: actionArguments.statusAttemptInterval
        }),
        'json'
      )
      .write()
    core.setOutput('statusState', 'timeout')
    core.setFailed('The maximum status poll attempts has been reached.')
    return
  }

  let ultimatePoll: StatusApiResponseBody | undefined = pollHistory.pop()

  if (process.env.NODE_ENV !== 'test' && processingComplete) {
    let summary = core.summary
      .addHeading('SBOM Processing Results')
      .addQuote('✅ Successfully processed SBOM...')
      .addHeading('Component Information', 4)
      .addTable([
        [
          { data: 'Added', header: true },
          { data: 'Removed', header: true },
          { data: 'Total', header: true }
        ],
        [
          `${ultimatePoll?.result?.uploadSummary?.components?.added}`,
          `${ultimatePoll?.result?.uploadSummary?.components?.removed}`,
          `${ultimatePoll?.result?.uploadSummary?.components?.total}`
        ]
      ])
    if (actionArguments.fetchVulnerabilityInfo) {
      summary.addHeading('Vulnerability Information', 4).addTable([
        [
          { data: 'Critical', header: true },
          { data: 'High', header: true },
          { data: 'Medium', header: true },
          { data: 'Low', header: true },
          { data: 'None', header: true }
        ],
        [
          `${ultimatePoll?.result?.uploadSummary?.vulnerabilityInfo?.critical}`,
          `${ultimatePoll?.result?.uploadSummary?.vulnerabilityInfo?.high}`,
          `${ultimatePoll?.result?.uploadSummary?.vulnerabilityInfo?.medium}`,
          `${ultimatePoll?.result?.uploadSummary?.vulnerabilityInfo?.low}`,
          `${ultimatePoll?.result?.uploadSummary?.vulnerabilityInfo?.none}`
        ]
      ])
    }
    if (actionArguments.fetchPackageInfo) {
      summary.addHeading('Package Information', 4).addTable([
        [
          { data: 'Stale', header: true },
          { data: 'Abandoned', header: true }
        ],
        [
          `${ultimatePoll?.result?.uploadSummary?.packageInfo?.abandoned}`,
          `${ultimatePoll?.result?.uploadSummary?.packageInfo?.abandoned}`
        ]
      ])
    }
    await summary.write()

    if (!doWaitForAdditionalInfo) {
      await core.summary
        .addSeparator()
        .addQuote(
          'ℹ️ Assert the fetchVulnerabilityInfo or fetchPackageInfo action inputs to retrieve vulnerability or package intelligence data.'
        )
        .write()
    }
  }
  core.setOutput('statusState', 'complete')
  return ultimatePoll
}

export async function _performStatus(
  statusUrl: URL,
  snSbomUser: string,
  snSbomPassword: string
): Promise<StatusApiResponseBody> {
  return await fetch(statusUrl, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(snSbomUser + ':' + snSbomPassword).toString('base64')}`
    }
  })
    .then(response => response.json())
    .then(data => data)
    .catch(error => {
      core.warning(`An error occurred while retrieving status of SBOM: ${error.message}`)
      throw error
    })
}
