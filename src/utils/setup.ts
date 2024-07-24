import * as core from '@actions/core'
import { StatusActionArguments, ActionSecretArguments } from '../types/action'

/**
 * Assembles the requisite input arguments provided to the GitHub Action.
 * @returns {*} An object of secret and public arguments.
 */
export function setup(): StatusActionArguments {
  core.debug(`Collecting run time arguments...`)
  let actionArguments = _actionArguments()

  core.info(`Action Arguments: ${JSON.stringify(actionArguments, null, 2)}`)

  return actionArguments
}

export function _secretArguments(): ActionSecretArguments {
  return {
    snSbomUser: core.getInput('snSbomUser'),
    snSbomPassword: core.getInput('snSbomPassword'),
    snInstanceUrl: core.getInput('snInstanceUrl')
  }
}

export function _actionArguments(): StatusActionArguments {
  let maxStatusPollAttempts = Number(core.getInput('maxStatusPollAttempts'))
  let statusAttemptInterval = Number(core.getInput('statusAttemptInterval'))
  maxStatusPollAttempts = maxStatusPollAttempts <= 0 ? 5 : maxStatusPollAttempts
  statusAttemptInterval = statusAttemptInterval <= 1000 ? 10000 : statusAttemptInterval

  let bomRecordId = core.getInput('bomRecordId')
  if (bomRecordId.trim().length === 0) {
    let failureMessage = 'The bomRecordId action input is empty. Please provide a valid bomRecordId.'
    core.setFailed(failureMessage)
    throw new Error(failureMessage)
  }

  return {
    secrets: _secretArguments(),
    fetchPackageInfo: core.getInput('fetchPackageInfo') === 'true',
    fetchVulnerabilityInfo: core.getInput('fetchVulnerabilityInfo') === 'true',
    maxStatusPollAttempts,
    statusAttemptInterval,
    bomRecordId
  }
}
