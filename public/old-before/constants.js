const ALLOWED_PERIODS = new Map([
  ['DAY', 'day'],
]);

const constants = {
  windowWidth: window.innerWidth,
  windowHeight: window.innerHeight,

  containerName: 'container',
  containerDocument: $('#container'),

  containerWidth: 0,
  containerHeight: 0,

  defaultPeriod: ALLOWED_PERIODS.get('DAY'),
};
