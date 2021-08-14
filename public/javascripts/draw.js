/* global
  $charts
*/

/* Constants */

/* JQuery */

/* Settings */

/* Functions */

const draw = (files) => {
  files.forEach(file => {
    file.modes = [{
      name: 'horizontal-line',
      isActive: false,
    }];
  });

  $charts
    .on('click', '.paint-panel div', function () {
      const $mode = $(this);
      const $stock = $mode.closest('.stock');

      const typeMode = $mode.data('type');
      const stockName = $stock.attr('id');
      const isActive = $mode.hasClass('active');

      const targetStock = files.find(file => file.stockName === stockName);

      targetStock.modes.forEach(mode => {
        mode.isActive = false;
      });

      $stock
        .find('.paint-panel div')
        .removeClass('active');

      if (!isActive) {
        const targetMode = targetStock.modes.find(mode => mode.name === typeMode);
        targetMode.isActive = true;

        $stock
          .find(`.paint-panel div.${typeMode}`)
          .addClass('active');
      }
    });

  files.forEach(file => {
    file.charts.forEach(chartWrapper => {
      chartWrapper.chart.subscribeClick(param => {
        const activeMode = file.modes.find(mode => mode.isActive);

        const price = chartWrapper.series.coordinateToPrice(param.point.y);

        if (activeMode) {
          if (activeMode.name === 'horizontal-line') {
            file.charts.forEach(wrapper => {
              wrapper.addPriceLine(price);
            });

            $(`#${file.stockName} .paint-panel .${activeMode.name}`)
              .first()
              .click();
          }
        } else {
          const allowedVariation = price / (100 / 0.1);
          const valuePlusVariation = price + allowedVariation;
          const valueMinusVariation = price - allowedVariation;

          const priceLine = chartWrapper.setPriceLines.find(
            ({ value }) => value < valuePlusVariation && value > valueMinusVariation,
          );

          if (priceLine) {
            file.charts.forEach(wrapper => {
              wrapper.removePriceLine(priceLine.value);
            });
          }
        }
      });
    });
  });
};
