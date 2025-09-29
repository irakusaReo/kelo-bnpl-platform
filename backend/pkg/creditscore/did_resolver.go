package creditscore

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"kelo-backend/pkg/blockchain"

	"github.com/rs/zerolog/log"
)

// DIDDocument represents a DID document structure
type DIDDocument struct {
	Context          []string                 `json:"@context"`
	ID               string                  `json:"id"`
	AlsoKnownAs      []string                `json:"alsoKnownAs"`
	VerificationMethod []VerificationMethod  `json:"verificationMethod"`
	Authentication   []string                `json:"authentication"`
	AssertionMethod  []string                `json:"assertionMethod"`
	Service          []DIDService           `json:"service"`
	Created          time.Time               `json:"created"`
	Updated          time.Time               `json:"updated"`
}

// VerificationMethod represents a verification method in DID document
type VerificationMethod struct {
	ID                 string   `json:"id"`
	Type               string   `json:"type"`
	Controller         string   `json:"controller"`
	PublicKeyMultibase string   `json:"publicKeyMultibase"`
	BlockchainAccount  string   `json:"blockchainAccountId,omitempty"`
}

// DIDService represents a service endpoint in DID document
type DIDService struct {
	ID           string            `json:"id"`
	Type         string            `json:"type"`
	ServiceEndpoint string         `json:"serviceEndpoint"`
	Properties   map[string]interface{} `json:"properties,omitempty"`
}

// DIDProfile represents a user's DID profile data
type DIDProfile struct {
	DID             string                 `json:"did"`
	Name            string                 `json:"name"`
	Email           string                 `json:"email"`
	Phone           string                 `json:"phone"`
	Address         string                 `json:"address"`
	DateOfBirth     string                 `json:"dateOfBirth"`
	NationalID      string                 `json:"nationalId"`
	KRAPIN          string                 `json:"kraPin"`
	Employment      EmploymentInfo         `json:"employment"`
	Financial       FinancialInfo          `json:"financial"`
	Identity        IdentityInfo           `json:"identity"`
	Verification    VerificationInfo       `json:"verification"`
	CreatedAt       time.Time              `json:"createdAt"`
	UpdatedAt       time.Time              `json:"updatedAt"`
}

// EmploymentInfo represents employment information in DID profile
type EmploymentInfo struct {
	Employer        string    `json:"employer"`
	Position        string    `json:"position"`
	Department      string    `json:"department"`
	EmployeeID      string    `json:"employeeId"`
	StartDate       time.Time `json:"startDate"`
	Salary          float64   `json:"salary"`
	EmploymentType  string    `json:"employmentType"` // full-time, part-time, contract
	Status          string    `json:"status"`        // active, terminated, resigned
}

// FinancialInfo represents financial information in DID profile
type FinancialInfo struct {
	MonthlyIncome   float64            `json:"monthlyIncome"`
	AnnualIncome    float64            `json:"annualIncome"`
	BankAccounts    []BankAccount      `json:"bankAccounts"`
	MobileMoney     []MobileMoneyAccount `json:"mobileMoney"`
	Assets          []Asset            `json:"assets"`
	Liabilities     []Liability        `json:"liabilities"`
	CreditHistory   CreditHistory      `json:"creditHistory"`
}

// BankAccount represents bank account information
type BankAccount struct {
	BankName        string `json:"bankName"`
	AccountNumber   string `json:"accountNumber"`
	AccountType     string `json:"accountType"` // savings, current, fixed
	AccountName     string `json:"accountName"`
	IsPrimary       bool   `json:"isPrimary"`
}

// MobileMoneyAccount represents mobile money account information
type MobileMoneyAccount struct {
	Provider        string `json:"provider"` // mpesa, airtel, tkash
	PhoneNumber     string `json:"phoneNumber"`
	AccountName     string `json:"accountName"`
	IsPrimary       bool   `json:"isPrimary"`
}

// Asset represents user assets
type Asset struct {
	Type            string  `json:"type"` // real_estate, vehicle, investments, other
	Description     string  `json:"description"`
	Value           float64 `json:"value"`
	AcquisitionDate string  `json:"acquisitionDate"`
}

// Liability represents user liabilities
type Liability struct {
	Type            string  `json:"type"` // loan, mortgage, credit_card, other
	Description     string  `json:"description"`
	Amount          float64 `json:"amount"`
	InterestRate    float64 `json:"interestRate"`
	Term            string  `json:"term"`
	Status          string  `json:"status"` // active, paid, defaulted
}

