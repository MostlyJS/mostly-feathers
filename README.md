MostlyJS with Feathers
======================

[![Build Status](https://travis-ci.org/mostlyjs/mostly-feathers.svg)](https://travis-ci.org/mostlyjs/mostly-feathers)

This module provides quick ways to create [MostlyJS](https://github.com/MostlyJS/mostly-node) microservices with [Feathers](https://feathersjs.com/).

# Documentation

Please see the [documentation site](https://mostlyjs.github.io).

# Usage

## Installation

```bash
npm install mostly-feathers
```

## Quick Example

Convert your Feathers APIs into microservices is easy enough.

Your existing Feathers code
```javascript
// service.js
const memory = require('feathers-memory');

module.exports = function() {
  const app = this;

  // initialize service
  const service = new memory();
  app.use('dummies', service);
}
```

Wrapping it as standalone server
```javascript
const nats = require('nats');
const mostly = require('mostly-node');
const feathers = require('mostly-feathers');
const service = require('./service');

const trans = new mostly(nats.connect());
trans.ready(() => {
  var app = feathers(trans)
    .configure(service);
});
```

That's all, the service will register itself with NATS and can be called remotely.

## RESTful Gateway

To expose the service as RESTful api, you need only setup a simple express gateway server using [mostly-feathers-rest](https://github.com/MostlyJS/mostly-feathers-rest)

# License

MIT