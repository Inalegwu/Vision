import { EventEmitter } from "node:events";

export class Emitter<TEvents extends Record<string, unknown>> {
  private emitter = new EventEmitter().setMaxListeners(15);

  emit<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    ...eventArgs: TEvents[TEventName][]
  ) {
    this.emitter.emit(eventName, ...(eventArgs as []));
  }

  on<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArgs: TEvents[TEventName][]) => void,
  ) {
    this.emitter.on(eventName, handler);
  }

  off<TEventName extends keyof TEvents & string>(
    eventName: TEventName,
    handler: (...eventArgs: TEvents[TEventName][]) => void,
  ) {
    this.emitter.on(eventName, handler);
  }
}
