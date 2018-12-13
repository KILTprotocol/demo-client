var CRAconfig = require('./_webpack.config.prod.js');

var less = {
  test: /\.less$/,
  use: [
    {
      loader: 'style-loader',
    },
    {
      loader: 'css-loader',
      options: {
        sourceMap: true,
        modules: false,
        localIdentName: '[local]___[hash:base64:5]',
      },
    },
    {
      loader: 'less-loader',
    },
  ],
};

CRAconfig.module.rules[1].oneOf.splice(CRAconfig.module.rules[1].oneOf.length - 2, 0, less);

module.exports = CRAconfig;
