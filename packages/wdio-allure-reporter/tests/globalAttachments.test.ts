import path from 'node:path'
import { describe, it, expect, vi } from 'vitest'
import { temporaryDirectory } from 'tempy'

import AllureReporter from '../src/reporter.js'
import { events } from '../src/constants.js'
import { addGlobalAttachment, addGlobalAttachmentPath, addGlobalError, globalAttachment, globalAttachmentPath, globalError } from '../src/common/api.js'
import { clean, getGlobals, getResults } from './helpers/wdio-allure-helper.js'
import { cid as runnerCid, runnerEnd, runnerStart } from './__fixtures__/runner.js'
import { suiteEnd, suiteStart } from './__fixtures__/suite.js'
import { testPassed, testStart } from './__fixtures__/testState.js'

vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

describe('global attachments', () => {
    it('emits global_attachment_content runtime message when addGlobalAttachment is called', async () => {
        const outputDir = temporaryDirectory()
        const reporter = new AllureReporter({ outputDir })
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())

        let captured: { type: string; data?: Record<string, unknown> } | null = null
        const listener = (msg: { type: string; data?: Record<string, unknown> }) => {
            if (msg.type === 'global_attachment_content') { captured = msg }
        }
        process.on(events.runtimeMessage, listener)

        await addGlobalAttachment('global-log', 'hello from global', 'text/plain')

        process.off(events.runtimeMessage, listener)
        expect(captured).toBeDefined()
        expect(captured).toMatchObject({
            type: 'global_attachment_content',
            data: {
                name: 'global-log',
                contentType: 'text/plain',
                encoding: 'base64',
            },
        })
        expect((captured as { data: { content: string } }).data.content).toBe(Buffer.from('hello from global', 'utf-8').toString('base64'))
        clean(outputDir)
    })

    it('emits global_attachment_content when globalAttachment (allure-js-commons API) is called', async () => {
        const outputDir = temporaryDirectory()
        const reporter = new AllureReporter({ outputDir })
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())

        let captured: { type: string; data?: Record<string, unknown> } | null = null
        const listener = (msg: { type: string; data?: Record<string, unknown> }) => {
            if (msg.type === 'global_attachment_content') { captured = msg }
        }
        process.on(events.runtimeMessage, listener)
        await globalAttachment('commons-style-log', 'content', { contentType: 'text/plain' })
        process.off(events.runtimeMessage, listener)

        expect(captured).toBeDefined()
        expect(captured).toMatchObject({
            type: 'global_attachment_content',
            data: {
                name: 'commons-style-log',
                contentType: 'text/plain',
            },
        })
        clean(outputDir)
    })

    it('emits global_attachment_path message when addGlobalAttachmentPath is called', async () => {
        const outputDir = temporaryDirectory()
        const fs = await import('node:fs')
        const tmpFile = path.join(outputDir, 'global-source.txt')
        fs.writeFileSync(tmpFile, 'content from file', 'utf-8')

        const reporter = new AllureReporter({ outputDir })
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())

        let captured: { type: string; data?: Record<string, unknown> } | null = null
        const listener = (msg: { type: string; data?: Record<string, unknown> }) => {
            if (msg.type === 'global_attachment_path') { captured = msg }
        }
        process.on(events.runtimeMessage, listener)
        await addGlobalAttachmentPath('global-file-log', tmpFile, 'text/plain')
        process.off(events.runtimeMessage, listener)

        expect(captured).toBeDefined()
        expect(captured).toMatchObject({
            type: 'global_attachment_path',
            data: {
                name: 'global-file-log',
                path: tmpFile,
                contentType: 'text/plain',
            },
        })
        clean(outputDir)
    })

    it('emits global_attachment_path when globalAttachmentPath (allure-js-commons API) is called', async () => {
        const outputDir = temporaryDirectory()
        const fs = await import('node:fs')
        const tmpFile = path.join(outputDir, 'path-style.txt')
        fs.writeFileSync(tmpFile, 'path content', 'utf-8')

        const reporter = new AllureReporter({ outputDir })
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())

        let captured: { type: string; data?: { name: string } } | null = null
        const listener = (msg: { type: string; data?: { name: string } }) => {
            if (msg.type === 'global_attachment_path') { captured = msg }
        }
        process.on(events.runtimeMessage, listener)
        await globalAttachmentPath('path-style-att', tmpFile, { contentType: 'text/plain' })
        process.off(events.runtimeMessage, listener)

        expect(captured).toBeDefined()
        expect(captured!.data!.name).toBe('path-style-att')
        clean(outputDir)
    })

    it('processRuntimeMessage applies global messages (no error with active test)', async () => {
        const outputDir = temporaryDirectory()
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        await addGlobalAttachment('during-test-global', 'content', 'text/plain')
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)
        expect(results).toHaveLength(1)
        const testAttachments = (results[0].attachments ?? []).map((a: { name: string }) => a.name)
        expect(testAttachments).not.toContain('during-test-global')

        const globals = getGlobals(outputDir)
        if (Object.keys(globals).length > 0) {
            const globalNames = Object.values(globals).flatMap((g) => g.attachments.map((a) => a.name))
            expect(globalNames).toContain('during-test-global')
        }
        clean(outputDir)
    })

    it('global and test-level attachments are both recorded; global not in test result', async () => {
        const outputDir = temporaryDirectory()
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        reporter.addAttachment({ name: 'My attachment', content: '99thoughtz', type: 'text/plain' })
        await addGlobalAttachment('only-in-globals', 'global content', 'text/plain')
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)
        expect(results).toHaveLength(1)
        const testAttachmentNames = (results[0].attachments ?? []).map((a: { name: string }) => a.name)
        expect(testAttachmentNames).toContain('My attachment')
        expect(testAttachmentNames).not.toContain('only-in-globals')
        clean(outputDir)
    })

    it('global attachment works when called before any test (e.g. Mocha beforeAll or Cucumber Before)', async () => {
        const outputDir = temporaryDirectory()
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        await addGlobalAttachment('before-any-test', 'from setup', 'text/plain')
        reporter.onTestStart(testStart())
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)
        expect(results).toHaveLength(1)
        const globals = getGlobals(outputDir)
        if (Object.keys(globals).length > 0) {
            const names = Object.values(globals).flatMap((g) => g.attachments.map((a) => a.name))
            expect(names).toContain('before-any-test')
        }
        clean(outputDir)
    })
})

