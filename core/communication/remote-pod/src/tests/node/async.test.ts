import { Pod, PolyLifecycle, DefaultPod } from "@polypoly-eu/pod-api";
import { Volume } from "memfs";
import { dataset } from "@rdfjs/dataset";
import fetch from "node-fetch";
import { podSpec } from "@polypoly-eu/pod-api/dist/spec";
import { getHttpbinUrl } from "@polypoly-eu/fetch-spec";
import { AsyncPod } from "../../async";
import { DataFactory } from "@polypoly-eu/rdf";
import chai, { assert } from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

describe("Async pod", () => {
    describe("Resolved promise", () => {
        const fs = new Volume().promises as any;
        const underlying = new DefaultPod(dataset(), fs, fetch);

        podSpec(
            new AsyncPod(Promise.resolve(underlying), new DataFactory(false)),
            "/",
            getHttpbinUrl()
        );
    });

    describe("Delayed promise", () => {
        const fs = new Volume().promises as any;
        const underlying = new DefaultPod(dataset(), fs, fetch);

        const delayed = new Promise<Pod>((resolve) => {
            setTimeout(() => resolve(underlying), 500);
        });

        podSpec(new AsyncPod(delayed, new DataFactory(false)), "/", getHttpbinUrl());
    });

    // TODO move to api, duplicated code
    describe("Lifecycle", () => {
        const fs = new Volume().promises as any;
        const underlying = new DefaultPod(dataset(), fs, fetch);

        let pod: Pod;
        let log: any[] = [];

        beforeEach(() => {
            log = [];
            const polyLifecycle: PolyLifecycle = {
                startFeature: async (...args) => {
                    log.push(args);
                },
                listFeatures: async () => ({ "test-on": true, "test-off": false }),
            };
            Object.assign(underlying, { polyLifecycle });
            pod = new AsyncPod(Promise.resolve(underlying), new DataFactory(false));
        });

        it("Lists features", async () => {
            await assert.eventually.deepEqual(pod.polyLifecycle!.listFeatures(), {
                "test-on": true,
                "test-off": false,
            });
        });

        it("Starts feature", async () => {
            await pod.polyLifecycle!.startFeature("hi", false);
            await pod.polyLifecycle!.startFeature("yo", true);
            assert.deepEqual(log, [
                ["hi", false],
                ["yo", true],
            ]);
        });
    });
});
