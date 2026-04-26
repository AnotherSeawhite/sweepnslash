import { PROTO } from 'mcbe-ipc';

export const FunctionSerializer: PROTO.Serializable<Function> = {
    *serialize(value, stream) {
        yield* PROTO.String.serialize(value.toString(), stream);
    },
    *deserialize(stream) {
        return new Function(`return ${yield* PROTO.String.deserialize(stream)}`)();
    },
};
