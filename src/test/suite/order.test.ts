import * as assert from 'assert';
import { Order } from '../../order';
import { 
  parseMessage, 
  beginStringTag, 
  senderCompIdTag, 
  targetCompIdTag, 
  clOrdIdTag, 
  symbolTag, 
  ordStatusTag, 
  sideTag, 
  orderQtyTag, 
  priceTag, 
  cumQtyTag, 
  avgPxTag } from '../../fixProtocol';

suite('Order Test Suite', () => {

    // TODO - cancel reject
    // TODO - order cancel replace reject

});