// CreditHistory represents credit history information
type CreditHistory struct {
	CRBScore        int      `json:"crbScore"`
	CRBStatus       string   `json:"crbStatus"`
	PreviousLoans   []Loan   `json:"previousLoans"`
	PaymentHistory  string   `json:"paymentHistory"`
	LastUpdated     string   `json:"lastUpdated"`
}

// Loan represents loan information in credit history
type Loan struct {
	Lender          string    `json:"lender"`
	Amount          float64   `json:"amount"`
	DisbursementDate time.Time `json:"disbursementDate"`
	DueDate         time.Time `json:"dueDate"`
	Status          string    `json:"status"`
	PaymentHistory  string    `json:"paymentHistory"`
}

// IdentityInfo represents identity verification information
type IdentityInfo struct {
	Verified        bool      `json:"verified"`
	VerificationMethod string   `json:"verificationMethod"`
	VerificationDate time.Time `json:"verificationDate"`
	ExpiryDate      time.Time `json:"expiryDate"`
	DocumentType    string    `json:"documentType"` // national_id, passport, drivers_license
	DocumentNumber  string    `json:"documentNumber"`
	IssuingAuthority string   `json:"issuingAuthority"`
}

// VerificationInfo represents DID verification status
type VerificationInfo struct {
	IsVerified      bool      `json:"isVerified"`
	VerifiedBy      string    `json:"verifiedBy"`
	VerificationDate time.Time `json:"verificationDate"`
	VerificationLevel string   `json:"verificationLevel"` // basic, enhanced, premium
	TrustScore      float64   `json:"trustScore"`
	Badges          []string  `json:"badges"`
}

// VerifyDID verifies a DID on the Hedera blockchain
func (d *DIDResolver) VerifyDID(ctx context.Context, did string) (bool, error) {
	if did == "" {
		return false, fmt.Errorf("DID cannot be empty")
	}

	// Parse DID to extract the method and identifier
	// Example: did:hedera:testnet:0.0.1234567
	method, identifier, err := parseDID(did)
	if err != nil {
		return false, fmt.Errorf("failed to parse DID: %w", err)
	}

	if method != "hedera" {
		return false, fmt.Errorf("unsupported DID method: %s", method)
	}

	// Verify DID on Hedera blockchain
	isValid, err := d.verifyOnHedera(ctx, identifier)
	if err != nil {
		return false, fmt.Errorf("failed to verify DID on Hedera: %w", err)
	}

	return isValid, nil
}

// ResolveDID resolves a DID to retrieve the DID document
func (d *DIDResolver) ResolveDID(ctx context.Context, did string) (*DIDDocument, error) {
	if did == "" {
		return nil, fmt.Errorf("DID cannot be empty")
	}

	// Parse DID to extract the method and identifier
	method, identifier, err := parseDID(did)
	if err != nil {
		return nil, fmt.Errorf("failed to parse DID: %w", err)
	}

	if method != "hedera" {
		return nil, fmt.Errorf("unsupported DID method: %s", method)
	}

	// Resolve DID document from Hedera
	document, err := d.resolveFromHedera(ctx, identifier)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve DID document: %w", err)
	}

	return document, nil
}

// GetDIDProfile retrieves the user's profile data from DID
func (d *DIDResolver) GetDIDProfile(ctx context.Context, did string) (*DIDProfile, error) {
	if did == "" {
		return nil, fmt.Errorf("DID cannot be empty")
	}

	// Resolve DID document first
	document, err := d.ResolveDID(ctx, did)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve DID document: %w", err)
	}

	// Extract profile data from DID document services
	profile, err := d.extractProfileFromDocument(document)
	if err != nil {
		return nil, fmt.Errorf("failed to extract profile from DID document: %w", err)
	}

	return profile, nil
}

// CreateDID creates a new DID on Hedera blockchain
func (d *DIDResolver) CreateDID(ctx context.Context, profile *DIDProfile) (string, error) {
	if profile == nil {
		return "", fmt.Errorf("profile cannot be nil")
	}

	// Generate DID document from profile
	document, err := d.generateDIDDocument(profile)
	if err != nil {
		return "", fmt.Errorf("failed to generate DID document: %w", err)
	}

	// Create DID on Hedera blockchain
	did, err := d.createOnHedera(ctx, document)
	if err != nil {
		return "", fmt.Errorf("failed to create DID on Hedera: %w", err)
	}

	return did, nil
}

