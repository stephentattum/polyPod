import { iframeInnerPort } from "@polypoly-eu/port-authority";
import { DataFactory } from "@polypoly-eu/rdf";
import { RemoteClientPod } from "./remote";
import { AsyncPod } from "./async";

window.pod = new AsyncPod(
    iframeInnerPort("").then((pod) => RemoteClientPod.fromRawPort(pod)),
    new DataFactory(false)
);
