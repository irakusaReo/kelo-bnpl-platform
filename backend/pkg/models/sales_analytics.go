package models

// SalesAnalytics represents aggregated sales data for a merchant.
type SalesAnalytics struct {
	TotalRevenue     float64   `json:"total_revenue"`
	SalesVolume      int       `json:"sales_volume"`
	TopSellingProducts []Product `json:"top_selling_products"`
}
