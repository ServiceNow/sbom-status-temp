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
  return {
    secrets: _secretArguments(),
    bomRecordId: core.getInput('bomRecordId'),
    maxStatusPollAttempts: Number(core.getInput('maxStatusPollAttempts')) ?? 5,
    statusAttemptInterval: Number(core.getInput('statusAttemptInterval')) ?? 10000,
    fetchPackageInfo: core.getInput('fetchPackageInfo') === 'true',
    fetchVulnerabilityInfo: core.getInput('fetchVulnerabilityInfo') === 'true'
  }
}
