const { createEventBus } = require("../../src/events/eventBus");

describe("eventBus", () => {
  test("błąd listenera nie trafia do kodu, który opublikował event", async () => {
    const eventBus = createEventBus();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const secondListener = jest.fn();
    eventBus.subscribe("test.event", () => {
      throw new Error("listener failed");
    });
    eventBus.subscribe("test.event", secondListener);

    expect(() => eventBus.publish("test.event", { id: 1 })).not.toThrow();
    await eventBus.drain();

    expect(secondListener).toHaveBeenCalledWith(expect.objectContaining({ name: "test.event", payload: { id: 1 } }));
    expect(errorSpy).toHaveBeenCalledWith("[event:test.event] handler failed", expect.any(Error));
    errorSpy.mockRestore();
  });

  test("listener uruchamia się dopiero po powrocie z publish", async () => {
    const eventBus = createEventBus();
    const listener = jest.fn();
    eventBus.subscribe("test.event", listener);

    eventBus.publish("test.event", {});
    expect(listener).not.toHaveBeenCalled();

    await eventBus.drain();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
