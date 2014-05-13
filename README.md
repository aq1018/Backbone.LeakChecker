Backbone.LeakChecker
====================

Report leaky views in browser console.


## Installation

### npm

```
npm install backbone.leakchecker --save
```

### bower

```
bower install backbone.leakchecker --save
```

### component

Insert the following to the `dependencies` section of your `component.json`

```
"aq1018/backbone.leakchecker": ">= 0.0.1"
```

## Usage

### require.js

```js
// app.js
define('Backbone', 'backbone.leakchecker', function(Backbone, initLeakChecker) {
  // make sure this is run before everything else.
  initLeakChecker();

  // your Application class goes here
  function App(){

  }

  return new App();
});

```

### browserify

```js
// app.js

// make sure this is run before everything else.
require('backbone.leakchecker')();

// your Application class goes here
function App(){

}

module.exports = new App();
```

### <script> tag

```html
<!-- dependencies -->
<script type="text/javascript" src="jquery.js" />
<script type="text/javascript" src="underscore.js" />
<script type="text/javascript" src="backbone.js" />

<!-- this lib -->
<script type="text/javascript" src="backbone.leakchecker.js" />

<script>
  // do this first
  initLeakChecker();
</script>

<!-- include your app here -->
<script type="text/javascript" src="app.js" />
```
