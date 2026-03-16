const appJson = require('./app.json');

module.exports = () => {
  const config = appJson.expo || {};

  return {
    ...config,
  };
};
