// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract MakNFT is ERC721, VRFConsumerBaseV2Plus, ERC721URIStorage {
    enum Rarity {
        Common,
        Rare,
        Legendary
    }

    event NFTRequested(uint indexed requestId, address indexed requester);
    event NFTMinted(uint indexed tokenId, address indexed minter, string uri);

    uint256 private _nextTokenId;

    string public baseURI;
    uint public constant MAX_NFT_SUPPLY = 100;

    // 1 MSC - Mak StableCoin - 1 USD
    uint public constant NFT_PRICE = 1e18;

    bytes32 public constant VRF_GAS_LINE = 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;
    uint32 public constant VRF_GAS_LIMIT = 500000;

    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_RANDOM_WORDS = 1;

    address public i_mscAddress;
    uint256 private immutable i_vrfSubId;
    
    mapping(uint256 => address) private requestIdToAddress;

    constructor(
        address vrfCoordinator,
        uint256 vrfSubId,
        address mscAddress,
        string memory _baseURI
    ) 
    ERC721("MakNFT", "MNFT") 
    VRFConsumerBaseV2Plus(vrfCoordinator)
    {
        i_vrfSubId = vrfSubId;
        i_mscAddress = mscAddress;
        baseURI = _baseURI;
    }

    function requestNFT() external returns (uint256 requestId) {
        require(_nextTokenId < MAX_NFT_SUPPLY, "MakNFT: Max supply reached");
        require(
            IERC20(i_mscAddress).balanceOf(msg.sender) >= NFT_PRICE,
            "MakNFT: Insufficient MSC balance"
        );
        require(
            IERC20(i_mscAddress).allowance(msg.sender, address(this)) >= NFT_PRICE,
            "MakNFT: Insufficient MSC allowance"
        );

        uint256 requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: VRF_GAS_LINE,
                subId: i_vrfSubId,
                requestConfirmations: REQUEST_CONFIRMATIONS,
                callbackGasLimit: VRF_GAS_LIMIT,
                numWords: NUM_RANDOM_WORDS,
                extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: false}))
            })
        );

        requestIdToAddress[requestId] = msg.sender;

        IERC20(i_mscAddress).transferFrom(msg.sender, address(this), NFT_PRICE);

        emit NFTRequested(requestId, msg.sender);
        return requestId;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        uint randomNumber = (randomWords[0] % 100) + 1;
        uint256 tokenId = _nextTokenId++;

        _safeMint(requestIdToAddress[requestId], tokenId);

        Rarity rarity = getRarity(randomNumber);

        // There is only 3 images and json metadata's to them. Each with different rarity
        string memory rarityString = Strings.toString(uint256(rarity));
        string memory uri = string(abi.encodePacked(baseURI, "/", rarityString, ".json"));
        _setTokenURI(tokenId, uri);

        emit NFTMinted(tokenId, requestIdToAddress[requestId], uri);
    }

    function getRarity(uint randomNumber) public pure returns (Rarity) {
        if (randomNumber <= 10) return Rarity.Legendary;
        if (randomNumber <= 30) return Rarity.Rare;
        return Rarity.Common;
    }

    function getTotalSupply() public view returns (uint) {
        return _nextTokenId;
    }

    // The following functions are overrides required by Solidity.

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
