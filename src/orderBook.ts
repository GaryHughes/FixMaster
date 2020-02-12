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
        if (!msgType) {
            return false;
        }
        const processor = this._messageProcessors[msgType];
        if (!processor) {
            return false;
        }
        return processor(message);
    }

    public get orders() : Map<string, Order> {
        return this._orders;
    }

    public get size() : number {
        return this._orders.size;
    }

    public clear() {
        this._orders.clear();
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
        const order = new Order(message);
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

        const execType = message.fields.find(field => field.tag === FIX.execTypeTag);

        if (execType) {
            if (execType.value === FIX.execTypeReplace) {
                var replacement = order.replace(message);
                // This is an inneficient message - fix.
                var idFields = message.fields.filter(field => field.tag !== FIX.origClOrdIdTag && field.tag !== FIX.clOrdIdTag);
                idFields.push(new FIX.Field(FIX.clOrdIdTag, replacement.clOrdId));
                const idMessage = new FIX.Message(message.msgType, idFields);
                const replacementId = this.idForMessage(idMessage, FIX.Direction.Incoming);
                if (!replacementId) {
                    return false;
                }
                this._orders.set(replacementId, replacement);
                return true;
            }
        }
      
        order.update(message);
        return true;
    }

    private processOrderCancelReplaceRequest(message: FIX.Message) {
        const id = this.idForMessage(message, FIX.Direction.Outgoing);
        if (!id) {
            return false;
        }
        var order = this._orders.get(id);
        if (!order) {
            return false;
        }
        order.update(message);
        return false;
    }

    private processOrderCancelRequest(message: FIX.Message) {
        const id = this.idForMessage(message, FIX.Direction.Outgoing);
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

    private processOrderCancelReject(message: FIX.Message) {
        var id = this.idForMessage(message, FIX.Direction.Incoming);
        if (!id) {
            return false;
        }
        var order = this._orders.get(id);
        if (!order) {
            return false;
        }
        order.rollback();
        return true;
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

}