CREATE OR REPLACE FUNCTION get_platform_analytics()
RETURNS TABLE (
    total_transaction_volume float8,
    total_value_locked float8,
    new_users_last_30_days int8,
    new_merchants_last_30_days int8
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT SUM(amount) FROM "Loan"),
        (SELECT SUM("totalValueLocked") FROM "LiquidityPool"),
        (SELECT COUNT(*) FROM "User" WHERE "createdAt" >= NOW() - INTERVAL '30 days'),
        (SELECT COUNT(*) FROM "MerchantStore" WHERE "createdAt" >= NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql;
