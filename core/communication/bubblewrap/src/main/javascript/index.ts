/**
 * This module defines the [[Bubblewrap]] class and related utilities.
 *
 * The terminology in this module is as follows:
 * - _encode_/_decode_ refers to conversion to/from byte arrays
 * - _serialize_/_deserialize_ refers to high-level object manipulation
 *
 * Library users usually only need to care about encoding and decoding; these operations are provided by
 * [[Bubblewrap.encode]] and [[Bubblewrap.decode]], respectively.
 *
 * Customizing the encoding and decoding logic can be done by registering JavaScript classes. Details can be found in
 * the documentation of [[Class]] (explanation of the custom logic) and [[Bubblewrap]] (explanation of how to register).
 *
 * We leverage [MessagePack's](https://msgpack.org/) extension types for mapping JavaScript objects to byte arrays.
 * This library defines four extension types:
 * 1. [[msgPackEtypeStrict]] is reserved for implementation purposes and will never be emitted
 * 2. [[msgPackEtypeUndef]] tags a sentinel value of class [[Undefined]]; used to distinguish `undefined` from
 *    `null` (see [[Class]] for details)
 * 3. [[msgPackEtypeClass]] tags an registered JavaScript class; there is one tag for all classes
 * 4. [[msgPackEtypeError]] tags an error of the built-in `Error` type; it is possible to specify custom logic
 *    for subclasses of `Error`
 *
 * @packageDocumentation
 */

import { encode, decode, ExtensionCodec } from "@msgpack/msgpack";

/**
 * Symbol for static class methods that provide custom deserialization logic. See [[Class]] for an example.
 */
export const deserialize: unique symbol = Symbol();

/**
 * Symbol for class methods that provide custom serialization logic. See [[Class]] for an example.
 */
export const serialize: unique symbol = Symbol();

export interface MaybeSerializable {
    [serialize]?: () => any;
}

export interface Serializable extends MaybeSerializable {
    [serialize]: () => any;
}

function isSerializable(t: MaybeSerializable): t is Serializable {
    return t[serialize] !== undefined;
}

/**
 * A class that can be registered to [[Bubblewrap]].
 *
 * #### Behaviour for unregistered classes
 *
 * Without customization, [[Bubblewrap.encode]] uses `Object.entries` to encode all properties of an object as-is.
 * Consequently, the prototype after encoding is just `object`. In the following example, only the `subject` property
 * survives:
 *
 * ```javascript
 * class MyCoolClass {
 *    constructor(subject) {
 *        this.subject = subject;
 *    }
 *
 *    greet() {
 *        console.log(`Hello ${this.subject}!`);
 *    }
 * }
 *
 * const bubblewrap = Bubblewrap.create();
 * const encoded = bubblewrap.encode(new MyCoolClass("World"));
 * const decoded = bubblewrap.decode(encoded);
 * ```
 *
 * The decoded object will not have a `greet` method, because this method is defined on `MyCoolClass.prototype`. For
 * Bubblewrap, `new MyCoolClass(x)` is equivalent to `{ subject: x }`, i.e., a plain object literal.
 *
 * #### Behaviour for registered classes
 *
 * Registering a [[Class]], i.e. its constructor, changes this logic. In the above example, we could register the
 * value `MyCoolClass`, which in JavaScript is a function that constructs objects of this class.
 *
 * In the simplest case, a class' author does not have to implement any additional methods. Encoding will still use
 * `Object.entries`, but additionally include the object's prototype.
 *
 * Applied to the above example, the object will be encoded as follows:
 *
 * ```
 * encode(new MyCoolClass("World")) ≡ encode(["MyCoolClass", { subject: "World" }])
 * ```
 *
 * The string identifier `"MyCoolClass"` is supplied by the user when registering the class. When decoding, Bubblewrap
 * will look up the appropriate prototype:
 *
 * ```
 * decode(encoded) ≡ Object.create(MyCoolClass.prototype, { subject: "World" })
 * ```
 *
 * In some situations, this default logic is not sufficient. It may not work when complex class hierarchies are
 * involved.
 *
 * The logic can be further tweaked by providing additional methods. These methods must have well-known names that are
 * specified by the [[serialize]] and [[deserialize]] symbols. The following class illustrates this using a subclass
 * of `Error`:
 *
 * ```
 * class MyError extends Error {
 *    constructor(
 *        private readonly mymsg: string
 *    ) {
 *        super(`My message: ${mymsg}`);
 *    }
 *
 *    static [deserialize](mymsg: string): MyError {
 *        return new MyError(mymsg);
 *    }
 *
 *    [serialize](): any {
 *        return this.mymsg;
 *    }
 * }
 * ```
 *
 * If a `[serialize]` method is present on an object, it will be invoked before encoding that object. If a
 * `[deserialize]` method is present on the prototype of an object, it will be invoked after decoding that object.
 * Classes are free to choose any representation; the return value of `[serialize]` will be recursively processed by
 * [[Bubblewrap.encode]].
 *
 * #### Handling of `undefined`
 *
 * Due to a limitation of the MessagePack implementation used in this library, `undefined` and `null` are conflated: by
 * default, values that were `undefined` appear as `null` after decoding. This happens for example when an array has
 * `undefined` elements or an object has an enumerable property that is `undefined`.
 *
 * There is exactly one situation in which this does not happen: when registering a class to [[Bubblewrap]] _without_
 * defining a `[serialize]` method. In this case, the encoder maps `undefined` properties to the [[Undefined]] sentinel
 * class. The decoder maps this class back to `undefined`.
 *
 * Library authors defining custom `[serialize]` methods must take care of this themselves.
 *
 * It is not possible to customize this behaviour for arrays, raw objects, or `undefined` values nested below objects
 * of registered classes.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export type Class<T extends MaybeSerializable> = Function & {
    prototype: T;
    [deserialize]?: (any: any) => T;
};

/**
 * A dictionary of known classes.
 *
 * The keys in this record serve as class identifiers. Consequently, it is strongly recommended to qualify the keys, for
 * example with the npm package name:
 *
 * ```
 * import {MyDomainClass} from "@myorg/pkg";
 *
 * const classes = {
 *     "@myorg/pkg.MyDomainClass": MyDomainClass
 * };
 * ```
 *
 * Avoid using the constructor's name by accessing `MyDomainClass.name`. The concrete name of a class is an
 * implementation detail that may be changed by module bundlers (e.g. turning `class MyDomainClass` into
 * `class MyDomainClass$1`). This would make robust encoding and decoding across applications with shared libraries
 * brittle.
 *
 * See [[Bubblewrap]] for how to register classes.
 */
