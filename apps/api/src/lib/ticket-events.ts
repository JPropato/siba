import { EventEmitter } from 'events';

export interface TicketChangeEvent {
  action: 'created' | 'updated' | 'status_changed' | 'deleted' | 'note_added';
  ticketId: number;
  userId: number;
  timestamp: number;
}

class TicketEventBus extends EventEmitter {
  emit(event: 'ticket:change', data: TicketChangeEvent): boolean {
    return super.emit(event, data);
  }

  on(event: 'ticket:change', listener: (data: TicketChangeEvent) => void): this {
    return super.on(event, listener);
  }

  off(event: 'ticket:change', listener: (data: TicketChangeEvent) => void): this {
    return super.off(event, listener);
  }
}

export const ticketEventBus = new TicketEventBus();
ticketEventBus.setMaxListeners(100);
