/**
 * Unit tests for lib/mongodb.ts
 *
 * mongoose.connect() is mocked so these tests run without a real database.
 * Because connectDB() reads process.env.MONGODB_URI and initializes its
 * module-level cache at import time, each test re-imports the module with
 * `jest.resetModules()` so it can control the environment variable and the
 * cached connection state independently.
 */

describe('connectDB', () => {
  const ORIGINAL_ENV = { ...process.env };
  let mockConnect: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    delete (global as unknown as { mongoose?: unknown }).mongoose;

    mockConnect = jest.fn();
    jest.doMock('mongoose', () => ({
      __esModule: true,
      default: { connect: mockConnect },
    }));
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.dontMock('mongoose');
  });

  it('throws a descriptive error when MONGODB_URI is not defined', async () => {
    delete process.env.MONGODB_URI;
    const { default: connectDB } = await import('./mongodb');

    await expect(connectDB()).rejects.toThrow(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it('connects using the configured MONGODB_URI and disables command buffering', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
    const fakeConnection = { connection: { readyState: 1 } };
    mockConnect.mockResolvedValue(fakeConnection);

    const { default: connectDB } = await import('./mongodb');
    const result = await connectDB();

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockConnect).toHaveBeenCalledWith('mongodb://localhost:27017/test-db', {
      bufferCommands: false,
    });
    expect(result).toBe(fakeConnection);
  });

  it('reuses the cached connection on subsequent calls without reconnecting', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
    const fakeConnection = { connection: { readyState: 1 } };
    mockConnect.mockResolvedValue(fakeConnection);

    const { default: connectDB } = await import('./mongodb');
    const first = await connectDB();
    const second = await connectDB();

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it('reuses an in-flight connection promise for concurrent calls', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
    let resolveConnect: (value: unknown) => void = () => {};
    mockConnect.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveConnect = resolve;
        })
    );

    const { default: connectDB } = await import('./mongodb');
    const first = connectDB();
    const second = connectDB();

    resolveConnect({ connection: { readyState: 1 } });
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(firstResult).toBe(secondResult);
  });

  it('resets the cached promise and rethrows when the connection attempt fails, allowing retry', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';
    const connectionError = new Error('ECONNREFUSED');
    mockConnect.mockRejectedValueOnce(connectionError);

    const { default: connectDB } = await import('./mongodb');
    await expect(connectDB()).rejects.toThrow('ECONNREFUSED');

    const fakeConnection = { connection: { readyState: 1 } };
    mockConnect.mockResolvedValueOnce(fakeConnection);
    const result = await connectDB();

    expect(result).toBe(fakeConnection);
    expect(mockConnect).toHaveBeenCalledTimes(2);
  });
});