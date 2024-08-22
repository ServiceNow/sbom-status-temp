import * as core from '@actions/core'
import { setup } from '@/src/utils/setup'
import { validate } from '@/src/utils/validate'
import { SchemaType } from '@/src/types/schemas'
import { status } from '@/src/api/status'
import dotenv from 'dotenv'
dotenv.config()
export var process: NodeJS.Process

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    console.log("Hello Sourav")
    const actionArguments = setup()
    await validate(actionArguments, SchemaType.action_inputs)

    let statusOperationResponseObject = await status(actionArguments)
    if (statusOperationResponseObject == undefined) {
      return
    } // Time out case, status function handles failing action

    console.log('result', statusOperationResponseObject)
    core.setOutput('apiResponseObject', JSON.stringify(statusOperationResponseObject))
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
