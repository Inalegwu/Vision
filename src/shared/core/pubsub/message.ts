import { Data, type Types } from "effect";

export type Message = Data.TaggedEnum<{
  NewFile: {
    path: string;
  };
  DeleteFile: {
    path: string;
  };
  NewRarFile: {
    path: string;
    name: string;
  };
  NewZipFile: {
    path: string;
    name: string;
  };
}>;

export const Message = Data.taggedEnum<Message>();

export type MessageType = Types.Tags<Message>;

type ExtractMessage<T extends MessageType> = Types.ExtractTag<Message, T>;

export type NewFileMessage = ExtractMessage<"NewFile">;
export type DeleteFileMessage = ExtractMessage<"DeleteFile">;
export type NewRarFileMessage = ExtractMessage<"NewRarFile">;
export type NewZipFileMessage = ExtractMessage<"NewZipFile">;

export type MessageTypeToMessage = {
  NewFile: NewFileMessage;
  DeleteFile: DeleteFileMessage;
  NewRarFile: NewRarFileMessage;
  NewZipFile: NewZipFileMessage;
};
