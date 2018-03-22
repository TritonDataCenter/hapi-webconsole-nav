'use strict';

const Url = require('url');
const Hapi = require('hapi');
const Sso = require('hapi-triton-auth');
const Navigation = require('.');


const {
  COOKIE_PASSWORD,
  COOKIE_DOMAIN,
  SDC_KEY_PATH,
  SDC_ACCOUNT,
  SDC_KEY_ID,
  SDC_URL,
  BASE_URL = 'http://0.0.0.0:3068',
  DC_NAME
} = process.env;


const MockData = require('./test/mock-data.json');
const options = Object.assign(MockData, {
  regions: MockData.regions.map((region) => {
    return Object.assign(region, {
      datacenters: region.datacenters.map((dc) => {
        return Object.assign(dc, {
          url: 'http://127.0.0.1:3068'
        });
      })
    });
  }),
  authStrategy: 'sso',
  keyPath: SDC_KEY_PATH,
  keyId: '/' + SDC_ACCOUNT + '/keys/' + SDC_KEY_ID,
  apiBaseUrl: SDC_URL,
  dcName: DC_NAME || Url.parse(SDC_URL).host.split('.')[0]
});

const server = Hapi.server({
  port: 3068,
  routes: {
    cors: {
      origin: ['*'],
      credentials: true,
      additionalHeaders: ['Cookie', 'X-CSRF-Token']
    }
  },
  debug: {
    log: ['error'],
    request: ['error']
  }
});

server.events.on('log', (event, tags) => {
  if (tags.error) {
    console.log(event);
  }
});

server.events.on('request', (request, event) => {
  const { tags } = event;
  if (tags.includes('error') && event.data && event.data.errors) {
    event.data.errors.forEach((error) => {
      console.log(error);
    });
  }
});

async function main () {
  await server.register([
    {
      plugin: Sso,
      options: {
        keyPath: SDC_KEY_PATH,
        keyId: '/' + SDC_ACCOUNT + '/keys/' + SDC_KEY_ID,
        apiBaseUrl: SDC_URL,
        ssoUrl: 'https://sso.joyent.com/login',
        permissions: { 'cloudapi': ['/my/*'] },
        baseUrl: BASE_URL,
        isDev: true,
        cookie: {
          password: COOKIE_PASSWORD,
          domain: COOKIE_DOMAIN,
          isSecure: false,
          isHttpOnly: true,
          ttl: 1000 * 60 * 60       // 1 hour
        }
      }
    },
    {
      plugin: Navigation,
      options,
      routes: {
        prefix: '/navigation'
      }
    }
  ]);

  server.auth.default('sso');

  await server.start();
  console.log(`server started at http://localhost:${server.info.port}`);
}

process.on('unhandledRejection', (err) => {
  console.error(err);
});

main();
