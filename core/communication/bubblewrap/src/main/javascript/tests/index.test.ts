import fc, { Arbitrary } from "fast-check";
import { gens } from "@polypoly-eu/rdf-spec";
import * as RDF from "@polypoly-eu/rdf";
import { Bubblewrap, Class, Classes, deserialize, serialize } from "../index";

// TODO export spec
type TypeInfo<T> = [Class<T>, Arbitrary<T>];

type TypeInfos<T extends Record<string, unknown>> = {
    [P in keyof T]: TypeInfo<T[P]>;
};

class BubblewrapSpec<T extends Record<string, unknown>> {
    readonly bubblewrap: Bubblewrap;
    private readonly gen: Arbitrary<[Class<any>, unknown]>;

    constructor(private readonly infos: TypeInfos<T>) {
        const gens: Arbitrary<[Class<any>, unknown]>[] = [];
        const constructors: Classes = {};

        for (const [key, [constructor, gen]] of Object.entries(this.infos)) {
            gens.push(gen.map((value: unknown) => [constructor, value]));
            constructors[key] = constructor;
        }

        this.bubblewrap = Bubblewrap.create(constructors, true);

        this.gen = fc.oneof(...gens);
    }

    run(): void {
        const { gen, bubblewrap } = this;

        it("decode/encode", () => {
            fc.assert(
                fc.property(gen, ([constructor, t]) => {
                    const encoded = bubblewrap.encode(t);
                    expect(encoded).toBeInstanceOf(Uint8Array);
                    const decoded = bubblewrap.decode(encoded);
                    expect(decoded).toStrictEqual(t);
                    expect(decoded).toBeInstanceOf(constructor);
                })
            );
        });
    }
}

class TestA {
    constructor(public a: string) {}
}

class TestB extends TestA {
    constructor(a: string, public b: string) {
        super(a);
    }
}

class MyError extends Error {
    constructor(private readonly mymsg: string) {
        super(`My message: ${mymsg}`);
    }

    static [deserialize](mymsg: string): MyError {
        return new MyError(mymsg);
    }

    [serialize](): any {
        return this.mymsg;
    }
}

type Types = {
    A: TestA;
    B: TestB;
    MyError: MyError;
    "@polypoly-eu/rdf.NamedNode": RDF.NamedNode;
    "@polypoly-eu/rdf.BlankNode": RDF.BlankNode;
    "@polypoly-eu/rdf.Literal": RDF.Literal;
    "@polypoly-eu/rdf.Variable": RDF.Variable;
    "@polypoly-eu/rdf.DefaultGraph": RDF.DefaultGraph;
    "@polypoly-eu/rdf.Quad": RDF.Quad;
};

const gen = gens(RDF.dataFactory);

const infos: TypeInfos<Types> = {
    A: [TestA, fc.fullUnicodeString().map((a) => new TestA(a))],
    B: [
        TestB,
        fc.tuple(fc.fullUnicodeString(), fc.fullUnicodeString()).map(([a, b]) => new TestB(a, b)),
    ],
    MyError: [MyError, fc.hexaString().map((m) => new MyError(m))],
    "@polypoly-eu/rdf.NamedNode": [RDF.NamedNode, gen.namedNode],
    "@polypoly-eu/rdf.BlankNode": [RDF.BlankNode, gen.blankNode],
    "@polypoly-eu/rdf.Literal": [RDF.Literal, gen.literal],
    "@polypoly-eu/rdf.Variable": [RDF.Variable, gen.variable!],
    "@polypoly-eu/rdf.DefaultGraph": [
        RDF.DefaultGraph,
        fc.constant(RDF.dataFactory.defaultGraph()),
    ],
    "@polypoly-eu/rdf.Quad": [RDF.Quad, gen.quad],
};

describe("Bubblewrap", () => {
    describe("Spec", () => {
        new BubblewrapSpec(infos).run();
    });

    describe("RDF", () => {
        const { bubblewrap } = new BubblewrapSpec(infos);

        for (const [key, g] of Object.entries(gen))
            it(key, () => {
                fc.assert(
                    fc.property(g, (term) => {
                        const decoded = bubblewrap.decode(bubblewrap.encode(term));
                        expect((term as any).equals(decoded)).toBe(true);
                        expect(decoded.equals(term)).toBe(true);
                    })
                );
            });
    });

    describe("Builtins", () => {
        it("Error", () => {
            const bubblewrap = Bubblewrap.create();

            fc.assert(
                fc.property(fc.string(), (msg) => {
                    const err = new Error(msg);
                    const decoded = bubblewrap.decode(bubblewrap.encode(err));
                    expect(decoded).toEqual(err);
                    expect(decoded).toBeInstanceOf(Error);
                })
            );
        });

        it("Error (non-strict)", () => {
            const bubblewrap = Bubblewrap.create();
            const err = new MyError("test");
            const decoded = bubblewrap.decode(bubblewrap.encode(err));
            expect(Object.getPrototypeOf(decoded)).toBe(Error.prototype);
        });

        it("Error (strict)", () => {
            const bubblewrap = Bubblewrap.create({}, true);
            const err = new MyError("test");
            expect(() => bubblewrap.encode(err)).toThrowError(/unknown prototype/);
        });
    });
});
