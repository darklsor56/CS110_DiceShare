require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");

function getTestDatabaseUri() {
  if(process.env.MONGO_URI_TEST) {
    return process.env.MONGO_URI_TEST;
  }

  if(!process.env.MONGO_URI) {
    throw new Error("MONGO_URI_TEST or MONGO_URI must be set before running tests.");
  }

  const testUri = new URL(process.env.MONGO_URI);
  const developmentDatabase = testUri.pathname.replace(/^\//, "") || "diceshare";
  testUri.pathname = `/${developmentDatabase}_test`;

  return testUri.toString();
}

const testDatabaseUri = getTestDatabaseUri();
const testDatabaseName = new URL(testDatabaseUri).pathname.replace(/^\//, "");

if(!testDatabaseName.toLowerCase().includes("test")) {
  throw new Error("Tests must use a database with 'test' in its name.");
}

beforeAll(async() => {
  await mongoose.connect(testDatabaseUri);
});

beforeEach(async() => {
  const collections = Object.values(mongoose.connection.collections);

  for(const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async() => {
  const collections = Object.values(mongoose.connection.collections);

  for(const collection of collections) {
    await collection.deleteMany({});
  }

  await mongoose.connection.close();
});
