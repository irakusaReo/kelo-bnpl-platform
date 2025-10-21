package relayer

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"kelo-backend/pkg/config"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/rs/zerolog/log"
)

// LayerZeroClient handles LayerZero message sending
type LayerZeroClient struct {
	evmClient       *ethclient.Client
	privateKey      *ecdsa.PrivateKey
	endpointAddress string
}

// NewLayerZeroClient creates a new LayerZero client
func NewLayerZeroClient(evmClient *ethclient.Client, privateKey *ecdsa.PrivateKey, cfg *config.Config) (*LayerZeroClient, error) {
	if privateKey == nil {
		return nil, fmt.Errorf("private key is required")
	}
	if cfg.LayerZeroEndpoint == "" {
		return nil, fmt.Errorf("LayerZero endpoint address is not configured")
	}

	return &LayerZeroClient{
		evmClient:       evmClient,
		privateKey:      privateKey,
		endpointAddress: cfg.LayerZeroEndpoint,
	}, nil
}

// SendTransaction sends a transaction to the LayerZero endpoint
func (lzc *LayerZeroClient) SendTransaction(ctx context.Context, destinationChainID uint32, payload []byte) (string, error) {
	// Get the sender's address from the private key
	publicKey := lzc.privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return "", fmt.Errorf("error casting public key to ECDSA")
	}
	fromAddress := crypto.PubkeyToAddress(*publicKeyECDSA)

	// Get the nonce for the sender's account
	nonce, err := lzc.evmClient.PendingNonceAt(ctx, fromAddress)
	if err != nil {
		return "", fmt.Errorf("failed to get nonce: %w", err)
	}

	// Get the suggested gas price
	gasPrice, err := lzc.evmClient.SuggestGasPrice(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get gas price: %w", err)
	}

	// Use the configured LayerZero endpoint address
	lzEndpointAddress := common.HexToAddress(lzc.endpointAddress)

	// ABI encode the call to the 'send' function of the LayerZero endpoint
	// function send(uint16 _dstChainId, bytes calldata _payload, bytes calldata _options)
	// For simplicity, we are not including options.
	contractABI, err := abi.JSON(strings.NewReader(`[{"inputs":[{"name":"_dstChainId","type":"uint16"},{"name":"_payload","type":"bytes"},{"name":"_options","type":"bytes"}],"name":"send","outputs":[],"stateMutability":"payable","type":"function"}]`))
	if err != nil {
		return "", fmt.Errorf("failed to parse contract ABI: %w", err)
	}

	// Pack the arguments for the 'send' function
	// Note: destinationChainID is uint32, but the example ABI uses uint16.
	// This might need adjustment based on the actual LayerZero contract version.
	packedData, err := contractABI.Pack("send", uint16(destinationChainID), payload, []byte{})
	if err != nil {
		return "", fmt.Errorf("failed to pack data for 'send' function: %w", err)
	}

	// Create the raw transaction
	tx := types.NewTransaction(nonce, lzEndpointAddress, big.NewInt(0), 200000, gasPrice, packedData)

	// Sign the transaction
	chainID, err := lzc.evmClient.NetworkID(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to get network ID: %w", err)
	}
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), lzc.privateKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign transaction: %w", err)
	}

	// Send the transaction
	err = lzc.evmClient.SendTransaction(ctx, signedTx)
	if err != nil {
		return "", fmt.Errorf("failed to send transaction: %w", err)
	}

	log.Info().
		Str("tx_hash", signedTx.Hash().Hex()).
		Uint32("destination_chain_id", destinationChainID).
		Msg("Successfully sent LayerZero transaction")

	return signedTx.Hash().Hex(), nil
}
