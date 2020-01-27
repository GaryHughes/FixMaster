import * as assert from 'assert';
import { OrderBook } from '../../orderBook';
import { Order } from '../../order';
import { 
  parseMessage, 
  ordStatusTag,
  ordStatusNew,
  ordStatusCanceled,
  ordStatusReplaced,
  ordStatusPendingCancel,
  ordStatusPendingReplace
} from '../../fixProtocol';

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

    test('test order cancel replace request for unknown order', () => {
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

    test('test order cancel request for unknown order', () => {
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

    test('test order cancel reject for unknown order', () => {
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

    test('test order cancel request for known order accepted', () => {
      const messages: string[] = [
        "8=FIXT.1.1\u00019=148\u000135=D\u000149=INITIATOR\u000156=ACCEPTOR\u000134=24\u000152=20200119-04:43:20.679\u000111=8\u000170=6\u0001100=AUTO\u000155=WTF.AX\u000154=1\u000160=20200119-04:43:18.221\u000138=20000\u000140=2\u000144=11.56\u000159=1\u000110=081\u0001",
        "8=FIXT.1.1\u00019=173\u000135=8\u000149=ACCEPTOR\u000156=INITIATOR\u000134=31\u000152=20200119-04:43:35.419\u000139=0\u000111=8\u000137=INITIATOR-ACCEPTOR-8\u000117=1\u0001150=0\u0001151=20000\u000155=WTF.AX\u000154=1\u000138=20000\u000144=11.56\u000132=0\u000131=0\u000114=0\u00016=0\u000140=2\u000110=138\u0001",
        "8=FIXT.1.1\u00019=153\u000135=F\u000149=INITIATOR\u000156=ACCEPTOR\u000134=26\u000152=20200119-04:43:43.562\u000141=8\u000137=INITIATOR-ACCEPTOR-8\u000111=9\u000155=WTF.AX\u000154=1\u000160=20200119-04:43:42.213\u000138=20000\u0001100=AUTO\u000110=056\u0001",
        "8=FIXT.1.1\u00019=178\u000135=8\u000149=ACCEPTOR\u000156=INITIATOR\u000134=32\u000152=20200119-04:43:43.570\u000139=6\u000111=9\u000137=INITIATOR-ACCEPTOR-8\u000117=2\u0001150=6\u0001151=20000\u000141=8\u000155=WTF.AX\u000154=1\u000138=20000\u000144=11.56\u000132=0\u000131=0\u000114=0\u00016=0\u000140=2\u000110=118\u0001",
        "8=FIXT.1.1\u00019=174\u000135=8\u000149=ACCEPTOR\u000156=INITIATOR\u000134=33\u000152=20200119-04:43:51.214\u000139=4\u000111=9\u000137=INITIATOR-ACCEPTOR-8\u000117=3\u0001150=4\u0001151=0\u000141=8\u000155=WTF.AX\u000154=1\u000138=20000\u000144=11.56\u000132=0\u000131=0\u000114=0\u00016=0\u000140=2\u000110=168"
      ];
      let book = new OrderBook();
      var index = 0;
      for (const text of messages) {
        const message = parseMessage(text);
        if (!message) {
          assert.fail("message failed to parse");
          return;
        }
        assert.equal(book.process(message), true);
        switch (index) {
          case 0:
            assert.equal(book.size, 1);
            break;
          case 1:
            {
            assert.equal(book.size, 1);
            let order = book.orders.values().next().value as Order;
            assert.equal(order.fields[ordStatusTag].value, ordStatusNew);
            }
            break;
          case 2:
            {
            assert.equal(book.size, 1);
            let order = book.orders.values().next().value as Order;
            assert.equal(order.fields[ordStatusTag].value, ordStatusNew);
            }
            break;
          case 3:
            {
            assert.equal(book.size, 1);
            let order = book.orders.values().next().value as Order;
            assert.equal(order.fields[ordStatusTag].value, ordStatusPendingCancel);
            }
            break;
          case 4:
            {
            assert.equal(book.size, 1);
            let order = book.orders.values().next().value as Order;
            assert.equal(order.fields[ordStatusTag].value, ordStatusCanceled);
            }
            break;
        }
        ++index;
      }
    });

    test('test order cancel request for known order rejected', () => {
      const messages: string[] = [
        "8=FIXT.1.1\u00019=149\u000135=D\u000149=INITIATOR\u000156=ACCEPTOR\u000134=31\u000152=20200119-04:45:43.004\u000111=10\u000170=7\u0001100=AUTO\u000155=WTF.AX\u000154=1\u000160=20200119-04:45:40.842\u000138=20000\u000140=2\u000144=11.5659=1\u000110=117\u0001",
        "8=FIXT.1.1\u00019=175\u000135=8\u000149=ACCEPTOR\u000156=INITIATOR\u000134=38\u000152=20200119-04:45:46.392\u000139=0\u000111=10\u000137=INITIATOR-ACCEPTOR-10\u000117=4\u0001150=0\u0001151=20000\u000155=WTF.AX\u000154=1\u000138=20000\u000144=11.56\u000132=0\u000131=0\u000114=0\u00016=0\u000140=2\u000110=236\u0001",
        "8=FIXT.1.1\u00019=156\u000135=F\u000149=INITIATOR\u000156=ACCEPTOR\u000134=32\u000152=20200119-04:45:53.320\u000141=10\u000137=INITIATOR-ACCEPTOR-10\u000111=11\u000155=WTF.AX\u000154=1\u000160=20200119-04:45:51.569\u000138=20000\u0001100=AUTO\u000110=190\u0001",
        "8=FIXT.1.1\u00019=181\u000135=8\u000149=ACCEPTOR\u000156=INITIATOR\u000134=39\u000152=20200119-04:45:53.331\u000139=6\u000111=11\u000137=INITIATOR-ACCEPTOR-10\u000117=5\u0001150=6\u0001151=20000\u000141=10\u000155=WTF.AX\u000154=1\u000138=20000\u000144=11.56\u000132=0\u000131=0\u000114=0\u00016=0\u000140=2\u000110=243\u0001",
        "8=FIXT.1.1\u00019=128\u000135=9\u000149=ACCEPTOR\u000156=INITIATOR\u000134=41\u000152=20200119-04:46:09.609\u000137=INITIATOR-ACCEPTOR-10\u000139=8\u000141=10\u0001434=1\u000111=11\u000158=Not telling you\u000110=092\u0001"
      ];
      let book = new OrderBook();
      var index = 0;
      for (const text of messages) {
        const message = parseMessage(text);
        if (!message) {
          assert.fail("message failed to parse");
          return;
        }
        assert.equal(book.process(message), true);
        switch (index) {
          case 0:
            assert.equal(book.size, 1);
            break;
          case 1:
            {
            assert.equal(book.size, 1);
            let order = book.orders.values().next().value as Order;
            assert.equal(order.fields[ordStatusTag].value, ordStatusNew);
            }
            break;
          case 2:
            {
            assert.equal(book.size, 1);
            let order = book.orders.values().next().value as Order;
            assert.equal(order.fields[ordStatusTag].value, ordStatusNew);
            }
            break;
          case 3:
            {
            assert.equal(book.size, 1);
            let order = book.orders.values().next().value as Order;
            assert.equal(order.fields[ordStatusTag].value, ordStatusPendingCancel);
            }
            break;
          case 4:
            {
            assert.equal(book.size, 1);
            let order = book.orders.values().next().value as Order;
            assert.equal(order.fields[ordStatusTag].value, ordStatusNew);
            }
            break;
        }
        ++index;
      }
    });

    test('test order cancel replace request for known order accepted', () => {
      const messages: string[] = [
        "8=FIXT.1.1\u00019=149\u000135=D\u000149=INITIATOR\u000156=ACCEPTOR\u000134=37\u000152=20200119-04:47:49.445\u000111=12\u000170=8\u0001100=AUTO\u000155=WTF.AX\u000154=1\u000160=20200119-04:47:47.562\u000138=20000\u000140=2\u000144=11.56\u000159=1\u000110=151\u0001",
        "8=FIXT.1.1\u00019=175\u000135=8\u000149=ACCEPTOR\u000156=INITIATOR\u000134=45\u000152=20200119-04:47:54.334\u000139=0\u000111=12\u000137=INITIATOR-ACCEPTOR-12\u000117=6\u0001150=0\u0001151=20000\u000155=WTF.AX\u000154=1\u000138=20000\u000144=11.56\u000132=0\u000131=0\u000114=0\u00016=0\u000140=2\u000110=237\u0001",
        "8=FIXT.1.1\u00019=188\u000135=G\u000149=INITIATOR\u000156=ACCEPTOR\u000134=39\u000152=20200119-04:48:11.022\u000137=INITIATOR-ACCEPTOR-12\u000141=12\u000111=13\u000170=8\u0001100=AUTO\u000155=WTF.AX\u000154=1\u000160=20200119-04:48:00.074\u000138=30000\u000140=2\u000144=10.35\u000159=1\u000158=Blah\u000110=015\u0001",
        "8=FIXT.1.1\u00019=181\u000135=8\u000149=ACCEPTOR\u000156=INITIATOR\u000134=47\u000152=20200119-04:48:11.031\u000139=E\u000111=13\u000137=INITIATOR-ACCEPTOR-12\u000117=7\u0001150=E\u0001151=20000\u00011=12\u000155=WTF.AX\u000154=1\u000138=20000\u000144=11.56\u000132=0\u000131=0\u000114=0\u00016=0\u000140=2\u000110=018\u0001",
        "8=FIXT.1.1\u00019=177\u000135=8\u000149=ACCEPTOR\u000156=INITIATOR\u000134=48\u000152=20200119-04:48:14.062\u000139=5\u000111=12\u000137=INITIATOR-ACCEPTOR-13\u000117=8\u0001150=5\u0001151=0\u000141=12\u000155=WTF.AX\u000154=1\u000138=30000\u000144=10.35\u000132=0\u000131=0\u000114=0\u00016=0\u000140=2\u000110=059\u0001"  
      ];

    });

    test('test order cancel replace request for known order rejected', () => {
      const messages: string[] = [
        "8=FIXT.1.1\u00019=15035=D\u000149=INITIATOR\u000156=ACCEPTOR34=48\u000152=20200119-04:52:10.221\u000111=14\u000170=10\u0001100=AUTO\u000155=WTF.AX54=1\u000160=20200119-04:52:08.245\u000138=20000\u000140=2\u000144=11.56\u000159=1\u000110=155\u0001",
        "8=FIXT.1.1\u00019=175\u000135=8\u000149=ACCEPTOR\u000156=INITIATOR\u000134=57\u000152=20200119-04:52:13.304\u000139=0\u000111=14\u000137=INITIATOR-ACCEPTOR-14\u000117=9\u0001150=0\u0001151=20000\u000155=WTF.AX\u000154=1\u000138=20000\u000144=11.56\u000132=0\u000131=0\u000114=0\u00016=0\u000140=2\u000110=235\u0001",
        "8=FIXT.1.1\u00019=189\u000135=G\u000149=INITIATOR\u000156=ACCEPTOR\u000134=50\u000152=20200119-04:52:29.864\u000137=INITIATOR-ACCEPTOR-14\u000141=14\u000111=15\u000170=10\u0001100=AUTO\u000155=WTF.AX\u000154=1\u000160=20200119-04:52:19.840\u000138=35000\u000140=2\u000144=12.10\u000159=1\u000158=Blah\u000110=080\u0001",
        "8=FIXT.1.1\u00019=182\u000135=8\u000149=ACCEPTOR\u000156=INITIATOR\u000134=59\u000152=20200119-04:52:29.874\u000139=E\u000111=15\u000137=INITIATOR-ACCEPTOR-14\u000117=10\u0001150=E\u0001151=20000\u000141=14\u000155=WTF.AX\u000154=1\u000138=20000\u000144=11.56\u000132=0\u000131=0\u000114=0\u00016=0\u000140=2\u000110=089\u0001",
        "8=FIXT.1.1\u00019=124\u000135=9\u000149=ACCEPTOR\u000156=INITIATOR\u000134=60\u000152=20200119-04:52:40.220\u000137=INITIATOR-ACCEPTOR-14\u000139=8\u000141=14\u0001434=2\u000111=15\u000158=Not telling\u000110=214\u0001"  
      ];

    });

});
