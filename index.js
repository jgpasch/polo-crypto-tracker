'use strict';
const autobahn = require('autobahn');
const notifier = require('node-notifier');
const _ = require('lodash');

/**
 * Add the tokens you want to watch here.
 * Preface the token with BTC_ if you want to see the btc market price.
 */
const tokensToWatch = ['BTC_DGB', 'BTC_SC', 'BTC_XRP', 'BTC_STR', 'BTC_BCN'];

/**
 * Choose what percent change you want to be the threshold
 * for a notification
 */
const meaningfulPercentChange = .015;

/**
 * Use autobahn to create a websocket connection.
 */
const wsuri = 'wss://api.poloniex.com';
const conn = new autobahn.Connection({
  url: wsuri,
  realm: 'realm1'
});

/**
 * Dictionary to hold the values of the coins.
 */
let currentValues = {
  'BTC_DGB': 0,
  'BTC_SC': 0,
  'BTC_XRP': 0,
  'BTC_STR': 0,
  'BTC_BCN': 0
}

/**
 * Setup event functions on a connection open event.
 */
conn.onopen = function(session) {
  console.log('setting up watcher functions now...');
  function marketEvent(args, kwargs) {
    // Not using the market event yet.
  }

  /**
   * args[0] is the coin name such as BTC_XRP
   * args[1] is the last price.
   */
  function tickerEvent(args, kwargs) {
    const coin = args[0];
    const last = args[1];

    // if the new info is about a token we care about
    if (_.includes(tokensToWatch, coin)) {

      // program has just started, this is the first update to this coin.
      if (currentValues[coin] === 0) {
        // set the current value for the coin at the new price.
        currentValues[coin] = last;
      } else {
        // else this is jsut another coin update, only
        // notify me if its a meaningful change.
        if (last / currentValues[coin] >= (1 + meaningfulPercentChange)) {
          currentValues[coin] = last;
          notifier.notify({
            'title': coin.slice(4),
            'message': 'up: ' + currentValues[coin]
          });
        } else if ((last / currentValues[coin]) <= (1 - meaningfulPercentChange)) {
            currentValues[coin] = last;
            notifier.notify({
              'title': coin.slice(4),
              'message': 'down: ' + currentValues[coin]
            });
        }
      }
    }
  }

  // don't care about trollbox event right now
  function trollboxEvent(args, kwargs) {
    // console.log(args);
  }

  // subscribe to the events.
  // Really am only using ticker event right now
	session.subscribe('BTC_XMR', marketEvent);
	session.subscribe('ticker', tickerEvent);
	session.subscribe('trollbox', trollboxEvent);

  notifier.notify({
    'title': 'Connected Successfully',
    'message': `You will be notified upon coin changes of ${meaningfulPercentChange} or more`
  });
}

conn.onclose = function() {
  console.log('web socket conn closed');
}

conn.open();
