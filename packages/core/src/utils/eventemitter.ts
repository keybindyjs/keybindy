export class EventEmitter<T> {
  private listeners: ((event: T) => void)[] = [];

  on(listener: (event: T) => void) {
    this.listeners.push(listener);
    return () => this.off(listener); // return unsubscribe fn
  }

  off(listener: (event: T) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  emit(event: T) {
    this.listeners.forEach(listener => listener(event));
  }
}
