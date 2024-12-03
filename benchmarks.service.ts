const baseQuery = db
  .select({
    // ... existing select fields ...
    averageTokensPerSecond: sql`ROUND(avg(${benchmarksLLM.averageTokensPerSecond})::numeric, 2)`,
    pricePerHour: sql`MAX(${markets.usdRewardPerHour})`,
    pricePerMillionTokens: sql`
      CASE
        WHEN avg(${benchmarksLLM.averageTokensPerSecond}) > 0
        THEN ROUND((MAX(${markets.usdRewardPerHour}) / (avg(${benchmarksLLM.averageTokensPerSecond}) * 3600)) * 1e6, 4)
        ELSE 0
      END
    `,
    // ... existing select fields ...
  })
  // ... existing code ... 