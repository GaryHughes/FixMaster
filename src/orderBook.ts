import * as FIX from './fixProtocol';
import { Order } from './order';

export class OrderBook {

    constructor() {
        this._messageProcessors[FIX.msgTypeNewOrderSingle] = this.processNewOrderSingle;
        this._messageProcessors[FIX.msgTypeExecutionReport] = this.processExecutionReport;
        this._messageProcessors[FIX.msgTypeOrderCancelReplaceRequest] = this.processOrderCancelReplaceRequest;
        this._messageProcessors[FIX.msgTypeOrderCancelRequest] = this.processOrderCancelRequest;
        this._messageProcessors[FIX.msgTypeOrderCancelReject] = this.processOrderCancelReject;
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

    public orders() {
        return Object.keys(this._orders).map(key => this._orders[key]);
    }

    private processNewOrderSingle(message: FIX.Message) {
        return false;
    }

    private processExecutionReport(message: FIX.Message) {
        return false;
    }

    private processOrderCancelReplaceRequest(message: FIX.Message) {
        return false;
    }

    private processOrderCancelRequest(message: FIX.Message) {
        return false;
    }   

    private processOrderCancelReject(message: FIX.Message) {
        return false;
    }

    _messageProcessors: Record<string, (message:FIX.Message) => boolean> = {};
    
    _orders: Record<string, Order> = {};
   
}