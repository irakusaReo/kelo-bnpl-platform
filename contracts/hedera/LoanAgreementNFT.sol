// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Updated interface for the Hedera Token Service precompiled contract
interface IHederaTokenService {
    function mintToken(address token, uint64 amount, bytes[] memory metadata) external returns (int64 responseCode, uint64[] memory serialNumbers);
}

contract LoanAgreementNFT is ERC721, Ownable {
    // Address of the HTS precompiled contract on the Hedera network
    address constant HTS_PRECOMPILE_ADDRESS = 0x167;

    // The address of the HTS NFT this contract manages
    address public htsTokenAddress;

    struct LoanMetadata {
        uint256 loanAmount;
        uint256 interestRate;
        uint256 repaymentDeadline;
        string status;
    }

    // Mapping from the NFT's serial number (tokenId) to its loan metadata
    mapping(uint256 => LoanMetadata) public loanAgreements;

    event LoanAgreementCreated(
        uint256 indexed tokenId,
        uint256 loanAmount,
        uint256 interestRate,
        uint256 repaymentDeadline
    );

    /**
     * @param _htsTokenAddress The address of the HTS NFT created via the Hedera SDK/API.
     */
    constructor(address _htsTokenAddress) ERC721("Kelo Loan Agreement", "KLA") {
        htsTokenAddress = _htsTokenAddress;
    }

    /**
     * @notice Mints a new Loan Agreement NFT associated with an HTS token.
     * @param to The address to mint the NFT to.
     * @param loanAmount The principal amount of the loan.
     * @param interestRate The interest rate of the loan (e.g., in basis points).
     * @param repaymentDeadline The timestamp by which the loan must be repaid.
     * @param metadata The metadata for the NFT, to be stored on-chain by HTS.
     */
    function mint(
        address to,
        uint256 loanAmount,
        uint256 interestRate,
        uint256 repaymentDeadline,
        bytes calldata metadata
    ) public onlyOwner returns (uint256) {
        // Prepare the metadata for the HTS mint call. HTS expects an array of metadata.
        bytes[] memory metadataArray = new bytes[](1);
        metadataArray[0] = metadata;

        // Call the HTS precompiled contract to mint the NFT.
        // For NFTs (non-fungible), the amount is 0. The number of NFTs minted is metadataArray.length.
        (int64 responseCode, uint64[] memory serialNumbers) = IHederaTokenService(HTS_PRECOMPILE_ADDRESS).mintToken(
            htsTokenAddress,
            0,
            metadataArray
        );

        // A responseCode of 22 indicates success in the Hedera network.
        require(responseCode == 22, "HTS_MINT_FAILED");
        require(serialNumbers.length == 1, "INVALID_SERIAL_NUMBERS_RETURNED");

        uint256 newSerialNumber = serialNumbers[0];

        // Use the HTS serial number as the ERC721 tokenId for compatibility
        _safeMint(to, newSerialNumber);

        // Store the loan metadata associated with the new serial number
        LoanMetadata memory newLoan = LoanMetadata({
            loanAmount: loanAmount,
            interestRate: interestRate,
            repaymentDeadline: repaymentDeadline,
            status: "Active"
        });
        loanAgreements[newSerialNumber] = newLoan;

        emit LoanAgreementCreated(newSerialNumber, loanAmount, interestRate, repaymentDeadline);

        return newSerialNumber;
    }

    function updateLoanStatus(uint256 tokenId, string calldata newStatus) public onlyOwner {
        require(_exists(tokenId), "Loan agreement not found");
        loanAgreements[tokenId].status = newStatus;
    }

    function getLoanAgreement(uint256 tokenId) public view returns (LoanMetadata memory) {
        require(_exists(tokenId), "Loan agreement not found");
        return loanAgreements[tokenId];
    }
}
