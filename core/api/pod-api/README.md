# pod-api

Definition, spec, and default implementation of the polyPod API

## Overview

This repository defines the interface between the polyPod and features. As far
as reasonably possible, we try to stick to existing APIs, for example
[RDFJS](http://rdf.js.org/) for querying and storing data.

Features run in a sandboxed browsing context, which means they have access to a
lot of the usual browser APIs, but things such as data storage and external
communication need to go through the polyPod API, i.e. an implementation of the
`Pod` interface as specified here. The concrete polyPod implementation, e.g. the
polyPod for Android, exposes an object that implements the `Pod` interface to
the feature.

## Structure

This repository is structured as a TypeScript library with the following
modules:

* `api` contains type definitions, describing the shape of the interfaces
    * `fs` defines the filesystem operations
    * `fetch` defines the [Fetch]-compatible API for sending HTTP(S) requests
* `feature` contains additional type definitions for the DOM that features can
  expect
* `default` provides a minimal reference implementation (excluding the DOM
  interface)
* `specs/api` is a conformance test for API implementations (excluding the DOM
  interface)

[Fetch]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API