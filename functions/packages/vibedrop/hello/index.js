exports.main = async function () {
  return {
    statusCode: 200,
    body: {
      message: "Hello from DigitalOcean Functions!",
      time: new Date().toISOString()
    }
  };
};