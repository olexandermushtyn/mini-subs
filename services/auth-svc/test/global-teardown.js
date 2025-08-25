module.exports = async () => {
  if (global.__PG__) {
    await global.__PG__.stop();
  }
  if (global.__REDIS__) {
    await global.__REDIS__.stop();
  }
};
