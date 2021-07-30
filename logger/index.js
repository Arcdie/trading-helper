class Logger {
  static info(params) {
    console.log(`INFO: ${params}`);
  }

  static warn(params) {
    console.log(`WARNING: ${params}`);
  }

  static error(params) {
    console.log(`ERROR: ${params}`);
  }
}

module.exports = Logger;