// UpdateDIDProfile updates the user's profile data in DID
func (d *DIDResolver) UpdateDIDProfile(ctx context.Context, did string, profile *DIDProfile) error {
	if did == "" || profile == nil {
		return fmt.Errorf("DID and profile cannot be empty")
	}

	// Verify DID exists and is valid
	isValid, err := d.VerifyDID(ctx, did)
	if err != nil {
		return fmt.Errorf("failed to verify DID: %w", err)
	}

	if !isValid {
		return fmt.Errorf("DID is not valid")
	}

	// Generate updated DID document
	document, err := d.generateDIDDocument(profile)
	if err != nil {
		return fmt.Errorf("failed to generate DID document: %w", err)
	}

	// Update DID on Hedera blockchain
	err = d.updateOnHedera(ctx, did, document)
	if err != nil {
		return fmt.Errorf("failed to update DID on Hedera: %w", err)
	}

	return nil
}

// parseDID parses a DID string to extract method and identifier
func parseDID(did string) (method, identifier string, err error) {
	// Basic DID parsing: did:method:identifier
	if len(did) < 4 || did[:4] != "did:" {
		return "", "", fmt.Errorf("invalid DID format")
	}

	parts := splitDID(did[4:]) // Remove "did:" prefix
	if len(parts) < 2 {
		return "", "", fmt.Errorf("invalid DID format")
	}

	method = parts[0]
	identifier = parts[1]

	return method, identifier, nil
}

// splitDID splits the DID string into parts
func splitDID(did string) []string {
	var parts []string
	start := 0
	
	for i, char := range did {
		if char == ':' {
			parts = append(parts, did[start:i])
			start = i + 1
		}
	}
	
	if start < len(did) {
		parts = append(parts, did[start:])
	}
	
	return parts
}

// verifyOnHedera verifies DID on Hedera blockchain
func (d *DIDResolver) verifyOnHedera(ctx context.Context, identifier string) (bool, error) {
	// In a real implementation, you would:
	// 1. Query the Hedera DID registry smart contract
	// 2. Check if the DID exists and is active
	// 3. Verify the DID document is valid
	
	// For now, simulate verification
	// Extract account ID from identifier (format: 0.0.1234567)
	if len(identifier) < 5 || identifier[:4] != "0.0." {
		return false, fmt.Errorf("invalid Hedera DID identifier format")
	}
	
	// Simulate blockchain query
	// In real implementation, use Hedera SDK to query the DID registry
	hederaClient := d.blockchain.GetHederaClient()
	if hederaClient == nil {
		return false, fmt.Errorf("Hedera client not available")
	}
	
	// Simulate successful verification
	log.Info().Str("identifier", identifier).Msg("Verifying DID on Hedera")
	
	// Return true for simulation
	return true, nil
}

// resolveFromHedera resolves DID document from Hedera
func (d *DIDResolver) resolveFromHedera(ctx context.Context, identifier string) (*DIDDocument, error) {
	// In a real implementation, you would:
	// 1. Query the Hedera DID registry smart contract
	// 2. Retrieve the DID document
	// 3. Parse and validate the document
	
	// For now, simulate resolving a DID document
	document := &DIDDocument{
		Context: []string{"https://w3id.org/did/v1"},
		ID:      fmt.Sprintf("did:hedera:%s", identifier),
		AlsoKnownAs: []string{
			fmt.Sprintf("hedera:%s", identifier),
		},
		VerificationMethod: []VerificationMethod{
			{
				ID:                fmt.Sprintf("did:hedera:%s#key-1", identifier),
				Type:              "Ed25519VerificationKey2020",
				Controller:        fmt.Sprintf("did:hedera:%s", identifier),
				PublicKeyMultibase: "z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
				BlockchainAccount:  fmt.Sprintf("hedera:%s", identifier),
			},
		},
		Authentication: []string{
			fmt.Sprintf("did:hedera:%s#key-1", identifier),
		},
		AssertionMethod: []string{
			fmt.Sprintf("did:hedera:%s#key-1", identifier),
		},
		Service: []DIDService{
			{
				ID:             fmt.Sprintf("did:hedera:%s#profile", identifier),
				Type:           "DIDCommMessaging",
				ServiceEndpoint: "https://didcomm.kelo.co.ke",
				Properties: map[string]interface{}{
					"routingKeys": []string{
						fmt.Sprintf("did:hedera:%s#key-1", identifier),
					},
					"accept": []string{"didcomm/v2", "didcomm/aip2;env=rfc587"},
				},
			},
		},
		Created: time.Now().Add(-30 * 24 * time.Hour), // Created 30 days ago
		Updated: time.Now(),
	}
	
	return document, nil
}

