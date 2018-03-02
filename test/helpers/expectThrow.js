export default async (promise, errorName) => {
  try {
    await promise;
  } catch (error) {
    assert(error.name == errorName, 'Unexpected error name: ' + error.name);
    return;
  }
  assert.fail('Expected throw not received');
};
