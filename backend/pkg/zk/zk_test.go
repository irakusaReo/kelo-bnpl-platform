package zk

import (
	"context"
	"os"
	"testing"

	"kelo-backend/pkg/config"

	"github.com/stretchr/testify/assert"
	"github.com/supabase-community/supabase-go"
)

func setupTestEnv(t *testing.T) {
	t.Helper()
	os.Setenv("SUPABASE_URL", "https://dummy.supabase.co")
	os.Setenv("SUPABASE_SERVICE_ROLE_KEY", "dummy")
	os.Setenv("SUPABASE_JWT_SECRET", "dummy")
}

func TestZKService_GenerateZKInputs(t *testing.T) {
	setupTestEnv(t)
	cfg, err := config.Load()
	assert.NoError(t, err)

	supabaseClient, err := supabase.NewClient(cfg.SupabaseURL, cfg.SupabaseServiceRoleKey, nil)
	assert.NoError(t, err)

	zkService, err := NewZKService(supabaseClient, cfg)
	assert.NoError(t, err)

	inputs, err := zkService.GenerateZKInputs(context.Background(), "test-user")
	assert.NoError(t, err)
	assert.NotNil(t, inputs)
	assert.Equal(t, "test-user", inputs["userId"])
}

func TestZKService_SubmitZKProof(t *testing.T) {
	setupTestEnv(t)
	cfg, err := config.Load()
	assert.NoError(t, err)

	supabaseClient, err := supabase.NewClient(cfg.SupabaseURL, cfg.SupabaseServiceRoleKey, nil)
	assert.NoError(t, err)

	zkService, err := NewZKService(supabaseClient, cfg)
	assert.NoError(t, err)

	dummyProof := []byte("dummy-proof")
	dummyPublicInputs := [][]byte{
		[]byte("dummy-public-input-1"),
		[]byte("dummy-public-input-2"),
	}

	txHash, err := zkService.SubmitZKProof(context.Background(), "test-user", dummyProof, dummyPublicInputs)
	assert.NoError(t, err)
	assert.NotNil(t, txHash)
}
