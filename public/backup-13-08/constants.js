const ALLOWED_PERIODS = new Map([
  ['DAY', 'day'],
]);

const constants = {
  windowWidth: window.innerWidth,
  windowHeight: window.innerHeight,

  containerName: 'chart',
  containerDocument: $('#chart'),

  containerWidth: 0,
  containerHeight: 0,

  defaultPeriod: ALLOWED_PERIODS.get('DAY'),
};
