let $mooSnackbar = function MooSnackbarFactory($document, $rootScope, $q, $compile, $timeout, $rootElement, $animate, $mdCompiler) {
  let snackbarEventStack = [],
    service;

  return service = {
    show: show,
    cancel: cancel,
    hide: hide
  };

  function show(options) {
    if (snackbarEventStack.length) {
      return service.cancel().then(function() {
        debugger;
        return show(options);
      });
    } else {
      var interimElement = new InterimElement(options);
      snackbarEventStack.push(interimElement);
      return interimElement.show().then(function() {
        return interimElement.deferred.promise;
      });
    }
  }

  function hide(response) {
    var interimElement = snackbarEventStack.shift();
    return interimElement && interimElement.remove().then(function() {
      interimElement.deferred.resolve(response);
    });
  }

  function cancel(reason) {
    var interimElement = snackbarEventStack.shift();
    return $q.when(interimElement && interimElement.remove().then(function() {
      interimElement.deferred.reject(reason);
    }));
  };

  function InterimElement(options) {
    var self;
    var hideTimeout, element, showDone, removeDone;

    options = options || {};
    options = angular.extend({
      preserveScope: false,
      scope: options.scope || $rootScope.$new(options.isolateScope),
      onShow: function(scope, element, options) {
        return $animate.enter(element, options.parent);
      },
      onRemove: function(scope, element, options) {
        // Element could be undefined if a new element is shown before
        // the old one finishes compiling.
        return element && $animate.leave(element) || $q.when();
      }
    }, options);

    if (options.template) {
      options.template = angular.identity(options.template);
    }

    return self = {
      options: options,
      deferred: $q.defer(),
      show: function() {
        var compilePromise;
        if (options.skipCompile) {
          compilePromise = $q(function(resolve) {
            resolve({
              locals: {},
              link: function() {
                return options.element;
              }
            });
          });
        } else {
          compilePromise = $mdCompiler.compile(options);
        }

        return showDone = compilePromise.then(function(compileData) {
          angular.extend(compileData.locals, self.options);

          element = compileData.link(options.scope);

          // Search for parent at insertion time, if not specified
          if (angular.isFunction(options.parent)) {
            options.parent = options.parent(options.scope, element, options);
          } else if (angular.isString(options.parent)) {
            options.parent = angular.element($document[0].querySelector(options.parent));
          }

          // If parent querySelector/getter function fails, or it's just null,
          // find a default.
          if (!(options.parent || {}).length) {
            options.parent = $rootElement.find('body');
            if (!options.parent.length) options.parent = $rootElement;
          }
          var ret = options.onShow(options.scope, element, options);
          return $q.when(ret)
            .then(function() {
              // Issue onComplete callback when the `show()` finishes
              (options.onComplete || angular.noop)(options.scope, element, options);
              startHideTimeout();
            });

          function startHideTimeout() {
            if (options.hideDelay) {
              hideTimeout = $timeout(service.cancel, options.hideDelay);
            }
          }
        }, function(reason) {
          showDone = true;
          self.deferred.reject(reason);
        });
      },
      cancelTimeout: function() {
        if (hideTimeout) {
          $timeout.cancel(hideTimeout);
          hideTimeout = undefined;
        }
      },
      remove: function() {
        self.cancelTimeout();
        return removeDone = $q.when(showDone).then(function() {
          var ret = element ? options.onRemove(options.scope, element, options) : true;
          return $q.when(ret).then(function() {
            if (!options.preserveScope) options.scope.$destroy();
            removeDone = true;
          });
        });
      }
    };
  }
}

export default $mooSnackbar;


