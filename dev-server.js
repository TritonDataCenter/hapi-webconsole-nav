'use strict';

const Hapi = require('hapi');
const Navigation = require('.');


const { PORT = 3068 } = process.env;

const options = {
  datacenters: [
    {
      name: 'development',
      url: `http://127.0.0.1:${PORT}`
    }
  ],
  categories: [
    {
      name: 'Compute',
      slug: 'compute',
      services: [
        {
          name: 'VMs & Containers',
          slug: 'vms_containers',
          description: 'Run VMs and bare metal containers',
          url: '/instaces',
          tags: []
        }
      ]
    },
    {
      name: 'Help & Support',
      slug: 'help_support',
      services: [
        {
          name: 'Service Status',
          slug: 'service_status',
          description: 'Find out about the status of our services',
          url: '/status',
          tags: []
        }
      ]
    }
  ]
};

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
      options
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
