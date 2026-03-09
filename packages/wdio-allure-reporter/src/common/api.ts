import type { StepContext } from 'allure-js-commons'
import {
    allureId,
    attachment as allureAttachment,
    ContentType,
    description,
    descriptionHtml,
    epic,
    feature,
    globalAttachment as allureGlobalAttachment,
    globalAttachmentPath as allureGlobalAttachmentPath,
    globalError as allureGlobalError,
    historyId,
    issue,
    label,
    link,
    owner,
    parameter,
    parentSuite,
    severity,
    Status,
    step as allureStep,
    story,
    subSuite,
    suite,
    tag,
    testCaseId,
    tms
} from 'allure-js-commons'
import { events } from '../constants.js'

// @ts-ignore
/**
 * Call reporter
 * @param {string} event  - event name
 * @param {object} msg - event payload
 * @private
 */

// @ts-ignore
const tellReporter = (event: string, msg: never = {}) => {
    process.emit(event as never, msg)
}

/**
 * Assign label to test
 * @name addLabel
 * @param {string} name - label name
 * @param {string} value - label value
 */
export function addLabel (name: string, value: string) {
    label(name, value)
}

/**
 * Assign link to test
 * @name addLink
 * @param {string} url - link name
 * @param {string} [name] - link name
 * @param {string} [type] - link type
 */
export async function addLink(url: string, name?: string, type?: string) {
    await link(url, name, type)
}

/**
 * Assign allure id label to test to link test to existing entity inside the test ops
 * @name addAllureId
 * @param {string} id - inner allure test ops id
 */
export async function addAllureId(id: string) {
    await allureId(id)
}

/**
 * Assign feature to test
 * @name addFeature
 * @param {(string)} featureName - feature name or an array of names
 */
export async function addFeature (featureName: string) {
    await feature(featureName)
}

/**
 * Assign severity to test
 * @name addSeverity
 * @param {string} value - severity value
 */
export async function addSeverity (value: string) {
    await severity(value)
}

/**
 * Assign issue id to test
 * @name addIssue
 * @param {string} id - issue id value
 */
export async function addIssue (id: string) {
    await issue(id)
}

/**
 * Assign TMS test id to test
 * @name addTestId
 * @param {string} testId - test id value
 */
export async function addTestId (testId: string) {
    await tms(testId)
}

/**
 * Assign story label to test
 * @name addStory
 * @param {string} storyName - story name for test
 */
export async function addStory (storyName: string) {
    await story(storyName)
}

/**
 * Assign suite label to test
 * @name addSuite
 * @param {string} suiteName - story name for test
 */
export async function addSuite(suiteName: string) {
    await suite(suiteName)
}

/**
 * Assign parent suite label to test
 * @name addParentSuite
 * @param {string} suiteName - suite name
 */
export async function addParentSuite(suiteName: string) {
    await parentSuite(suiteName)
}

/**
 * Assign sub-suite label to test
 * @name addSubSuite
 * @param {string} suiteName - sub-suite name
 */
export async function addSubSuite(suiteName: string) {
    await subSuite(suiteName)
}

/**
 * Assign epic label to test
 * @name addEpic
 * @param {string} epicName - the epic name
 */
export async function addEpic(epicName: string) {
    await epic(epicName)
}

/**
 * Assign owner label to test
 * @name addOwner
 * @param {string} ownerName - the owner name
 */
export async function addOwner(ownerName: string) {
    await owner(ownerName)
}

/**
 * Assign tag label to test
 * @name addTag
 * @param {string} tagName - the tag name
 */
export async function addTag(tagName: string) {
    await tag(tagName)
}

/**
 * Add environment value
 * @name addEnvironment
 * @deprecated addEnvironment is deprecated. Use reportedEnvironmentVars in config instead.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function addEnvironment (name: string, value: string) {
    console.warn('⚠️ addEnvironment is deprecated and has no longer any functionality. Use reportedEnvironmentVars in wdio config instead. Read more in https://webdriver.io/docs/allure-reporter.')
}

/**
 * Assign test description to test
 * @name addDescription
 * @param {string} descriptionText - description for test
 * @param {string} descriptionType - description type 'text'\'html'\'markdown'
 */
export async function addDescription (descriptionText: string, descriptionType?: string) {
    if (descriptionType === 'html') {
        await descriptionHtml(descriptionText)
        return
    }

    await description(descriptionText)
}

/**
 * Add attachment
 * @name addAttachment
 * @param {string} name         - attachment file name
 * @param {*} content           - attachment content
 * @param {string=} type        - attachment mime type
 */
export async function addAttachment (name: string, content: string | Buffer | object, type: string) {
    if (content instanceof Buffer) {
        await allureAttachment(name, content, type)
        return
    }

    const contentString = typeof content === 'string' ? content : JSON.stringify(content)

    await allureAttachment(name, contentString, type)
}

