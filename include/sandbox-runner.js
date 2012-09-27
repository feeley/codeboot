function print() {
  self.postMessage({kind: "output", value: Array.prototype.join.call(arguments, " ")});
}

function println() {
  self.postMessage({kind: "output", value: Array.prototype.join.call(arguments, "\n") + "\n"});
}

self.addEventListener('message', function(event) {
  var req = event.data;
  switch (req.kind) {
      case "script":
          try {
            var r = (function(_script) {
                var $self = self;
                var self = undefined;
                // We need direct eval here for it to pickup the local definition of 'self'
                var ret = eval(_script);
                return ret;
            }).call({}, req.value);
          } catch (e) {
            self.postMessage({kind: "error", value: e + ""});
          }
          self.postMessage({kind: "result", value: r});
          break;
  }
}, false);