// extractProfileFromDocument extracts profile data from DID document
func (d *DIDResolver) extractProfileFromDocument(document *DIDDocument) (*DIDProfile, error) {
	// In a real implementation, you would:
	// 1. Look for profile data in the DID document services
	// 2. Parse and validate the profile data
	// 3. Return structured profile information
	
	// For now, simulate extracting profile data
	profile := &DIDProfile{
		DID:       document.ID,
		Name:      "John Doe",
		Email:     "john.doe@example.com",
		Phone:     "+254712345678",
		Address:   "Nairobi, Kenya",
		CreatedAt: document.Created,
		UpdatedAt: document.Updated,
		Employment: EmploymentInfo{
			Employer:       "Example Company Ltd",
			Position:       "Software Engineer",
			Department:     "IT",
			EmployeeID:     "EMP001",
			StartDate:      time.Now().Add(-2 * 365 * 24 * time.Hour),
			Salary:         150000.0, // KES
			EmploymentType: "full-time",
			Status:         "active",
		},
		Financial: FinancialInfo{
			MonthlyIncome: 150000.0,
			AnnualIncome:  1800000.0,
			BankAccounts: []BankAccount{
				{
					BankName:      "Equity Bank",
					AccountNumber: "003012345678",
					AccountType:   "current",
					AccountName:   "John Doe",
					IsPrimary:     true,
				},
			},
			MobileMoney: []MobileMoneyAccount{
				{
					Provider:    "mpesa",
					PhoneNumber: "+254712345678",
					AccountName: "John Doe",
					IsPrimary:   true,
				},
			},
			CreditHistory: CreditHistory{
				CRBScore:       720,
				CRBStatus:      "Good",
				PaymentHistory: "Excellent",
				LastUpdated:    time.Now().Format("2006-01-02"),
			},
		},
		Identity: IdentityInfo{
			Verified:          true,
			VerificationMethod: "biometric",
			VerificationDate:  time.Now().Add(-30 * 24 * time.Hour),
			ExpiryDate:        time.Now().Add(365 * 24 * time.Hour),
			DocumentType:      "national_id",
			DocumentNumber:    "12345678",
			IssuingAuthority:  "Kenya National Bureau of Statistics",
		},
		Verification: VerificationInfo{
			IsVerified:        true,
			VerifiedBy:        "Kelo Verification Service",
			VerificationDate:  time.Now().Add(-30 * 24 * time.Hour),
			VerificationLevel: "enhanced",
			TrustScore:        85.0,
			Badges:           []string{"identity_verified", "employment_verified", "bank_verified"},
		},
	}
	
	return profile, nil
}

// generateDIDDocument generates DID document from profile
func (d *DIDResolver) generateDIDDocument(profile *DIDProfile) (*DIDDocument, error) {
	// In a real implementation, you would:
	// 1. Create a DID document from the profile data
	// 2. Include appropriate verification methods
	// 3. Add service endpoints for profile data
	
	document := &DIDDocument{
		Context: []string{"https://w3id.org/did/v1"},
		ID:      profile.DID,
		AlsoKnownAs: []string{
			profile.Email,
			profile.Phone,
		},
		Created: time.Now(),
		Updated: time.Now(),
	}
	
	// Add verification methods based on profile
	if profile.Identity.Verified {
		document.VerificationMethod = append(document.VerificationMethod, VerificationMethod{
			ID:                fmt.Sprintf("%s#key-1", profile.DID),
			Type:              "Ed25519VerificationKey2020",
			Controller:        profile.DID,
			PublicKeyMultibase: "z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
		})
	}
	
	// Add service endpoints
	document.Service = append(document.Service, DIDService{
		ID:             fmt.Sprintf("%s#profile", profile.DID),
		Type:           "DIDLinkedDomains",
		ServiceEndpoint: "https://profile.kelo.co.ke",
		Properties: map[string]interface{}{
			"profile": profile,
		},
	})
	
	return document, nil
}

