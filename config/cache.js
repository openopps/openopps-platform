console.log('Loading... ', __filename);

/**
 * Cache settings
 *
 * Uses koa-cache-control middleware.
 *
 * For more information on configuration, check out:
 * https://github.com/DaMouse404/koa-cache-control/blob/master/README.md
 */

module.exports.cache = {
  public: {
    public: true,
    maxAge: 60 * 60 * 24, // 1 day
  },
  private: {
    private: true,
    mustRevalidate: true,
    maxAge: 60 * 60, // 1 hour
  },
  noStore: {
    noStore: true,
    noCache: true,
    mustRevalidate: true,
    maxAge: 0,
  },
};
