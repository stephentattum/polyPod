import { podSpec } from "../spec";
import { DefaultPod } from "../default";
import { dataset } from "@rdfjs/dataset";
import fetch from "node-fetch";
import { Volume } from "memfs";
import { getHttpbinUrl } from "@polypoly-eu/fetch-spec";

describe("Mock pod", () => {
    podSpec(new DefaultPod(dataset(), new Volume().promises as any, fetch), "/", getHttpbinUrl());
});