describe('global error', () => {
    it('emits global_error runtime message when addGlobalError is called', async () => {
        const outputDir = temporaryDirectory()
        const reporter = new AllureReporter({ outputDir })
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())

        let captured: { type: string; data?: Record<string, unknown> } | null = null
        const listener = (msg: { type: string; data?: Record<string, unknown> }) => {
            if (msg.type === 'global_error') { captured = msg }
        }
        process.on(events.runtimeMessage, listener)

        await addGlobalError({ message: 'setup failed', trace: 'at setup ()' })

        process.off(events.runtimeMessage, listener)
        expect(captured).toBeDefined()
        expect(captured).toMatchObject({
            type: 'global_error',
            data: {
                message: 'setup failed',
                trace: 'at setup ()',
            },
        })
        clean(outputDir)
    })

    it('emits global_error when globalError (allure-js-commons API) is called', async () => {
        const outputDir = temporaryDirectory()
        const reporter = new AllureReporter({ outputDir })
        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())

        let captured: { type: string; data?: Record<string, unknown> } | null = null
        const listener = (msg: { type: string; data?: Record<string, unknown> }) => {
            if (msg.type === 'global_error') { captured = msg }
        }
        process.on(events.runtimeMessage, listener)
        await globalError({ message: 'teardown error', trace: 'stack' })
        process.off(events.runtimeMessage, listener)

        expect(captured).toBeDefined()
        expect(captured).toMatchObject({
            type: 'global_error',
            data: {
                message: 'teardown error',
                trace: 'stack',
            },
        })
        clean(outputDir)
    })

    it('processRuntimeMessage applies global_error (full flow)', async () => {
        const outputDir = temporaryDirectory()
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        await addGlobalError({ message: 'global setup failed', trace: 'at globalSetup' })
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const { results } = getResults(outputDir)
        expect(results).toHaveLength(1)

        const globals = getGlobals(outputDir)
        if (Object.keys(globals).length > 0) {
            const allErrors = Object.values(globals).flatMap((g) => g.errors)
            const setupError = allErrors.find((e) => e.message === 'global setup failed')
            expect(setupError).toBeDefined()
            expect(setupError!.trace).toBe('at globalSetup')
        }
        clean(outputDir)
    })

    it('global error and global attachment can be used together', async () => {
        const outputDir = temporaryDirectory()
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        reporter.onTestStart(testStart())
        await addGlobalAttachment('setup-log', 'log content', 'text/plain')
        await addGlobalError({ message: 'setup failed', trace: 'stack' })
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const globals = getGlobals(outputDir)
        if (Object.keys(globals).length > 0) {
            const allAttachments = Object.values(globals).flatMap((g) => g.attachments)
            const allErrors = Object.values(globals).flatMap((g) => g.errors)
            expect(allAttachments.some((a) => a.name === 'setup-log')).toBe(true)
            expect(allErrors.some((e) => e.message === 'setup failed')).toBe(true)
        }
        clean(outputDir)
    })

    it('global error works when called before any test (e.g. Mocha beforeAll or Cucumber Before)', async () => {
        const outputDir = temporaryDirectory()
        const reporter = new AllureReporter({ outputDir })

        reporter.onRunnerStart(runnerStart())
        reporter.onSuiteStart(suiteStart())
        await addGlobalError({ message: 'beforeAll failed', trace: 'stack' })
        reporter.onTestStart(testStart())
        reporter.onTestPass(testPassed())
        reporter.onSuiteEnd(suiteEnd())
        await reporter.onRunnerEnd(runnerEnd())

        const globals = getGlobals(outputDir)
        if (Object.keys(globals).length > 0) {
            const allErrors = Object.values(globals).flatMap((g) => g.errors)
            expect(allErrors.some((e) => e.message === 'beforeAll failed')).toBe(true)
        }
        clean(outputDir)
    })
})
