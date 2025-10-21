package bnpl

import (
	"context"
	"kelo-backend/pkg/models"
	"kelo-backend/pkg/blockchain"

	"github.com/stretchr/testify/mock"
	"github.com/supabase-community/supabase-go"
)

// MockSupabaseClient is a mock implementation of the Supabase client.
type MockSupabaseDB struct {
	mock.Mock
}

func (m *MockSupabaseDB) From(table string) *supabase.QueryBuilder {
	// This is tricky to mock directly. We'll mock the final Execute call.
	// For this test, we assume the query builder chain is correct and just mock the result.
	return &supabase.QueryBuilder{} // This will be ignored.
}

// We need to mock the methods that are actually called on the query builder.
// This is a limitation of the Supabase client library's design.
// A better approach would be to have interfaces for the query builder.
// For now, we will have to make some assumptions.

// MockHederaClient is a mock for the Hedera blockchain client.
type MockHederaClient struct {
	mock.Mock
}

func (m *MockHederaClient) UpdateLoanNFTStatus(ctx context.Context, tokenID string, serialNumber int64, newMetadata []byte) error {
	args := m.Called(ctx, tokenID, serialNumber, newMetadata)
	return args.Error(0)
}

// MockBlockchainClients is a mock for the blockchain clients struct.
type MockBlockchainClients struct {
	mock.Mock
	MockHedera *MockHederaClient
}

func (m *MockBlockchainClients) GetHederaClient() *blockchain.HederaClient {
	// This is not ideal, but we need to return a real HederaClient struct
	// because the original code doesn't use an interface. We will mock the
	// methods on the client itself.
	// In a real-world scenario, you would refactor the code to use interfaces.

	// We return a nil here, and the test will need to be adjusted to handle this.
	// A better way is to create a wrapper interface.
	return nil
}
