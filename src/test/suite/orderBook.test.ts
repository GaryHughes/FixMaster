import * as assert from 'assert';
import { OrderBook } from '../../orderBook';
import { Order } from '../../order';
import { Message, parseMessage } from '../../fixProtocol';

suite('OrderBook Test Suite', () => {

    test('test default book', () => {
      let book = new OrderBook();
      assert.equal(0, book.size);
    });

    test('test unknown execution report', () => {
      let book = new OrderBook();
      let message = parseMessage("8=FIX.4.4\u00019=164\u000135=8\u000149=ACCEPTOR\u000156=INITIATOR\u000134=232\u000152=20190929-04:51:06.981\u000139=0\u000111=51\u000137=INITIATOR-ACCEPTOR-51\u000117=2\u0001150=0\u0001151=10000\u000155=WTF\u000154=1\u000138=10000\u000132=0\u000131=0\u000114=0\u00016=0\u000140=1\u000110=115\u0001");
      if (!message) {
        assert.fail("message failed to parse");
        return;
      }
      if (book.process(message)) {
        assert.fail('unexpectedly processed execution report');
      }
    });

    test('test unknown order cancel replace request', () => {
      let book = new OrderBook();
      let message = parseMessage("8=FIX.4.4\u00019=178\u000135=G\u000149=INITIATOR\u000156=ACCEPTOR\u000134=2536\u000152=20191117-01:01:47.010\u000137=INITIATOR-ACCEPTOR-56\u000141=56\u000111=57\u000170=55\u0001100=AUTO\u000155=WTF\u000154=1\u000160=20191117-01:01:38.158\u000138=100000\u000140=2\u000144=11\u000159=0\u000110=035\u0001");
      if (!message) {
        assert.fail("message failed to parse");
        return;
      }
      if (book.process(message)) {
        assert.fail('unexpectedly processed order cancel replace request');
      }
    });

    test('test unknown order cancel request', () => {
      let book = new OrderBook();
      let message = parseMessage("8=FIX.4.4\u00019=147\u000135=F\u000149=INITIATOR\u000156=ACCEPTOR\u000134=2544\u000152=20191117-01:09:11.302\u000141=58\u000137=INITIATOR-ACCEPTOR-58\u000111=59\u000155=WTF\u000154=1\u000160=20191117-01:09:09.139\u000138=100000\u000110=092\u0001");
      if (!message) {
        assert.fail("message failed to parse");
        return;
      }
      if (book.process(message)) {
        assert.fail('unexpectedly processed order cancel request');
      }
    });

    test('test unknown order cancel reject', () => {
      let book = new OrderBook();
      let message = parseMessage("8=FIX.4.49=127\u000135=949=ACCEPTOR\u000156=INITIATOR\u000134=511\u000152=20191117-01:11:06.578\u000137=INITIATOR-ACCEPTOR-58\u000139=8\u000141=58434=1\u000111=59\u000158=Unknown order\u000110=208\u0001");
      if (!message) {
        assert.fail("message failed to parse");
        return;
      }
      if (book.process(message)) {
        assert.fail('unexpectedly processed order cancel reject');
      }
    });

    test('test new order single acknowledged', () => {
      const messages: string[] = [
        "8=FIX.4.4\u00019=140\u000135=D\u000149=INITIATOR\u000156=ACCEPTOR\u000134=2283\u000152=20190929-04:51:06.973\u000111=51\u000170=50\u0001100=AUTO\u000155=WTF\u000154=1\u000160=20190929-04:35:33.562\u000138=10000\u000140=1\u000159=1\u000110=127\u0001",
        "8=FIX.4.4\u00019=164\u000135=8\u000149=ACCEPTOR\u000156=INITIATOR\u000134=232\u000152=20190929-04:51:06.981\u000139=0\u000111=51\u000137=INITIATOR-ACCEPTOR-51\u000117=2\u0001150=0\u0001151=10000\u000155=WTF\u000154=1\u000138=10000\u000132=0\u000131=0\u000114=0\u00016=0\u000140=1\u000110=115\u0001"
      ];
      let book = new OrderBook();
      for (const text of messages) {
        const message = parseMessage(text);
        if (!message) {
          assert.fail("message failed to parse");
          return;
        }
        assert.equal(book.process(message), true);
      }
      assert.equal(book.size, 1);
    });

    test('test clear', () => {
      const messages: string[] = [
        "8=FIX.4.4\u00019=140\u000135=D\u000149=INITIATOR\u000156=ACCEPTOR\u000134=2283\u000152=20190929-04:51:06.973\u000111=51\u000170=50\u0001100=AUTO\u000155=WTF\u000154=1\u000160=20190929-04:35:33.562\u000138=10000\u000140=1\u000159=1\u000110=127\u0001",
        "8=FIX.4.4\u00019=164\u000135=8\u000149=ACCEPTOR\u000156=INITIATOR\u000134=232\u000152=20190929-04:51:06.981\u000139=0\u000111=51\u000137=INITIATOR-ACCEPTOR-51\u000117=2\u0001150=0\u0001151=10000\u000155=WTF\u000154=1\u000138=10000\u000132=0\u000131=0\u000114=0\u00016=0\u000140=1\u000110=115\u0001"
      ];
      let book = new OrderBook();
      for (const text of messages) {
        const message = parseMessage(text);
        if (!message) {
          assert.fail("message failed to parse");
          return;
        }
        assert.equal(book.process(message), true);
      }
      assert.equal(book.size, 1);
      book.clear();
      assert.equal(book.size, 0);
    });
});
