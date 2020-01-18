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

    test('test constructor with no tags', () => {
      let message = parseMessage("8=FIX.4.4\u00019=140\u000135=D\u000149=INITIATOR\u000156=ACCEPTOR\u000134=2283\u000152=20190929-04:51:06.973\u000111=51\u000170=50\u0001100=AUTO\u000155=WTF\u000154=1\u000160=20190929-04:35:33.562\u000138=10000\u000140=1\u000159=1\u000110=127\u0001");
      if (!message) {
        assert.fail("message failed to parse");
        return;
      }
      const order = new Order(message, []);
      assert.equal(order.beginString, "FIX.4.4");
      assert.equal(order.senderCompId, "INITIATOR");
      assert.equal(order.targetCompId, "ACCEPTOR");
      assert.equal(order.fields.size, 0);
    });

    test('test constructor with tags that overlap identity fields', () => {
      let message = parseMessage("8=FIX.4.4\u00019=140\u000135=D\u000149=INITIATOR\u000156=ACCEPTOR\u000134=2283\u000152=20190929-04:51:06.973\u000111=51\u000170=50\u0001100=AUTO\u000155=WTF\u000154=1\u000160=20190929-04:35:33.562\u000138=10000\u000140=1\u000159=1\u000110=127\u0001");
      if (!message) {
        assert.fail("message failed to parse");
        return;
      }
      const order = new Order(message, [ beginStringTag, senderCompIdTag, targetCompIdTag, clOrdIdTag ]);
      assert.equal(order.beginString, "FIX.4.4");
      assert.equal(order.senderCompId, "INITIATOR");
      assert.equal(order.targetCompId, "ACCEPTOR");
      assert.equal(order.fields.size, 0);
    });

    test('test constructor with tags that do not overlap identity fields', () => {
      let orderSingle = parseMessage("8=FIX.4.4\u00019=149\u000135=D\u000149=INITIATOR\u000156=ACCEPTOR\u000134=2752\u000152=20200114-08:13:20.041\u000111=61\u000170=60\u0001100=AUTO\u000155=BHP.AX\u000154=1\u000160=20200114-08:12:59.397\u000138=10000\u000140=2\u000144=20\u000159=1\u000110=021\u0001");
      if (!orderSingle) {
        assert.fail("message failed to parse");
        return;
      }
      const order = new Order(orderSingle, [ symbolTag, ordStatusTag, sideTag, orderQtyTag, priceTag, cumQtyTag, avgPxTag ]);
      assert.equal(order.beginString, "FIX.4.4");
      assert.equal(order.senderCompId, "INITIATOR");
      assert.equal(order.targetCompId, "ACCEPTOR");
      assert.equal(order.fields.size, 4);

      let ack = parseMessage("8=FIX.4.4\u00019=173\u000135=8\u000149=ACCEPTOR\u000156=INITIATOR\u000134=71852=20200114-08:13:20.072\u000139=0\u000111=61\u000137=INITIATOR-ACCEPTOR-61\u000117=1\u0001150=0\u0001151=10000\u000155=BHP.AX\u000154=1\u000138=10000\u000144=20\u000132=0\u000131=0\u000114=0\u00016=0\u000140=2\u000110=021\u0001");
      if (!ack) {
        assert.fail("message failed to parse");
        return;
      }
      order.update(ack);
      assert.equal(order.fields.size, 7);
    });
    
    // TODO - cancel reject
    // TODO - order cancel replace reject


});
