const moment = require('moment');
const WebSocketClient = require('ws');

const log = require('../../../libs/logger');

const {
  sendMessage,
} = require('../../telegram-bot');

const {
  createFuturesListenKey,
} = require('../../../controllers/binance/utils/futures/create-futures-listen-key');

const {
  activateUserTradeBound,
} = require('../../../controllers/user-trade-bounds/utils/activate-user-trade-bound');

const {
  deactivateUserTradeBound,
} = require('../../../controllers/user-trade-bounds/utils/deactivate-user-trade-bound');

const {
  getActiveUserBinanceBounds,
} = require('../../../controllers/user-binance-bounds/utils/get-active-user-binance-bounds');

const UserBinanceBound = require('../../../models/UserBinanceBound');

const CONNECTION_NAME = 'Futures:listenKey';

module.exports = async () => {
  try {
    const timeNow = moment().unix();
    const userBinanceBounds = await getUserBinanceBounds();

    for (const userBinanceBound of userBinanceBounds) {
      const listenKeyUpdatedAt = moment(userBinanceBound.listen_key_updated_at).utc().unix();
      const differenceBetweenDates = timeNow - listenKeyUpdatedAt;

      if (differenceBetweenDates > (60 * 30)) {
        await keepaliveListenKey(userBinanceBound);
      }

      let sendPongInterval;
      const connectStr = `wss://fstream.binance.com/ws/${userBinanceBound.listen_key}`;

      const websocketConnect = () => {
        const client = new WebSocketClient(connectStr);
        const connectionName = `${CONNECTION_NAME}:${userBinanceBound.listen_key}`;

        client.on('open', () => {
          log.info(`${connectionName} was opened`);

          sendPongInterval = setInterval(() => {
            keepaliveListenKey(userBinanceBound);
          }, 30 * 60 * 1000); // 30 minutes
        });

        client.on('ping', () => {
          client.pong();
        });

        client.on('close', (message) => {
          log.info(`${connectionName} was closed`);

          if (message !== 1006) {
            sendMessage(260325716, `${connectionName} was closed (${message})`);
          }

          clearInterval(sendPongInterval);
          websocketConnect();
        });

        client.on('message', async bufferData => {
          const parsedData = JSON.parse(bufferData.toString());

          if (!parsedData.e) {
            log.warn(`${connectionName}: ${JSON.stringify(parsedData)}`);
            return true;
          }

          switch (parsedData.e) {
            case 'listenKeyExpired': {
              console.log('listenKeyExpired');
              await keepaliveListenKey(userBinanceBound); break;
            }

            case 'ORDER_TRADE_UPDATE': {
              const {
                s: instrumentName,
                o: orderType,
                ot: originalOrderType,
                ap: price,
                X: status,
                i: orderId,
              } = parsedData.o;

              if (status === 'FILLED' && ['LIMIT', 'MARKET'].includes(orderType)) {
                if (originalOrderType === 'MARKET') {
                  const resultActivate = await activateUserTradeBound({
                    binanceTradeId: orderId,
                    instrumentPrice: parseFloat(price),
                    instrumentName: `${instrumentName}PERP`,
                  });

                  if (!resultActivate || !resultActivate.status) {
                    log.warn(resultActivate.message || 'Cant activateUserTradeBound');
                  }
                } else if (originalOrderType === 'STOP_MARKET') {
                  const resultDeactivate = await deactivateUserTradeBound({
                    instrumentPrice: parseFloat(price),
                    binanceStopLossTradeId: orderId,
                  });

                  if (!resultDeactivate || !resultDeactivate.status) {
                    log.warn(resultDeactivate.message || 'Cant deactivateUserTradeBound');
                  }
                }
              }

              break;
            }

            default: break;
          }
        });
      };

      websocketConnect();
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};

const getUserBinanceBounds = async () => {
  const resultGetUserBinanceBounds = await getActiveUserBinanceBounds();

  if (!resultGetUserBinanceBounds || !resultGetUserBinanceBounds.status) {
    log.warn(resultGetUserBinanceBounds.message || 'Cant getActiveUserBinanceBounds');
    return [];
  }

  return resultGetUserBinanceBounds.result;
};

const keepaliveListenKey = async (bound) => {
  const resultRequestCreateListenKey = await createFuturesListenKey({
    apikey: bound.apikey,
  });

  if (!resultRequestCreateListenKey || !resultRequestCreateListenKey.status) {
    log.warn(resultRequestCreateListenKey.message || 'Cant createFuturesListenKey');
    return false;
  }

  const resultCreateListenKey = resultRequestCreateListenKey.result;

  if (!resultCreateListenKey || !resultCreateListenKey.listenKey) {
    log.warn('No resultCreateListenKey');
    return false;
  }

  const updateObj = {
    listen_key_updated_at: new Date(),
  };

  if (resultCreateListenKey.listenKey !== bound.listen_key) {
    updateObj.listen_key = resultCreateListenKey.listenKey;
    bound.listen_key = updateObj.listen_key;
  }

  await UserBinanceBound.findByIdAndUpdate(bound._id, updateObj).exec();
};
