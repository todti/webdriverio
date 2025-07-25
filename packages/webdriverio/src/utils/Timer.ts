const TIMEOUT_ERROR = 'timeout'
const NOOP = () => {}

/**
 * Promise-based Timer. Execute fn every tick.
 * When fn is resolved — timer will stop
 * @param {number} delay - delay between ticks
 * @param {number} timeout - after that time timer will stop
 * @param {Function} fn - function that returns promise. will execute every tick
 * @param {boolean} leading - should be function invoked on start
 * @return {promise} Promise-based Timer.
 */
class Timer {
    #retPromise: Promise<boolean>
    private _conditionExecutedCnt = 0
    private _resolve: Function = NOOP
    private _reject: Function = NOOP

    private _startTime?: number
    private _ticks = 0
    private _timeoutId?: NodeJS.Timeout
    private _mainTimeoutId?: NodeJS.Timeout
    private _lastError?: Error

    constructor (
        private _delay: number,
        private _timeout: number,
        private _fn: Function,
        private _leading = false,
        private _signal?: AbortSignal
    ) {
        this.#retPromise = new Promise<boolean>((resolve, reject) => {
            this._resolve = resolve
            this._reject = reject
        })

        this._start()
    }

    then (thennable?: (result: boolean) => void, catchable?: (reason: Error) => boolean) {
        return this.#retPromise.then(thennable, catchable)
    }

    catch<ReturnValue> (catchable?: (reason: Error) => ReturnValue): Promise<ReturnValue> {
        return this.#retPromise.catch(catchable) as Promise<ReturnValue>
    }

    private _start () {
        this._startTime = Date.now()
        if (this._leading) {
            this._tick()
        } else {
            this._timeoutId = setTimeout(this._tick.bind(this), this._delay)
        }

        if (this._wasConditionExecuted()) {
            return
        }

        this._mainTimeoutId = setTimeout(() => {
            /**
             * make sure that condition was executed at least once
             */
            if (!this._wasConditionExecuted()) {
                return
            }

            const reason = this._lastError || new Error(TIMEOUT_ERROR)
            this._reject(reason)
            this._stop()
        }, this._timeout)
    }

    private _stop () {
        if (this._timeoutId) {
            clearTimeout(this._timeoutId)
        }
        delete this._timeoutId
    }

    private _stopMain () {
        if (this._mainTimeoutId) {
            clearTimeout(this._mainTimeoutId)
        }
    }

    private _tick () {
        try {
            const result = this._fn()

            if (!result) {
                return this._checkCondition(new Error(TIMEOUT_ERROR))
            }

            if (typeof result.then !== 'function') {
                return this._checkCondition(undefined, result)
            }

            result.then(
                (res: unknown) => this._checkCondition(undefined, res),
                (err: Error) => this._checkCondition(err)
            )
        } catch (err) {
            return this._checkCondition(err as Error)
        }
    }

    private _checkCondition (err?: Error, res?: unknown) {
        this._lastError = err

        /**
         * If the signal is aborted, reject the promise with the last error or a new error
         * and stop the timer
         */
        if (this._signal?.aborted) {
            this._reject(this._lastError || new Error('Aborted'))
            this._stop()
            this._stopMain()
            return
        }

        ++this._conditionExecutedCnt

        // resolve timer only on truthy values
        if (res) {
            this._resolve(res)
            this._stop()
            this._stopMain()
            return
        }

        // autocorrect timer
        const diff = (Date.now() - (this._startTime || 0)) - (this._ticks++ * this._delay)
        const delay = Math.max(0, this._delay - diff)

        // clear old timeoutID
        this._stop()

        // check if we have time to one more tick
        if (this._hasTime(delay)) {
            this._timeoutId = setTimeout(this._tick.bind(this), delay)
        } else {
            this._stopMain()
            const reason = this._lastError || new Error(TIMEOUT_ERROR)
            this._reject(reason)
        }
    }

    private _hasTime (delay: number) {
        return (Date.now() - (this._startTime || 0) + delay) <= this._timeout
    }

    private _wasConditionExecuted () {
        return this._conditionExecutedCnt > 0
    }
}

export default Timer
