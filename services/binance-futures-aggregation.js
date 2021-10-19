const moment = require('moment');
const WebSocketClient = require('ws');

const redis = require('../libs/redis');

const log = require('../libs/logger');

const {
  sendMessage,
} = require('./telegram-bot');

const {
  getUnix,
} = require('../libs/support');

const Instrument = require('../models/Instrument');
const InstrumentTickBound = require('../models/InstrumentTickBound');

const instrumentsMapper = {};

const CONNECTION_NAME = 'Connection-AggTrade';

module.exports = async () => {
  const instrumentsDocs = await Instrument.find({
    // tmp
    name_futures: 'ZENUSDTPERP',

    is_active: true,
  }, {
    name_futures: 1,
    does_exist_robot: 1,
    tick_sizes_for_robot: 1,
  }).exec();

  if (!instrumentsDocs || !instrumentsDocs.length) {
    return true;
  }

  if (instrumentsDocs && instrumentsDocs.length > 140) {
    throw new Error(`${CONNECTION_NAME}: > 140 streams to binance`);
  }

  instrumentsDocs.forEach(doc => {
    if (doc.does_exist_robot) {
      let minTickSize = doc.tick_sizes_for_robot[0].value;

      doc.tick_sizes_for_robot.forEach(tickSize => {
        if (tickSize.value < minTickSize) {
          minTickSize = tickSize.value;
        }
      });

      instrumentsMapper[doc.name_futures] = {
        instrumentId: doc._id,

        minTickSize,
        tickSizes: doc.tick_sizes_for_robot,

        // updated params
        tickHistory: [],
        lastUpdate: getUnix(),
        trackingTick: false,
        isActiveMonitoring: false,
      };
    }
  });

  let sendPongInterval;
  let checkTickSizesInterval;
  let connectStr = 'wss://fstream.binance.com/stream?streams=';

  instrumentsDocs.forEach(doc => {
    const cutName = doc.name_futures.toLowerCase().replace('perp', '');
    connectStr += `${cutName}@aggTrade/`;
  });

  const websocketConnect = () => {
    const client = new WebSocketClient(connectStr);

    client.on('open', () => {
      log.info(`${CONNECTION_NAME} was opened`);
      sendMessage(260325716, `${CONNECTION_NAME} was opened`);

      sendPongInterval = setInterval(() => {
        client.send('pong');
      }, 1000 * 60); // 1 minute

      checkTickSizesInterval = setInterval(() => {
        Object
          .keys(instrumentsMapper)
          .forEach(async instrumentName => {
            const {
              tickHistory,
              trackingTick,
              instrumentId,
            } = instrumentsMapper[instrumentName];

            const unixNow = getUnix();
            const lHistory = tickHistory.length;

            if (!lHistory) {
              return true;
            }

            const lastTick = tickHistory[lHistory - 1];
            const timeLastTick = lastTick.time;

            let isEndMonitoring = false;

            if (lHistory > 1) {
              let maxTimeDifferenceBetweenTicks = Math.abs(tickHistory[0].value - tickHistory[1].value);

              for (let i = 0; i < lHistory; i += 1) {
                for (let j = 0; j < lHistory; j += 1) {
                  const timeDifferenceBetweenTicks = Math.abs(tickHistory[i].value - tickHistory[j].value);

                  if (timeDifferenceBetweenTicks > maxTimeDifferenceBetweenTicks) {
                    maxTimeDifferenceBetweenTicks = timeDifferenceBetweenTicks;
                  }
                }
              }

              if ((unixNow - timeLastTick) >= maxTimeDifferenceBetweenTicks * 10) {
                isEndMonitoring = true;

                if (lHistory >= 1) {
                  const firstTick = tickHistory[0];

                  const newBound = new InstrumentTickBound({
                    instrument_id: instrumentId,
                    instrument_tick_id: trackingTick.tickId,

                    start_price: firstTick.price,
                    end_price: lastTick.price,

                    started_at: new Date(firstTick.time * 1000),
                    ended_at: new Date(lastTick.time * 1000),

                    number_ticks: lHistory,
                  });

                  await newBound.save();
                }
              }
            } else if ((unixNow - timeLastTick) >= 10) {
              isEndMonitoring = true;
            }

            if (isEndMonitoring) {
              if (tickHistory.length >= 5) {
                sendMessage(260325716, `${instrumentName}
Робот ${trackingTick.value} ${trackingTick.direction}
Тик: ${tickHistory.length}`);
              }

              instrumentsMapper[instrumentName].tickHistory = [];
              instrumentsMapper[instrumentName].lastUpdate = getUnix();
              instrumentsMapper[instrumentName].trackingTick = false;
              instrumentsMapper[instrumentName].isActiveMonitoring = false;
            }
          });
      }, 1000 * 3); // 3 seconds
    });

    client.on('ping', () => {
      client.send('pong');
    });

    client.on('close', message => {
      log.info(`${CONNECTION_NAME} was closed`);
      sendMessage(260325716, `${CONNECTION_NAME} was closed (${message})`);
      clearInterval(sendPongInterval);
      clearInterval(checkTickSizesInterval);

      websocketConnect();
    });

    client.on('message', async bufferData => {
      const parsedData = JSON.parse(bufferData.toString());

      if (!parsedData.data || !parsedData.data.e) {
        console.log(`${CONNECTION_NAME}: ${parsedData}`, parsedData);
        return true;
      }

      let {
        data: {
          s: instrumentName,
          q: quantity,
          p: price,
          m: direction,
        },
      } = parsedData;

      price = parseFloat(price);
      quantity = parseFloat(quantity);

      const startMinuteUnix = moment().startOf('minute').unix();
      const key = `INSTRUMENT:${instrumentName}PERP:sumAggTrade:${startMinuteUnix}`;

      let cacheDoc = await redis.getAsync(key);

      if (!cacheDoc) {
        cacheDoc = quantity;
      } else {
        const parsedDoc = parseFloat(cacheDoc);
        cacheDoc = parsedDoc + quantity;
      }

      await redis.setAsync([
        key,
        cacheDoc.toFixed(2),
        'EX',
        1 * 60 * 60, // 1 hour
      ]);

      const targetInstrument = instrumentsMapper[`${instrumentName}PERP`];

      if (targetInstrument) {
        if (quantity >= targetInstrument.minTickSize) {
          direction = direction === true ? 'short' : 'long';

          // console.log(`${instrumentName}PERP, ${quantity} ${direction === false ? 'long' : ''}`);

          if (!targetInstrument.isActiveMonitoring) {
            const doesExistTickWithThisQuantity = targetInstrument.tickSizes.find(
              tickSize => tickSize.value === quantity
                && tickSize.direction === direction,
            );

            if (doesExistTickWithThisQuantity) {
              targetInstrument.lastUpdate = getUnix();
              targetInstrument.isActiveMonitoring = true;

              targetInstrument.tickHistory.push({
                price,
                value: quantity,
                time: targetInstrument.lastUpdate,
              });
  /*
              sendMessage(260325716, `${instrumentName}
  Робот ${quantity} ${direction}
  Тик: 1`);
  */

              targetInstrument.trackingTick = doesExistTickWithThisQuantity;
              targetInstrument.trackingTick.tickId = doesExistTickWithThisQuantity._id;
            }
          } else if (quantity === targetInstrument.trackingTick.value
            && direction === targetInstrument.trackingTick.direction) {
            targetInstrument.lastUpdate = getUnix();

            targetInstrument.tickHistory.push({
              price,
              value: quantity,
              time: targetInstrument.lastUpdate,
            });

  /*
            const lHistory = targetInstrument.tickHistory.length;

            if (lHistory >= 5) {
              sendMessage(260325716, `${instrumentName}
  Робот ${quantity} ${direction}
  Тик: ${lHistory}`);
            }
  */
          }
        }
      }
    });
  };

  websocketConnect();
};
