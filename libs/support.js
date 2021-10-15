exports.getUnix = () => parseInt(new Date().getTime() / 1000, 10);

exports.sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
