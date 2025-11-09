pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/bitify.circom";

/**
 * CreditScoreVerifier
 * Proves creditworthiness without revealing sensitive data
 */
template CreditScoreVerifier() {
    // Public inputs
    signal input minimumCreditScore;
    signal input timestamp;

    // Private inputs
    signal input totalBalance;
    signal input transactionCount;
    signal input repaymentScore;
    signal input accountAge;

    // Output
    signal output isValid;

    // Weights
    var BALANCE_WEIGHT = 40;
    var TX_COUNT_WEIGHT = 20;
    var REPAYMENT_WEIGHT = 30;
    var AGE_WEIGHT = 10;

    // Balance scoring
    signal balancePoints;
    component balanceCheck = GreaterEqThan(252);
    balanceCheck.in[0] <== totalBalance;
    balanceCheck.in[1] <== 1000000000000000000; // 1 ETH
    balancePoints <== balanceCheck.out * BALANCE_WEIGHT;

    // Transaction count scoring
    signal txPoints;
    component txCheck = GreaterEqThan(32);
    txCheck.in[0] <== transactionCount;
    txCheck.in[1] <== 50;
    txPoints <== txCheck.out * TX_COUNT_WEIGHT;

    // Repayment scoring
    signal repaymentPoints;
    repaymentPoints <== repaymentScore * REPAYMENT_WEIGHT / 100;

    // Account age scoring
    signal agePoints;
    component ageCheck = GreaterEqThan(16);
    ageCheck.in[0] <== accountAge;
    ageCheck.in[1] <== 365;
    agePoints <== ageCheck.out * AGE_WEIGHT;

    // Total score
    signal totalScore;
    totalScore <== balancePoints + txPoints + repaymentPoints + agePoints;

    // Check threshold
    component scoreCheck = GreaterEqThan(16);
    scoreCheck.in[0] <== totalScore;
    scoreCheck.in[1] <== minimumCreditScore;

    isValid <== scoreCheck.out;

    // Timestamp must not be zero
    component timestampCheck = IsZero();
    timestampCheck.in <== timestamp;
    timestampCheck.out === 0;
}

component main {public [minimumCreditScore, timestamp]} = CreditScoreVerifier();