'use strict';

const Assert = require('assert');
const Fs = require('fs');
const Path = require('path');
const Url = require('url');
const Graphi = require('graphi');
const CloudApi = require('./cloudapi');
const Package = require('../package.json');
const Routes = require('./routes');


const Schema = Fs.readFileSync(Path.join(__dirname, '/schema.graphql')).toString();

const setupCloudApi = ({ keyId, key, apiBaseUrl }) => {
  return (request, h) => {
    if (request.route.settings.auth === false) {
      return h.continue;
    }

    request.plugins.cloudapi = new CloudApi({
      token: request.auth && request.auth.credentials && request.auth.credentials.token,
      url: apiBaseUrl,
      keyId,
      key,
      log: request.log.bind(request)
    });

    return h.continue;
  };
};

const register = async (server, options = { regions: [], categories: [] }) => {
  Assert(options.apiBaseUrl, 'options.apiBaseUrl is required');
  Assert(options.keyId, 'options.keyId is required');
  Assert(options.keyPath, 'options.keyPath is required');

  const dcName = options.dcName || Url.parse(options.apiBaseUrl).host.split('.')[0];

  server.decorate('request', 'options', { dcName, regions, categories });
  server.route(Routes);

  const schema = Graphi.makeExecutableSchema({ schema: Schema });

  const graphiOptions = {
    graphiqlPath: process.env.NODE_ENV === 'development' ? '/graphiql' : options.graphiqlPath,
    schema,
    authStrategy: options.authStrategy
  };

  await server.register({ plugin: Graphi, options: graphiOptions });

  const key = Fs.readFileSync(options.keyPath);
  server.ext('onPostAuth', setupCloudApi({ key, ...options }));
};

module.exports = {
  pkg: Package,
  register
};
