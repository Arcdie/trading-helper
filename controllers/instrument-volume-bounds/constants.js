const LIMITER_RANGE_FOR_LIMIT_ORDERS = 2; // %
const REMOVE_INACTIVE_LIMIT_ORDERS_AFTER = 7200; // seconds

const DIVIDER_FOR_SPOT_VOLUME = 3;
const DIVIDER_FOR_FUTURES_VOLUME = 4;

module.exports = {
  LIMITER_RANGE_FOR_LIMIT_ORDERS,
  REMOVE_INACTIVE_LIMIT_ORDERS_AFTER,

  DIVIDER_FOR_SPOT_VOLUME,
  DIVIDER_FOR_FUTURES_VOLUME,
};
