console.log('test start');
import { test2 } from './test2.js';

function test() {
    console.log('test1');
    test2();
}

test();