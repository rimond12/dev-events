import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { connectMock } = vi.hoisted(() => ({ connectMock: vi.fn() }));

vi.mock('mongoose', () => ({
  default: { connect: connectMock },
}));

describe('connectDB (lib/mongodb.ts)', () => {
  const ORIGINAL_MONGODB_URI = process.env.MONGODB_URI;

  beforeEach(() => {
    vi.resetModules();
    connectMock.mockReset();
    delete (global as unknown as { mongoose?: unknown }).mongoose;
  });

  afterEach(() => {
    if (ORIGINAL_MONGODB_URI === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = ORIGINAL_MONGODB_URI;
    }
  });

  it('throws a descriptive error when MONGODB_URI is not defined', async () => {
    delete process.env.MONGODB_URI;
    const { default: connectDB } = await import('./mongodb');

    await expect(connectDB()).rejects.toThrow(
      'Please define the MONGODB_URI environment variable inside .env.local'
    );
    expect(connectMock).not.toHaveBeenCalled();
  });

  it('connects and caches the connection on success', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    const fakeConnection = { fake: true };
    connectMock.mockResolvedValue(fakeConnection);
    const { default: connectDB } = await import('./mongodb');

    const conn = await connectDB();

    expect(conn).toBe(fakeConnection);
    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(connectMock).toHaveBeenCalledWith(
      'mongodb://localhost:27017/test',
      expect.objectContaining({ bufferCommands: false })
    );
    expect(
      (global as unknown as { mongoose: { conn: unknown } }).mongoose.conn
    ).toBe(fakeConnection);
  });

  it('reuses the cached connection on subsequent calls without reconnecting', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    connectMock.mockResolvedValue({ fake: true });
    const { default: connectDB } = await import('./mongodb');

    await connectDB();
    await connectDB();
    await connectDB();

    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  it('shares a single in-flight connection promise for concurrent calls', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    let resolveConnect: (value: unknown) => void = () => {};
    connectMock.mockReturnValue(
      new Promise((resolve) => {
        resolveConnect = resolve;
      })
    );
    const { default: connectDB } = await import('./mongodb');

    const first = connectDB();
    const second = connectDB();

    resolveConnect({ fake: true });

    const [connA, connB] = await Promise.all([first, second]);

    expect(connA).toEqual({ fake: true });
    expect(connB).toBe(connA);
    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  it('resets the cached promise on connection failure so a subsequent retry can succeed', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    connectMock
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce({ fake: true });
    const { default: connectDB } = await import('./mongodb');

    await expect(connectDB()).rejects.toThrow('network error');
    const conn = await connectDB();

    expect(conn).toEqual({ fake: true });
    expect(connectMock).toHaveBeenCalledTimes(2);
  });
});