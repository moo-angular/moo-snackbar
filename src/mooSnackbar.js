import mdCompilerService from './mdCompilerService';

export default app => {
  app
     .service('$mdCompiler', ['$q', '$http', '$injector', '$compile', '$controller', '$templateCache', mdCompilerService])
     .factory('$mooSnackbar', ['$document', '$rootScope', '$q', '$compile', '$timeout', '$rootElement', '$animate', '$mdCompiler', MooSnackbarFactory]);
}
