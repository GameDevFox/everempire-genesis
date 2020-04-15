import needle from 'needle';

export default function ServerRestClient(serviceUrl, apiToken) {
  const url = path => {
    return serviceUrl + path;
  };

  const call = (method, path, data, options = {}) => {
    const headers = {};
    if(options.token)
      headers['Token'] = options.token; // eslint-disable-line dot-notation
    else
      headers['Api-Token'] = apiToken;

    if(options.asUser)
      headers['As-User'] = options.asUser;

    const callUrl = url(path);
    return needle(method, callUrl, data, { headers }).then(res => res.body);
  };

  return {
    call,
    url,
  };
}
