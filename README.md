# noise-to-scroll
A JavaScript library for browsers that allows users to scroll by making noise with their microphones.

This library uses the Web Audio API (see <https://developer.mozilla.org/fr/docs/Web/API/Web_Audio_API>).

[![Image from Gyazo](https://i.gyazo.com/afe5a1feab8c65d00c6186505aff21ae.gif)](https://gyazo.com/afe5a1feab8c65d00c6186505aff21ae)

**Demo:** https://codepen.io/synx0x/full/qBBZqON
## Installation

```bash
npm install noise-to-scroll
```

## Usage

### CDN
```html
<html>
  <head>
    ...
  </head>
  <body>
    ...
    <script src="https://unpkg.com/noise-to-scroll/dist/noise-to-scroll.min.js"></script>
    <script>
        noiseToScroll({scrollableContainer: document.querySelector('#myScrollableElement')})
            .start()
            .then(() => {
                console.log('make some noise to scroll!');
            });
    </script>
  </body>
</html>
```

### With a module bundler

```javascript
import { nts } from 'noise-to-scroll'; // es6 import style or basic require

nts({scrollableContainer: document.querySelector('#myScrollableElement')})
    .start()
    .then(() => {
        console.log('make some noise to scroll!');
    });
```

This library is also compatible with AMD loading.

The minified javascript file in the `/dist` folder is built with webpack with `libraryTarget` set to `umd` (see <https://webpack.js.org/configuration/output/#outputlibrarytarget>).

## API

### Constructor `noiseToScroll({options})`

The `options` parameter is not required and has default values.

| param               | type                    | default                                   | detail                                                                                                                |
|---------------------|-------------------------|-------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| scrollableContainer | HTMLElement&#124;Object | `window`                                  | The HTML element (or object) that is scrollable, the method `.scrollBy({options})` will be used on it for the scroll. |
| scrollMethod        | String                  | `scrollBy`                                | Method called on the `scrollableContainer`.                                                                           |
| scrollTop*          | Number&#124;Function    | `window.innerHeight * 0.65`               | Value of the top scroll.                                                                                              |
| scrollLeft*         | Number&#124;Function    | `0`                                       | Value of the left scroll.                                                                                             |
| scrollBehavior*     | String&#124;Function    | `smooth`                                  | Behavior of the scroll.                                                                                               |
| scrollOptions*      | Object&#124;Function    | `{scrollTop, scrollLeft, scrollBehavior}` | Option object passed to the `scrollMethod` method.                                                                    |
| scrollDebounce      | Number                  | `100`                                     | Number of milliseconds passed on the debounce for the scroll function.                                                |
| debug               | Boolean&#124;String     | `false`                                   | Enable debug logs, can also pass the method to call on the `console` object (`console[debug]`).                       |
| clipLag             | Number                  | `150`                                     | Number of milliseconds of timeout after the end of a detected noticeable noise.                                       |
| clipLevel           | Number                  | `0.8`                                     | Level of 'volume' on which the scroll event will trigger. `0 < clipLevel < 1`                                         |

* (*) Function type in some parameters are designed mainly to re-evaluate a value but you can also use it to process custom values in your apps. Those function params are called on each scroll.

**Note:** You can access and update at any time the options object by getting the instance returned by the constructor and use the `params` property (eg: `noiseToScroll({options}).params.scrollableContainer = document.body`).
### `start()`

Returns a Promise that is resolved if the browser supports the `mediaDevices`, `AudioContext` and if the user accepts to allow microphone on the web page.

Rejected if unsupported or user denied to allow microphone. 

The Promise might not be resolved or rejected if the user doesn't answer the permission popup.

```javascript
noiseToScroll()
    .start()
    .then(() => {
        console.log('browser support OK and user allowed microphone access'); // noiseToScroll is up and running
    })
    .catch((error) => {
        console.log(`unable to start noiseToScroll: ${error}`); // error contain the reason
    )};
```

### `detect()`

Returns a Promise that is resolved if the browser supports `mediaDevices` and `AudioContext`.

Rejected if unsupported.

```javascript
noiseToScroll()
    .detect()
    .then(() => {
        console.log('browser support OK'); // ready to start
    })
    .catch((error) => {
        console.log(`browser doesn't support: ${error}`);
    )};
```

### `stop()`

Method used to stop the audio processing and so the 'noiseToScroll'.

```javascript
let nts = noiseToScroll();
nts.start()
    .then(() => {
        console.log('browser support OK and user allowed microphone access'); // noiseToScroll is up and running
    })
    .catch((error) => {
        console.log(`unable to start noiseToScroll: ${error}`); // error contain the reason
    )};
    
    // later on the code on a button click for example
    nts.stop();
    
    // resume it later
    nts.start();
```

### `on('event', listener)`

Listen to the following events :

- clipping : fired when a noise becomes noticeable according to `clipLevel`, no debounce, event is fired 100 times each seconds, listen carefully!
- scroll : fired every time the `scrollBy` method is called on the `scrollableContainer`.
- noise : similar to `scroll` event but the first param passed to the listener is the 'volume' that triggered the scroll.

`.on()` methods can be chained.

```javascript
noiseToScroll()
    .on('noise', (volume) => {
        console.log(`volume ${volume} triggered the scroll!`);
    });
```