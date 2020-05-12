import {podSpec} from "../specs/api";
import {DefaultPod} from "../default";
import {dataset} from "@rdfjs/dataset";
import fetch from "node-fetch";
import {Volume} from "memfs";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

describe("Mock pod", () => {

    podSpec(
        () => new DefaultPod(
            dataset(),
            new Volume().promises as any,
            fetch
        )
    );

});