// SPDX-License-Identifier: MIT

contract MSize {
    uint[] public data;

    function mSize() public pure returns (uint size) {
        assembly {
            size := msize()
        }
    }

    function mStore100() public pure returns (uint size) {
        assembly {
            mstore(100, msize())
            size := msize()
        }
    }
}
