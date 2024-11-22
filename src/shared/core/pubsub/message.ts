import { Data, type Types } from "effect";

export type Message = Data.TaggedEnum<{
  NewFile: {
    path: string;
  };
  DeleteFile: {
    path: string;
  };
}>;

export const Message = Data.taggedEnum<Message>();

export type MessageType = Types.Tags<Message>;

type ExtractMessage<T extends MessageType> = Types.ExtractTag<Message, T>;

export type NewFileMessage = ExtractMessage<"NewFile">;
export type DeleteFileMessage = ExtractMessage<"DeleteFile">;

export type MessageTypeToMessage = {
  NewFile: NewFileMessage;
  DeleteFile: DeleteFileMessage;
};
