namespace Jadify.API.Shared.Constants;

public static class JadifyConstants
{
    public static class Tiers
    {
        public const decimal FreeFeePercent    = 0.02m;
        public const decimal GrowthFeePercent  = 0.005m;
        public const decimal ProFeePercent     = 0.00m;

        public const decimal GrowthMonthlyPrice = 29.00m;
        public const decimal ProMonthlyPrice    = 79.00m;
    }

    public static class Stripe
    {
        public const string GrowthPriceId = "price_xxx_growth";
        public const string ProPriceId    = "price_xxx_pro";
    }
}
