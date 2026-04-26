import { PROTO } from './ipc';

/** @type {PROTO.Serializable<Function>} */
export const FunctionSerializer = {
    *serialize(value, stream) {
        yield* PROTO.String.serialize(value.toString(), stream);
    },
    *deserialize(stream) {
        return new Function(`return ${yield* PROTO.String.deserialize(stream)}`)();
    },
};