/**
 * Add additional argument to test
 * @name addArgument
 * @param {string} name - argument name
 * @param {string} value - argument value
 */
export async function addArgument (name: string, value: string) {
    await parameter(name, value)
}

/**
 * Add history id to the test, which won't be re-calculated in the end
 * @name addHistoryId
 * @param {string} id - history id
 */
export async function addHistoryId (id: string) {
    await historyId(id)
}

/**
 * Add test case id to the test, which won't be re-calculated in the end
 * @name addTestCaseId
 * @param {string} id - test case id
 */
export async function addTestCaseId (id: string) {
    await testCaseId(id)
}

/**
 * Start allure step
 * @name startStep
 * @param {string} title - step name in report
 */
export async function startStep (title: string) {
    // @ts-ignore
    tellReporter(events.startStep, title)
}

/**
 * End current allure step
 * @name endStep
 * @param {status} [status='passed'] - step status
 */
export async function endStep (status: Status = Status.PASSED) {
    if (!Object.values(Status).includes(status)) {
        throw new Error(`Step status must be ${Object.values(Status).join(' or ')}. You tried to set "${status}"`)
    }
    // @ts-ignore
    tellReporter(events.endStep, status)
}

/**
 * Create allure step
 * @name addStep
 * @param {string} title - step name in report
 * @param {object} [attachment={}] - attachment for step
 * @param {string} attachment.content - attachment content
 * @param {string} [attachment.name='attachment'] - attachment name
 * @param {string} [attachment.type='text/plain'] - attachment type
 * @param {string} [status='passed'] - step status
 */
export async function addStep (
    title: string,
    attachment: { content: string, name?: string, type?: ContentType } | undefined = undefined,
    status: Status = Status.PASSED
) {
    if (!Object.values(Status).includes(status)) {
        throw new Error(`Step status must be ${Object.values(Status).join(' or ')}. You tried to set "${status}"`)
    }

    // @ts-ignore
    tellReporter(events.startStep, title)

    if (attachment?.content) {
        await allureAttachment(
            attachment.name || 'Attachment',
            Buffer.from(attachment.content, 'utf8'),
            attachment.type || ContentType.TEXT,
        )
    }

    // @ts-ignore
    tellReporter(events.endStep, status)
}

/**
/**
 * Starts allure step execution with any content
 * Can be used to generate any hierarchy of steps
 * @example
 * ```js
 * await step("foo", async (context) => {
 *   await step("bar", async (context) => {
 *     await step("baz", async (context) => {
 *       // ...
 *     })
 *   })
 * })
 * ```
 * @param {string} name - the step name
 * @param {(context: StepContext) => T | Promise<T>} body - the step content function
 */
export async function step<T = void>(name: string, body: (context: StepContext) => T | Promise<T>): Promise<T> {
    return allureStep(name, body)
}

/**
 * Add global attachment (appears in report globals, not tied to a specific test).
 * Re-export from allure-js-commons.
 * @name addGlobalAttachment
 */
export async function addGlobalAttachment (
    name: string,
    content: string | Buffer,
    typeOrOptions: string | { contentType?: string; fileExtension?: string }
) {
    return allureGlobalAttachment(name, content, typeOrOptions as Parameters<typeof allureGlobalAttachment>[2])
}

/**
 * Add global attachment from file path. Re-export from allure-js-commons.
 * @name addGlobalAttachmentPath
 */
export async function addGlobalAttachmentPath (
    name: string,
    filePath: string,
    typeOrOptions: string | { contentType?: string; fileExtension?: string }
) {
    return allureGlobalAttachmentPath(name, filePath, typeOrOptions as Parameters<typeof allureGlobalAttachmentPath>[2])
}

/** Re-export from allure-js-commons */
export const globalAttachment = allureGlobalAttachment

/** Re-export from allure-js-commons */
export const globalAttachmentPath = allureGlobalAttachmentPath

/**
 * Add global error (appears in report globals, e.g. setup/teardown failures).
 * Re-export from allure-js-commons.
 * @name addGlobalError
 * @param {object} details - { message?: string, trace?: string, actual?: string, expected?: string }
 */
export async function addGlobalError (details: { message?: string; trace?: string; actual?: string; expected?: string }) {
    return allureGlobalError(details)
}

/** Re-export from allure-js-commons: globalError({ message, trace }) */
export const globalError = allureGlobalError

export default {
    addLabel,
    addLink,
    addAllureId,
    addFeature,
    addSeverity,
    addIssue,
    addTestId,
    addStory,
    addSuite,
    addParentSuite,
    addSubSuite,
    addEpic,
    addOwner,
    addTag,
    addEnvironment,
    addDescription,
    addAttachment,
    startStep,
    endStep,
    addStep,
    addArgument,
    step,
    addGlobalAttachment,
    addGlobalAttachmentPath,
    globalAttachment,
    globalAttachmentPath,
    addGlobalError,
    globalError
}
