// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {LotteryToken} from "./LotteryToken.sol";

/// @title A very simple lottery contract
/// @author Matheus Pagani
/// @notice You can use this contract for running a very simple lottery
/// @dev This contract implements a relatively weak randomness source, since there is no cliff period between the randao reveal and the actual usage in this contract
/// @custom:teaching This is a contract meant for teaching only
contract Lottery is Ownable {
    /// @notice Address of the token used as payment for the bets
    LotteryToken public paymentToken;
    /// @notice Amount of tokens given per ETH paid
    uint256 public purchaseRatio;
    /// @notice Amount of tokens required for placing a bet that goes for the prize pool
    uint256 public betPrice;
    /// @notice Amount of tokens required for placing a bet that goes for the owner pool
    uint256 public betFee;
    /// @notice Amount of tokens in the prize pool
    uint256 public prizePool;
    /// @notice Amount of tokens in the owner pool
    uint256 public ownerPool;
    uint256 public totalTickets;
    
    /// @notice Flag indicating whether the lottery is open for bets or not
    bool public betsOpen;
    /// @notice Timestamp of the lottery next closing date and time
    uint256 public betsClosingTime;
    /// @notice Mapping of prize available for withdraw for each account
    mapping(address => uint256) public prize;

    /// For the powerball implementation
    uint256[6] public numbersDrawn;
    mapping(address => uint256[6][]) public tickets;
    
    uint8 public constant TICKET_PRICE_NUMBER = 2;
    uint8 public constant MAX_NUMBER = 69;
    uint8 public constant MAX_SUPER_NUMBER = 26;

    /// @dev List of bet slots
    address[] _slots;

    /// @notice Constructor function
    /// @param tokenName Name of the token used for payment
    /// @param tokenSymbol Symbol of the token used for payment
    /// @param _purchaseRatio Amount of tokens given per ETH paid
    /// @param _betPrice Amount of tokens required for placing a bet that goes for the prize pool
    /// @param _betFee Amount of tokens required for placing a bet that goes for the owner pool
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 _purchaseRatio,
        uint256 _betPrice,
        uint256 _betFee
    ) Ownable(msg.sender) {
        paymentToken = new LotteryToken(tokenName, tokenSymbol);
        purchaseRatio = _purchaseRatio;
        betPrice = _betPrice;
        betFee = _betFee;
    }

    /// @notice Passes when the lottery is at closed state
    modifier whenBetsClosed() {
        require(!betsOpen, "Lottery is open");
        _;
    }

    /// @notice Passes when the lottery is at open state and the current block timestamp is lower than the lottery closing date
    modifier whenBetsOpen() {
        require(
            //betsOpen && block.timestamp < betsClosingTime,
            betsOpen,
            "Lottery is closed"
        );
        _;
    }


    /// @notice Opens the lottery for receiving bets
    function openBets(uint256 closingTime) external onlyOwner whenBetsClosed {
        //require(
        //    closingTime > block.timestamp,
        //    "Closing time must be in the future"
        //);
        //betsClosingTime += closingTime*60;
        betsOpen = true;
    }

    /// @notice Gives tokens based on the amount of ETH sent
    /// @dev This implementation is prone to rounding problems
    function purchaseTokens() external payable {
        paymentToken.mint(msg.sender, msg.value * purchaseRatio);
    }

    /// @notice Charges the bet price and creates a new bet slot with the sender's address
    function bet(uint256[6] calldata numbers) public whenBetsOpen {
        // sanity check
        //for(uint8 ticket = 0; ticket < numbers.length;ticket++){
        //    for(uint8 number = 0; number < 5; number++){
        //        require(numbers[ticket][number] > 0 && numbers[ticket][number] < MAX_NUMBER );
        //    require(numbers[ticket][5] > 0 && numbers[ticket][number] < MAX_SUPER_NUMBER );

        //    }
        tickets[msg.sender].push(numbers);
        totalTickets++;

        //}
        ownerPool += betFee;
        prizePool += betPrice;
        //_slots.push(msg.sender);
        paymentToken.transferFrom(msg.sender, address(this), betPrice + betFee);
    }


    function who() public view returns (uint256 nTickets){
        nTickets = totalTickets;
    }

    /// @notice Calls the bet function `times` times
    /*
    function betMany(uint256 times) external {
        require(times > 0);
        while (times > 0) {
            bet();
            times--;
        }
    }
    */

    /// @notice Closes the lottery and calculates the prize, if any
    /// @dev Anyone can call this function at any time after the closing time
    function closeLottery() external {
        //require(block.timestamp >= betsClosingTime, "Too soon to close");
        require(betsOpen, "Already closed");
        numbersDrawn[0] = getRandomNumber(block.prevrandao) % MAX_NUMBER;
        for(uint8 i = 1;i<6;i++){
            numbersDrawn[i] = getRandomNumber(numbersDrawn[i-1]) % MAX_NUMBER;
        }
        numbersDrawn[5] = getRandomNumber(numbersDrawn[4]) % MAX_SUPER_NUMBER;
        
        totalTickets = 0;
        /*
        if (_slots.length > 0) {
            uint256 winnerIndex = getRandomNumber() % _slots.length;
            address winner = _slots[winnerIndex];
            prize[winner] += prizePool;
            prizePool = 0;
            delete (_slots);
        }
        */
        betsOpen = false;
    }

    function getNumbers() public view returns (uint256[6] memory digits){
        digits = numbersDrawn;
    }

    function checkPrize() public returns(uint256 winning){
        uint256 matches = 0;
        for(uint iTicket = 0;iTicket<tickets[msg.sender].length;iTicket++){
            for(uint i = 0; i < 6;i++) {
                for(uint j = 0; j<6;j++){
                    if(tickets[msg.sender][iTicket][i] == numbersDrawn[j]){
                        matches++;
                    }
                }
            }
        }
        delete (tickets[msg.sender]);
        winning = matches;
    }

    /// @notice Returns a random number calculated from the previous block randao
    /// @dev This only works after The Merge
    function getRandomNumber(uint256 randNo) public view returns (uint256 randomNumber) {
        //randomNumber = block.prevrandao(block.number);
        randomNumber = uint256(keccak256(abi.encodePacked (msg.sender, block.timestamp, randNo)));
    }

    /// @notice Withdraws `amount` from that accounts's prize pool
    function prizeWithdraw(uint256 amount) external {
        require(amount <= prize[msg.sender], "Not enough prize");
        prize[msg.sender] -= amount;
        paymentToken.transfer(msg.sender, amount);
    }

    /// @notice Withdraws `amount` from the owner's pool
    function ownerWithdraw(uint256 amount) external onlyOwner {
        require(amount <= ownerPool, "Not enough fees collected");
        ownerPool -= amount;
        paymentToken.transfer(msg.sender, amount);
    }

    /// @notice Burns `amount` tokens and give the equivalent ETH back to user
    function returnTokens(uint256 amount) external {
        paymentToken.burnFrom(msg.sender, amount);
        payable(msg.sender).transfer(amount / purchaseRatio);
    }
}
