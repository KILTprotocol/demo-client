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

var scss = {
  test: /\.scss$/,
  use: [
    require.resolve('style-loader'),
    {
      loader: require.resolve('css-loader'),
      options: {
        importLoaders: 1,
      },
    },
    {
      loader: require.resolve('postcss-loader'),
      options: {
        // Necessary for external CSS imports to work
        // https://github.com/facebookincubator/create-react-app/issues/2677
        ident: 'postcss',
        plugins: () => [
          require('postcss-flexbugs-fixes'),
          autoprefixer({
                         browsers: [
                           '>1%',
                           'last 4 versions',
                           'Firefox ESR',
                           'not ie < 9', // React doesn't support IE8 anyway
                         ],
                         flexbox: 'no-2009',
                       }),
        ],
      },
    },
    {
      loader: require.resolve('sass-loader'),
    },
    {
      loader: require.resolve('sass-resources-loader'),
      options: {
        resources: [
          './src/styles/_library.scss',
        ],
      },
    },
  ],
};

CRAconfig.module.rules[1].oneOf.splice(CRAconfig.module.rules[1].oneOf.length - 2, 0, less);
CRAconfig.module.rules[1].oneOf.splice(CRAconfig.module.rules[1].oneOf.length - 2, 0, scss);

module.exports = CRAconfig;