export type Classes = Record<string, Class<any>>;

export const msgPackEtypeStrict = 0x00;
export const msgPackEtypeUndef = 0x01;
export const msgPackEtypeClass = 0x02;
export const msgPackEtypeError = 0x03;

/**
 * Sentinel class used to represent `undefined` in the MessagePack data model.
 *
 * This class has no properties.
 */
export class Undefined {}

/**
 * Encoding and decoding of JavaScript values to and from byte arrays.
 *
 * An instance of this class manages two pieces of state:
 *
 * 1. the dictionary of registered classes
 * 2. a low-level MessagePack codec (implementation detail)
 *
 * The latter is initialized lazily for performance reasons. Otherwise, this class is immutable and may freely be
 * shared.
 *
 * New instances are created using the [[Bubblewrap.create]] static method. Additional classes can be registered with
 * [[Bubblewrap.addClasses]].
 *
 * It is crucial that in any given application, class keys are not reused. They are required for identifying custom
 * (de)serialization logic. Keys of registered classes are stored
 */
export class Bubblewrap {
    codec?: ExtensionCodec;

    private constructor(private readonly classes: Classes, private readonly strict: boolean) {}

    /**
     * Creates a new instance of [[Bubblewrap]] with the specified dictionary of registered classes.
     *
     * If no dictionary is specified, no classes are registered.
     *
     * @param strict if `true`, then `encode` will throw an exception when encountering any object with an unknown
     * prototype; this is only recommended for testing purposes
     */
    static create(classes?: Classes, strict = false): Bubblewrap {
        return new Bubblewrap(classes || {}, strict);
    }

    /**
     * Constructs a new, independent [[Bubblewrap]] instance with additional registered classes.
     *
     * This method throws an exception if there is a duplicate class identifier.
     */
    addClasses(more: Classes): Bubblewrap {
        const thisKeys = Object.keys(this.classes);
        const thatKeys = Object.keys(more);
        for (const thisKey of thisKeys)
            if (thatKeys.includes(thisKey)) throw new Error(`Duplicate identifier ${thisKey}`);
        return new Bubblewrap({ ...this.classes, ...more }, this.strict);
    }

    private registerStrict(codec: ExtensionCodec): void {
        if (!this.strict) return;

        const knownPrototypes = [
            Object.prototype,
            Error.prototype,
            Undefined.prototype,
            ...Object.values(this.classes).map((cls) => cls.prototype),
        ];

        codec.register({
            type: msgPackEtypeStrict,
            encode: (value) => {
                if (typeof value === "object" && !Array.isArray(value)) {
                    if (knownPrototypes.includes(Object.getPrototypeOf(value)))
                        // this value is probably fine, please go on
                        return null;

                    throw new Error("Attempted to encode an object with an unknown prototype");
                }
                return null;
            },
            decode: () => {
                throw new Error("Attempted to decode a dummy type");
            },
        });
    }

    private makeCodec(): ExtensionCodec {
        const codec = new ExtensionCodec();

        this.registerStrict(codec);

        codec.register({
            type: msgPackEtypeUndef,
            encode: (value) => (value instanceof Undefined ? encode(null) : null),
            decode: () => undefined,
        });

        codec.register({
            type: msgPackEtypeClass,
            encode: (_value) => {
                const entries = Object.entries(this.classes);
                // assume that later entries take precedence over earlier ones
                entries.reverse();
                for (const [name, Class] of entries) {
                    if (!(_value instanceof Class)) continue;

                    // @ts-ignore
                    const value: MaybeSerializable = _value;

                    if (isSerializable(value))
                        return encode([name, value[serialize]()], { extensionCodec: codec });

                    const raw = Object.entries(value);
                    const entries = raw.map(([key, value]) => {
                        if (value === undefined) return [key, new Undefined()];
                        else return [key, value];
                    });

                    return encode([name, entries], { extensionCodec: codec });
                }

                return null;
            },
            decode: (buffer) => {
                const [name, raw] = decode(buffer, { extensionCodec: codec }) as any;
                const Class = this.classes[name];

                const deserializer = Class[deserialize];
                if (deserializer !== undefined) return deserializer(raw);

                const object = Object.create(Class.prototype);
                for (const [key, value] of raw as [string, any][]) object[key] = value;
                return object;
            },
        });

        codec.register({
            type: msgPackEtypeError,
            encode: (value) => (value instanceof Error ? encode(value.message) : null),
            decode: (buffer) => new Error(decode(buffer) as string),
        });

        return codec;
    }

    encode(value: unknown): Uint8Array {
        if (!this.codec) this.codec = this.makeCodec();

        return encode(value, { extensionCodec: this.codec });
    }

    decode(_buffer: ArrayLike<number> | ArrayBuffer): any {
        if (!this.codec) this.codec = this.makeCodec();

        const buffer = new Uint8Array(_buffer);
        return decode(buffer, { extensionCodec: this.codec });
    }
}
