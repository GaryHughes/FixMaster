import * as FIX from './fixProtocol';
import { Order } from './order';

export class OrderBook {

    constructor() {
        this._messageProcessors[FIX.msgTypeNewOrderSingle] = (order) => this.processNewOrderSingle(order);
        this._messageProcessors[FIX.msgTypeExecutionReport] = (order) => this.processExecutionReport(order);
        this._messageProcessors[FIX.msgTypeOrderCancelReplaceRequest] = (order) => this.processOrderCancelReplaceRequest(order);
        this._messageProcessors[FIX.msgTypeOrderCancelRequest] = (order) => this.processOrderCancelRequest(order);
        this._messageProcessors[FIX.msgTypeOrderCancelReject] = (order) => this.processOrderCancelReject(order);
    }

    process(message: FIX.Message) {
        const msgType = message.msgType;
        if (msgType === null) {
            return false;
        }
        const processor = this._messageProcessors[msgType];
        if (processor === null) {
            return false;
        }
        return processor(message);
    }

    public get orders() : IterableIterator<Order> {
        return this._orders.values();
    }

    public get size() : number {
        return this._orders.size;
    }

    public clear() {
        this._orders.clear();
    }

    public set fields(tags:number[]) {
        this._tags = tags;
    }

    private processNewOrderSingle(message: FIX.Message) {
        const id = this.idForMessage(message, FIX.Direction.Outgoing);
        if (!id) {
            return false;
        }
        const existing = this._orders.get(id);
        if (existing) {
            return false;
        }
        const order = new Order(message, this._tags);
        this._orders.set(id, order);
        return true;
    }

    private processExecutionReport(message: FIX.Message) {
        const id = this.idForMessage(message, FIX.Direction.Incoming);
        if (!id) {
            return false;
        }
        var order = this._orders.get(id);
        if (!order) {
            return false;
        }
        order.update(message);
        return true;
    }

    private processOrderCancelReplaceRequest(message: FIX.Message) {
        const id = this.idForMessage(message, FIX.Direction.Outgoing);
        if (!id) {
            return false;
        }
        return false;
    }

    private processOrderCancelRequest(message: FIX.Message) {
        const id = this.idForMessage(message, FIX.Direction.Outgoing);
        if (!id) {
            return false;
        }
        return false;
    }   

    private processOrderCancelReject(message: FIX.Message) {
        var id = this.idForMessage(message, FIX.Direction.Incoming);
        if (!id) {
            return false;
        }
        return false;
    }

    idForMessage(message: FIX.Message, direction: FIX.Direction) {
      
        const beginString = message.fields.find(field => field.tag === FIX.beginStringTag);
        if (!beginString) {
            return null;
        }
        
        const senderCompId = message.fields.find(field => field.tag === FIX.senderCompIdTag);
        if (!senderCompId) {
            return null;
        }

        const targetCompId = message.fields.find(field => field.tag === FIX.targetCompIdTag);
        if (!targetCompId) {
            return null;
        }

        var clOrdId = message.fields.find(field => field.tag === FIX.origClOrdIdTag);
        if (!clOrdId) {
            clOrdId = message.fields.find(field => field.tag === FIX.clOrdIdTag);
            if (!clOrdId) {
                return null;
            }
        }

        if (direction === FIX.Direction.Incoming) {
            return `${targetCompId.value}-${senderCompId.value}-${clOrdId.value}`;
        }

        return `${senderCompId.value}-${targetCompId.value}-${clOrdId.value}`;
    }
       
    private _messageProcessors: Record<string, (message:FIX.Message) => boolean> = {};
    
    private _orders: Map<string, Order> = new Map<string, Order>();

    private _tags: number[] = [];
   
}