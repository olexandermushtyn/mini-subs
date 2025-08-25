module.exports = async () => {
  if (global.__PG__) {
    await global.__PG__.stop();
  }
};