// createOnHedera creates DID on Hedera blockchain
func (d *DIDResolver) createOnHedera(ctx context.Context, document *DIDDocument) (string, error) {
	// In a real implementation, you would:
	// 1. Create a transaction to register the DID
	// 2. Submit the DID document to the Hedera DID registry
	// 3. Return the created DID
	
	// For now, simulate DID creation
	hederaClient := d.blockchain.GetHederaClient()
	if hederaClient == nil {
		return "", fmt.Errorf("Hedera client not available")
	}
	
	// Simulate creating DID
	log.Info().Str("did", document.ID).Msg("Creating DID on Hedera")
	
	// Generate a random account ID for simulation
	accountID := fmt.Sprintf("0.0.%d", time.Now().UnixNano()%10000000)
	did := fmt.Sprintf("did:hedera:%s", accountID)
	
	return did, nil
}

// updateOnHedera updates DID on Hedera blockchain
func (d *DIDResolver) updateOnHedera(ctx context.Context, did string, document *DIDDocument) error {
	// In a real implementation, you would:
	// 1. Create a transaction to update the DID
	// 2. Submit the updated DID document to the Hedera DID registry
	// 3. Confirm the update was successful
	
	hederaClient := d.blockchain.GetHederaClient()
	if hederaClient == nil {
		return fmt.Errorf("Hedera client not available")
	}
	
	// Simulate updating DID
	log.Info().Str("did", did).Msg("Updating DID on Hedera")
	
	return nil
}

// GetTrustScore calculates trust score based on DID verification
func (d *DIDResolver) GetTrustScore(ctx context.Context, did string) (float64, error) {
	profile, err := d.GetDIDProfile(ctx, did)
	if err != nil {
		return 0.0, fmt.Errorf("failed to get DID profile: %w", err)
	}
	
	return profile.Verification.TrustScore, nil
}

// GetVerificationLevel returns the verification level of a DID
func (d *DIDResolver) GetVerificationLevel(ctx context.Context, did string) (string, error) {
	profile, err := d.GetDIDProfile(ctx, did)
	if err != nil {
		return "", fmt.Errorf("failed to get DID profile: %w", err)
	}
	
	return profile.Verification.VerificationLevel, nil
}

// IsIdentityVerified checks if the identity is verified
func (d *DIDResolver) IsIdentityVerified(ctx context.Context, did string) (bool, error) {
	profile, err := d.GetDIDProfile(ctx, did)
	if err != nil {
		return false, fmt.Errorf("failed to get DID profile: %w", err)
	}
	
	return profile.Identity.Verified, nil
}

// GetEmploymentInfo retrieves employment information from DID
func (d *DIDResolver) GetEmploymentInfo(ctx context.Context, did string) (*EmploymentInfo, error) {
	profile, err := d.GetDIDProfile(ctx, did)
	if err != nil {
		return nil, fmt.Errorf("failed to get DID profile: %w", err)
	}
	
	return &profile.Employment, nil
}

// GetFinancialInfo retrieves financial information from DID
func (d *DIDResolver) GetFinancialInfo(ctx context.Context, did string) (*FinancialInfo, error) {
	profile, err := d.GetDIDProfile(ctx, did)
	if err != nil {
		return nil, fmt.Errorf("failed to get DID profile: %w", err)
	}
	
	return &profile.Financial, nil
}

// ValidateDIDFormat validates the format of a DID string
func ValidateDIDFormat(did string) bool {
	if len(did) < 4 || did[:4] != "did:" {
		return false
	}
	
	parts := splitDID(did[4:])
	if len(parts) < 2 {
		return false
	}
	
	method := parts[0]
	identifier := parts[1]
	
	// Validate method
	if method == "" {
		return false
	}
	
	// Validate identifier
	if identifier == "" {
		return false
	}
	
	// Hedera-specific validation
	if method == "hedera" {
		if len(identifier) < 5 || identifier[:4] != "0.0." {
			return false
		}
	}
	
	return true
}

// SerializeDIDDocument serializes DID document to JSON
func SerializeDIDDocument(document *DIDDocument) (string, error) {
	data, err := json.MarshalIndent(document, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to serialize DID document: %w", err)
	}
	return string(data), nil
}

// DeserializeDIDDocument deserializes DID document from JSON
func DeserializeDIDDocument(jsonData string) (*DIDDocument, error) {
	var document DIDDocument
	err := json.Unmarshal([]byte(jsonData), &document)
	if err != nil {
		return nil, fmt.Errorf("failed to deserialize DID document: %w", err)
	}
	return &document, nil
}