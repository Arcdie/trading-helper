const axios = require('axios');

const {
  isMongoId,
} = require('validator');

module.exports = async (req, res, next) => {
  const {
    query: {
      userId,
      listId,
    },

    user,
  } = req;

  if (!listId || !isMongoId(listId)) {
    return res.json({
      success: false,
      text: 'No or invalid listId',
    });
  }

  if (!userId || !isMongoId(userId)) {
    return res.json({
      success: false,
      text: 'No or invalid userId',
    });
  }

  if (userId.toString() !== user._id.toString()) {
    return res.json({
      success: false,
      text: 'Access denied',
    });
  }

  if (listId.toString() !== user.tradingview_list_id.toString()) {
    return res.json({
      success: false,
      text: 'User chose another list id',
    });
  }

  const responseGetListInstruments = await axios({
    method: 'get',
    url: `https://ru.tradingview.com/api/v1/symbols_list/custom/${listId}`,
    headers: {
      'content-type': 'application/json',
      Cookie: `sessionid=${user.tradingview_session_id};`,
    },
  });

  return res.json({
    status: true,
    result: responseGetListInstruments.data.symbols,
  });
};
