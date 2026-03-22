const appJson = require('./app.json');

module.exports = () => {
  const config = appJson.expo || {};

  return {
    ...config,
    extra: {
      eas: { projectId: "620a21b8-90ad-4d82-b468-38f48b8f43ac" },
    }
  };
};
