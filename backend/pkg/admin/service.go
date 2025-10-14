package admin

import (
	"context"
	"encoding/json"
	"fmt"
	"kelo-backend/pkg/models"

	"github.com/supabase-community/supabase-go"
)

type Service struct {
	db *supabase.Client
}

func NewService(db *supabase.Client) *Service {
	return &Service{db: db}
}

// GetUsers retrieves a paginated list of users.
func (s *Service) GetUsers(ctx context.Context, page, pageSize int, search string) ([]models.Profile, error) {
	from := (page - 1) * pageSize
	to := from + pageSize - 1
	var users []models.Profile

	query := s.db.From("profiles").Select("*", "exact", false).Range(from, to, "")
	if search != "" {
		query = query.Or(fmt.Sprintf("first_name.ilike.%s,last_name.ilike.%s,email.ilike.%s", search, search, search))
	}

	jsonString, _, err := query.Execute()
	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal([]byte(jsonString), &users); err != nil {
		return nil, err
	}

	return users, nil
}

// GetUser retrieves a single user by their ID.
func (s *Service) GetUser(ctx context.Context, userID string) (*models.Profile, error) {
	var user models.Profile

	jsonString, _, err := s.db.From("profiles").Select("*", "exact", false).Eq("id", userID).Single().Execute()
	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal([]byte(jsonString), &user); err != nil {
		return nil, err
	}

	return &user, nil
}

// UpdateUserStatus updates the status of a user.
func (s *Service) UpdateUserStatus(ctx context.Context, userID string, status string) error {
	updateData := map[string]string{
		"status": status,
	}
	_, _, err := s.db.From("profiles").Update(updateData, "", "").Eq("id", userID).Execute()
	return err
}

// ChangeUserRole updates the role of a user.
func (s *Service) ChangeUserRole(ctx context.Context, userID string, role string) error {
	updateData := map[string]string{
		"role": role,
	}
	_, _, err := s.db.From("profiles").Update(updateData, "", "").Eq("id", userID).Execute()
	return err
}

// GetMerchants retrieves a paginated list of merchants, with optional status filtering.
func (s *Service) GetMerchants(ctx context.Context, page, pageSize int, status, search string) ([]models.MerchantStore, error) {
	from := (page - 1) * pageSize
	to := from + pageSize - 1
	var merchants []models.MerchantStore

	query := s.db.From("merchant_stores").Select("*", "exact", false).Range(from, to, "")
	if status != "" {
		query = query.Eq("status", status)
	}
	if search != "" {
		query = query.Ilike("name", "%"+search+"%")
	}

	jsonString, _, err := query.Execute()
	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal([]byte(jsonString), &merchants); err != nil {
		return nil, err
	}

	return merchants, nil
}

// GetMerchant retrieves a single merchant by their ID.
func (s *Service) GetMerchant(ctx context.Context, merchantID string) (*models.MerchantStore, error) {
	var merchant models.MerchantStore

	jsonString, _, err := s.db.From("merchant_stores").Select("*", "exact", false).Eq("id", merchantID).Single().Execute()
	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal([]byte(jsonString), &merchant); err != nil {
		return nil, err
	}

	return &merchant, nil
}

// UpdateMerchantStatus updates the status of a merchant.
func (s *Service) UpdateMerchantStatus(ctx context.Context, merchantID string, status string) error {
	updateData := map[string]string{
		"status": status,
	}
	_, _, err := s.db.From("merchant_stores").Update(updateData, "", "").Eq("id", merchantID).Execute()
	return err
}

// GetPlatformAnalytics calculates and retrieves key platform-wide metrics.
func (s *Service) GetPlatformAnalytics(ctx context.Context) (*models.PlatformAnalytics, error) {
	var analytics []models.PlatformAnalytics

	// Note: The Rpc method in this library version returns only a string.
	// Errors are handled by returning an empty string, which will then fail to unmarshal.
	jsonString := s.db.Rpc("get_platform_analytics", "", nil)

	if err := json.Unmarshal([]byte(jsonString), &analytics); err != nil {
		return nil, fmt.Errorf("failed to execute or unmarshal analytics RPC call: %w", err)
	}

	if len(analytics) == 0 {
		return nil, fmt.Errorf("no analytics data returned")
	}

	return &analytics[0], nil
}
