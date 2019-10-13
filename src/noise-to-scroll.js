module.exports = (params) => {
    params = params || {};

    if (params.constructor.name !== 'Object') {
        throw new Error(`Expected parameter to be an Object, found instead: ${params.constructor.name}`);
    }

    const self = this;
    let audioContext;
    let mediaStreamSource = null;
    let meter = null;

    params.clipLevel = params.clipLevel || 0.8;
    params.averaging = params.averaging || 0.95;
    params.clipLag = params.clipLag || 150;
    params.scrollableContainer = params.scrollableContainer || window;
    params.scrollDebounce = params.scrollDebounce || 100;
    params.scrollMethod = params.scrollMethod|| 'scrollBy';
    params.scrollTop = params.scrollTop || function () {
        return window.innerHeight * 0.65
    };
    params.scrollLeft = params.scrollLeft || function () {
        return 0;
    };
    params.scrollBehavior = params.scrollBehavior || function () {
        return 'smooth';
    };
    params.scrollByOptions = params.scrollByOptions || function () {
        return {
            top: params.scrollTop(),
            left: params.scrollLeft(),
            behavior: params.scrollBehavior()
        };
    };

    self.eventsListeners = {};
    self.volume = 0;

    self.debug = function () {
        if (params.debug) {
            // prefix first param if string
            arguments[0] = typeof(arguments[0]) === 'string' ? `[noiseToScroll debug] ${arguments[0]}` : arguments[0];
            // handle custom method use
            console[params.debug === true ? 'debug' : params.debug].apply(null, arguments);
        }
    };

    ['scrollByOptions', 'scrollBehavior', 'scrollTop', 'scrollLeft']
        .forEach((param) => {
            // convert non-function param to function returning the param
            if (typeof(params[param]) !== 'function') {
                let val = params[param];
                self.debug(`converted param '${param}' to function returning`, val);
                params[param] = () => val;
            }
        });

    self.debug(`noiseToScroll initialized with params`, params);

    self.onClipping = () => {
        if (params.scrollableContainer) self.scroll();
        triggerListeners('clipping', [self.volume]);
    };

    self.scroll = debounce(() => {
        self.debug(`.${params.scrollMethod}() fired with parameter`, params.scrollByOptions());
        params.scrollableContainer[params.scrollMethod](params.scrollByOptions());
        triggerListeners('scroll', []);
        triggerListeners('noise', [self.volume]);
    }, params.scrollDebounce);

    self.detect = () => {
        return new Promise(function (resolve, reject) {
            try {
                new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                return reject('audioContext not supported');
            }
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return reject('mediaDevices not supported');
            }
            resolve(self);
        }).then(() => {
            self.debug('browser is supporting AudioContext and mediaDevices');
        }).catch((reason) => {
            self.debug('browser doesn\'t support noiseToScroll', reason);
            throw reason;
        });
    };

    self.start = function () {
        return self.detect()
            .then(function () {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                return audioContext.resume()
                    .then(() => navigator.mediaDevices.getUserMedia({audio: true}))
                    .then(function (stream) {
                        mediaStreamSource = audioContext.createMediaStreamSource(stream);
                        meter = createAudioMeter(audioContext);
                        mediaStreamSource.connect(meter);
                        return self;
                    });
            });
    };

    self.on = (event, listener) => {
        if (!self.eventsListeners[event]) self.eventsListeners[event] = [];
        self.eventsListeners[event].push(listener);
        return self;
    };

    function triggerListeners (event, args) {
        if (!self.eventsListeners[event]) return;
        self.eventsListeners[event].forEach((listener) => {
            listener.apply(null, args);
        });
    }

    function debounce(func, wait, immediate) {
        let timeout;
        return function() {
            let context = this,
                args = arguments;
            let later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            let callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    // credit: https://stackoverflow.com/a/51859377
    function createAudioMeter(audioContext) {
        let processor = audioContext.createScriptProcessor(512);
        processor.onaudioprocess = volumeAudioProcess;
        processor.clipping = false;
        processor.lastClip = 0;

        // this will have no effect, since we don't copy the input to the output,
        // but works around a current Chrome bug.
        processor.connect(audioContext.destination);

        processor.checkClipping = function () {
            if (!this.clipping) {
                return false;
            }
            if ((this.lastClip + params.clipLag) < window.performance.now()) {
                this.clipping = false;
            }
            return this.clipping;
        };

        self.stop = () => {
            processor.disconnect();
            processor.onaudioprocess = null;
        };

        return processor;
    }

    // credit: https://stackoverflow.com/a/51859377
    function volumeAudioProcess(event) {
        const buf = event.inputBuffer.getChannelData(0);
        const bufLength = buf.length;
        let sum = 0;
        let x;

        // Do a root-mean-square on the samples: sum up the squares...
        for (let i = 0; i < bufLength; i++) {
            x = buf[i];
            if (Math.abs(x) >= params.clipLevel) {
                this.clipping = true;
                this.lastClip = window.performance.now()
            }
            sum += x * x;
        }

        // ... then take the square root of the sum.
        const rms = Math.sqrt(sum / bufLength);

        if (this.checkClipping()) {
            self.onClipping();
        }

        // Now smooth this out with the averaging factor applied
        // to the previous sample - take the max here because we
        // want "fast attack, slow release."
        self.volume = Math.max(rms, self.volume * params.averaging);

        return self.volume;
    }

    return self;
};