import EE from 'eventemitter3';

// Export the named EventEmitter that RPC Websockets is looking for
export const EventEmitter = EE;

// Also export as default
export default EE; 