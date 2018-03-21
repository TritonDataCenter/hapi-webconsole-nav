'use strict';

const Hapi = require('hapi');
const Navigation = require('.');


const { PORT = 3068 } = process.env;
const MockData = require('./test/mock-data.json');

const options = Object.assign(MockData, {
  regions: MockData.regions.map((region) => {
    return Object.assign(region, {
      datacenters: region.datacenters.map((dc) => {
        return Object.assign(dc, {
          url: `http://127.0.0.1:${PORT}`
        });
      })
    });
  })
});

const server = Hapi.server({
  port: PORT,
  debug: {
    request: ['error']
  }
});

async function main () {
  await server.register([
    {
      plugin: Navigation,
      options,
      routes: {
        prefix: '/navigation'
      }
    }
  ]);

  await server.start();
  console.log(`server started at http://localhost:${server.info.port}`);
}

process.on('unhandledRejection', (err) => {
  server.log(['error'], err);
  console.error(err);
});

main();
