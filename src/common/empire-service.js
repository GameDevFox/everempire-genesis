import _ from 'lodash';

import ArrayTemplate from './array-template';

export default function EmpireService(restService) {
  /* eslint-disable no-template-curly-in-string */
  const calls = {
    getProviders: 'GET:/auth/providers',
    getWorlds: 'GET:/worlds',
    getMe: 'GET:/me',
    renewToken: 'GET:/me/token',
    deleteToken: 'DELETE:/me/token',
    createWorld: 'POST:/me/world',
    destroyWorld: 'DELETE:/me/world/${id}',
    getMyWorlds: 'GET:/me/worlds'
  };
  /* eslint-enable no-template-curly-in-string */

  const result = _.mapValues(calls, value => {
    const [method, path] = value.split(':');
    const pathT = ArrayTemplate(path);

    return function() {
      const argCount = pathT.argCount;
      const data = arguments[argCount];
      const options = arguments[argCount + 1];

      const path = pathT(arguments);
      return restService.call(method, path, data, options);
    };
  });

  return result;
}
