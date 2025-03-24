// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.20;

// import "forge-std/Test.sol";
// import "../contracts/InternToken.sol";

// contract InternTokenTest is Test {
//     InternToken private token;
//     address private owner;
//     address private recipient;
//     address private treasury;

//     function setUp() public {
//         owner = address(this);
//         recipient = address(0x1);
//         treasury = address(0x2);
//         token = new InternToken(recipient, owner);
//         token.setTreasuryWallet(treasury);
//     }

//     function testInitialSupply() public {
//         assertEq(token.balanceOf(recipient), 500000 * 10 ** 18);
//     }

//     function testPauseAndUnpause() public {
//         token.pause();
//         assertTrue(token.paused());

//         token.unpause();
//         assertFalse(token.paused());
//     }

//     function testMint() public {
//         uint256 mintAmount = 1000 * 10 ** 18;
//         token.mint(recipient, mintAmount);
//         assertEq(token.balanceOf(recipient), 501000 * 10 ** 18);
//     }

//     function testMintExceedsMaxSupply() public {
//         uint256 mintAmount = 600000 * 10 ** 18;
//         vm.expectRevert("InternToken: mint amount exceeds total supply");
//         token.mint(recipient, mintAmount);
//     }

//     function testUpdateTransfer() public {
//         uint256 transferAmount = 1000 * 10 ** 18;
//         token.transfer(address(this), transferAmount);
//         token._update(address(this), recipient, transferAmount);

//         uint256 taxAmount = (transferAmount * 2) / 100;
//         uint256 burnAmount = (transferAmount * 1) / 100;
//         uint256 sendAmount = transferAmount - taxAmount - burnAmount;

//         assertEq(token.balanceOf(recipient), 500000 * 10 ** 18 + sendAmount);
//         assertEq(token.balanceOf(treasury), taxAmount);
//         assertEq(token.totalSupply(), 1000000 * 10 ** 18 - burnAmount);
//     }

//     function testUpdateTransferPaused() public {
//         token.pause();
//         vm.expectRevert("InternToken: Transfers are paused");
//         token._update(address(this), recipient, 1000 * 10 ** 18);
//     }

//     function testUpdateTransferZeroAddress() public {
//         vm.expectRevert("InternToken: transfer to the zero address");
//         token._update(address(this), address(0), 1000 * 10 ** 18);
//     }

//     function testUpdateTransferInsufficientBalance() public {
//         vm.expectRevert("InternToken: transfer amount exceeds balance");
//         token._update(address(0x3), recipient, 1000 * 10 ** 18);
//     }
// }