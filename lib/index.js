'use strict';

const Assert = require('assert');
const Fs = require('fs');
const Path = require('path');
const Url = require('url');
const CloudApi = require('webconsole-cloudapi-client');
const Package = require('../package.json');
const Routes = require('./routes');


const Schema = Fs.readFileSync(Path.join(__dirname, '/schema.graphql')).toString();

const setupCloudApi = ({ keyId, key, apiBaseUrl }) => {
  return ({ auth, log }) => {
    return new CloudApi({
      token: auth.credentials && auth.credentials.token,
      url: apiBaseUrl,
      keyId,
      key,
      log
    });
  };
};

const postAuth = (cloudapi) => {
  return (request, h) => {
    if (request.route.settings.auth === false) {
      return h.continue;
    }

    request.plugins.cloudapi = cloudapi({ auth: request.auth, log: request.log.bind(request) });

    return h.continue;
  };
};

const register = (server, options = {}) => {
  Assert(options.apiBaseUrl, 'options.apiBaseUrl is required');
  Assert(options.keyId, 'options.keyId is required');
  Assert(options.keyPath, 'options.keyPath is required');
  Assert(options.baseUrl, 'options.baseUrl is required');

  server.dependency('hapi-triton-auth');
  server.dependency('graphi');

  const { regions = [], categories = [], accountServices = [] } = options;
  const dcName = options.dcName || Url.parse(options.baseUrl).host.split('.')[0];

  const formattedCategories = categories.map((category) => {
    const services = category.services.map((service) => {
      const baseUrl = Url.parse(options.baseUrl);
      baseUrl.pathname = service.path || baseUrl.pathname;
      const url = service.url || Url.format(baseUrl);

      return {
        name: service.name,
        slug: service.slug,
        description: service.description,
        tags: service.tags,
        url
      };
    });

    return {
      name: category.name,
      slug: category.slug,
      services
    };
  });

  const key = Fs.readFileSync(options.keyPath);
  const schema = server.makeExecutableSchema({ schema: Schema });
  server.registerSchema({ schema });

  server.decorate('request', 'options', { dcName, regions, categories: formattedCategories, accountServices });
  server.route(Routes);

  const cloudapi = setupCloudApi({ key, ...options });
  server.ext({ type: 'onPostAuth', method: postAuth(cloudapi), options: { sandbox: 'plugin' } });
};

module.exports = {
  pkg: Package,
  register
};
