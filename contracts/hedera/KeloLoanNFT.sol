// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title KeloLoanNFT
 * @dev A smart contract for minting loan agreements as NFTs on Hedera Token Service (HTS)
 * This contract represents loan agreements as unique NFTs with metadata stored on-chain
 * 
 * Features:
 * - Mint loan agreements as NFTs with unique metadata
 * - Track loan status (pending, approved, active, repaid, defaulted)
 * - Store loan terms (amount, duration, interest rate, merchant)
 * - Implement reentrancy protection for security
 * - Pausable functionality for emergency stops
 * - DID-based identity verification integration
 */
contract KeloLoanNFT is ERC721, ERC721URIStorage, Ownable, Pausable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // Enum for loan status
    enum LoanStatus {
        Pending,    // Loan application submitted, awaiting approval
        Approved,   // Loan approved, awaiting disbursement
        Active,     // Loan disbursed, repayment ongoing
        Repaid,     // Loan fully repaid
        Defaulted   // Loan defaulted
    }
    
    // Struct for loan metadata
    struct LoanMetadata {
        uint256 tokenId;
        address borrower;
        address merchant;
        uint256 principalAmount;
        uint256 interestRate; // Annual interest rate in basis points (e.g., 1000 = 10%)
        uint256 duration; // Loan duration in days
        uint256 createdAt;
        uint256 dueDate;
        uint256 repaidAmount;
        LoanStatus status;
        string did; // Decentralized Identifier for borrower
        string merchantDID; // Decentralized Identifier for merchant
    }
    
    // Mapping from token ID to loan metadata
    mapping(uint256 => LoanMetadata) public loanMetadata;
    
    // Mapping from borrower DID to their loan tokens
    mapping(string => uint256[]) public borrowerLoans;
    
    // Mapping from merchant DID to their loan tokens
    mapping(string => uint256[]) public merchantLoans;
    
    // Events
    event LoanCreated(
        uint256 indexed tokenId,
        address indexed borrower,
        address indexed merchant,
        uint256 principalAmount,
        uint256 interestRate,
        uint256 duration,
        string did,
        string merchantDID
    );
    
    event LoanStatusUpdated(
        uint256 indexed tokenId,
        LoanStatus newStatus,
        address updatedBy
    );
    
    event RepaymentMade(
        uint256 indexed tokenId,
        uint256 amount,
        uint256 totalRepaid,
        address payer
    );
    
    event LoanDisbursed(
        uint256 indexed tokenId,
        uint256 amount,
        address merchant
    );
    
    /**
     * @dev Constructor
     * @param name_ The name of the NFT collection
     * @param symbol_ The symbol of the NFT collection
     */
    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}
    
    /**
     * @dev Creates a new loan agreement as an NFT
     * @param borrower The address of the borrower
     * @param merchant The address of the merchant
     * @param principalAmount The principal loan amount
     * @param interestRate Annual interest rate in basis points
     * @param duration Loan duration in days
     * @param did Borrower's Decentralized Identifier
     * @param merchantDID Merchant's Decentralized Identifier
     * @param tokenURI The URI for the token metadata
     * @return tokenId The ID of the newly created loan NFT
     */
    function createLoan(
        address borrower,
        address merchant,
        uint256 principalAmount,
        uint256 interestRate,
        uint256 duration,
        string calldata did,
        string calldata merchantDID,
        string calldata tokenURI
    ) external onlyOwner whenNotPaused nonReentrant returns (uint256) {
        require(borrower != address(0), "Invalid borrower address");
        require(merchant != address(0), "Invalid merchant address");
        require(principalAmount > 0, "Principal amount must be greater than 0");
        require(interestRate > 0, "Interest rate must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(bytes(did).length > 0, "Borrower DID cannot be empty");
        require(bytes(merchantDID).length > 0, "Merchant DID cannot be empty");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        // Mint the NFT to the borrower
        _safeMint(borrower, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Calculate due date
        uint256 dueDate = block.timestamp + (duration * 24 hours);
        
        // Store loan metadata
        loanMetadata[tokenId] = LoanMetadata({
            tokenId: tokenId,
            borrower: borrower,
            merchant: merchant,
            principalAmount: principalAmount,
            interestRate: interestRate,
            duration: duration,
            createdAt: block.timestamp,
            dueDate: dueDate,
            repaidAmount: 0,
            status: LoanStatus.Pending,
            did: did,
            merchantDID: merchantDID
        });
        
        // Add to borrower and merchant loan lists
        borrowerLoans[did].push(tokenId);
        merchantLoans[merchantDID].push(tokenId);
        
        emit LoanCreated(
            tokenId,
            borrower,
            merchant,
            principalAmount,
            interestRate,
            duration,
            did,
            merchantDID
        );
        
        return tokenId;
    }
    
    /**
     * @dev Updates the status of a loan
     * @param tokenId The ID of the loan NFT
     * @param newStatus The new status of the loan
     */
    function updateLoanStatus(uint256 tokenId, LoanStatus newStatus) external onlyOwner whenNotPaused {
        require(_exists(tokenId), "Token does not exist");
        require(loanMetadata[tokenId].status != newStatus, "Status already set");
        
        loanMetadata[tokenId].status = newStatus;
        
        emit LoanStatusUpdated(tokenId, newStatus, msg.sender);
    }
    
    /**
     * @dev Records a repayment for a loan
     * @param tokenId The ID of the loan NFT
     * @param amount The amount being repaid
     */
    function makeRepayment(uint256 tokenId, uint256 amount) external onlyOwner whenNotPaused nonReentrant {
        require(_exists(tokenId), "Token does not exist");
        require(loanMetadata[tokenId].status == LoanStatus.Active, "Loan is not active");
        require(amount > 0, "Repayment amount must be greater than 0");
        
        LoanMetadata storage loan = loanMetadata[tokenId];
        loan.repaidAmount += amount;
        
        // Check if loan is fully repaid
        uint256 totalDue = calculateTotalDue(tokenId);
        if (loan.repaidAmount >= totalDue) {
            loan.status = LoanStatus.Repaid;
        }
        
        emit RepaymentMade(tokenId, amount, loan.repaidAmount, msg.sender);
    }
    
    /**
     * @dev Records loan disbursement to merchant
     * @param tokenId The ID of the loan NFT
     */
    function disburseLoan(uint256 tokenId) external onlyOwner whenNotPaused nonReentrant {
        require(_exists(tokenId), "Token does not exist");
        require(loanMetadata[tokenId].status == LoanStatus.Approved, "Loan is not approved");
        
        LoanMetadata storage loan = loanMetadata[tokenId];
        loan.status = LoanStatus.Active;
        
        emit LoanDisbursed(tokenId, loan.principalAmount, loan.merchant);
    }
    
    /**
     * @dev Calculates the total amount due for a loan (principal + interest)
     * @param tokenId The ID of the loan NFT
     * @return The total amount due
     */
    function calculateTotalDue(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "Token does not exist");
        
        LoanMetadata storage loan = loanMetadata[tokenId];
        uint256 interestAmount = (loan.principalAmount * loan.interestRate * loan.duration) / (36500 * 100); // basis points to percentage
        
        return loan.principalAmount + interestAmount;
    }
    
    /**
     * @dev Gets loan metadata for a specific token
     * @param tokenId The ID of the loan NFT
     * @return The loan metadata
     */
    function getLoanMetadata(uint256 tokenId) external view returns (LoanMetadata memory) {
        require(_exists(tokenId), "Token does not exist");
        return loanMetadata[tokenId];
    }
    
    /**
     * @dev Gets all loans for a borrower
     * @param did The borrower's DID
     * @return Array of loan token IDs
     */
    function getBorrowerLoans(string calldata did) external view returns (uint256[] memory) {
        return borrowerLoans[did];
    }
    
    /**
     * @dev Gets all loans for a merchant
     * @param merchantDID The merchant's DID
     * @return Array of loan token IDs
     */
    function getMerchantLoans(string calldata merchantDID) external view returns (uint256[] memory) {
        return merchantLoans[merchantDID];
    }
    
    /**
     * @dev Pauses all contract operations
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpauses all contract operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Burns a loan NFT (only for defaulted or repaid loans)
     * @param tokenId The ID of the loan NFT to burn
     */
    function burnLoan(uint256 tokenId) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        require(
            loanMetadata[tokenId].status == LoanStatus.Repaid || 
            loanMetadata[tokenId].status == LoanStatus.Defaulted,
            "Loan must be repaid or defaulted to burn"
        );
        
        _burn(tokenId);
    }
    
    // The following functions are overrides required by Solidity
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}