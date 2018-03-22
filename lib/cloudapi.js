'use strict';

const Assert = require('assert');
const Crypto = require('crypto');
const QueryString = require('querystring');
const Bounce = require('bounce');
const Wreck = require('wreck');
const Boom = require('boom');

module.exports = class CloudApi {
  constructor ({ token, url, keyId, key, log } = {}) {
    const env = process.env.NODE_ENV;
    Assert(token || env === 'development' || env === 'test', 'token is required for production');

    this._token = token;
    this._keyId = keyId;
    this._key = key;
    this._wreck = Wreck.defaults({
      headers: this._authHeaders(),
      baseUrl: `${url}/my`,
      json: true
    });
    this._log = log.bind(this);
    this.fetch = this.fetch.bind(this);
  }

  _authHeaders () {
    const now = new Date().toUTCString();
    const signer = Crypto.createSign('sha256');
    signer.update(now);
    const signature = signer.sign(this._key, 'base64');

    const headers = {
      'Content-Type': 'application/json',
      Date: now,
      Authorization: `Signature keyId="${
        this._keyId
      }",algorithm="rsa-sha256" ${signature}`
    };

    if (this._token) {
      headers['X-Auth-Token'] = this._token;
    }

    return headers;
  }

  async _request (path = '/', options = {}) {
    const wreckOptions = {
      json: true,
      payload: options.payload,
      headers: options.headers
    };

    if (options.query) {
      path += `?${QueryString.stringify(options.query)}`;
    }

    const method = (options.method && options.method.toLowerCase()) || 'get';

    try {
      const results = await this._wreck[method](path, wreckOptions);
      return results;
    } catch (ex) {
      this._log(['error', path], (ex.data && ex.data.payload) || ex);
      Bounce.rethrow(ex, 'system');

      if (options.default !== undefined) {
        return { payload: options.default, res: {} };
      }

      if (ex.data && ex.data.payload && ex.data.payload.message) {
        throw new Boom(ex.data.payload.message, ex.output.payload);
      }

      throw ex;
    }
  }

  async fetch (path = '/', options = {}) {
    const { payload, res } = await this._request(path, options);
    return options.includeRes ? { payload, res } : payload;
  }
};
