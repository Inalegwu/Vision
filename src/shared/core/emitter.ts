import { Emitter } from "@shared/messaging/emitter";

const parseWorkerEmitter = new Emitter<{
  completed: null;
}>();
