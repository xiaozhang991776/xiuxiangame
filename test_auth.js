/* 加解密基元单测（字符串信封接口，仅用于存档码加密码） */
const { Auth } = require('./auth.js');

let pass = 0, fail = 0;
function ok(name, cond) {
    if (cond) { pass++; console.log('  ✓ ' + name); }
    else { fail++; console.log('  ✗ ' + name); }
}

(async () => {
    console.log('== Auth（Web Crypto 字符串加解密）==');
    ok('Web Crypto 可用', Auth.available());

    const env = await Auth.encryptToString('hello 修仙 12345', 'pw1');
    ok('信封为 3 段 (salt.iv.ct)', env.split('.').length === 3);
    ok('密文不泄露明文', !env.includes('hello'));

    const back = await Auth.decryptFromString(env, 'pw1');
    ok('往返一致（含中文/数字）', back === 'hello 修仙 12345');

    const e2 = await Auth.encryptToString('', 'pw');
    ok('空串可加解密', (await Auth.decryptFromString(e2, 'pw')) === '');

    const big = 'x'.repeat(5000) + '中文测试';
    const eb = await Auth.encryptToString(big, 'pw2');
    ok('大内容往返', (await Auth.decryptFromString(eb, 'pw2')) === big);

    let threw = false;
    try { await Auth.decryptFromString(env, 'wrong'); }
    catch (e) { threw = (e.code === 'BAD_PASSWORD'); }
    ok('错误密码被拒 (BAD_PASSWORD)', threw);

    const parts = env.split('.');
    const tampered = parts[0] + '.' + parts[1] + '.' + parts[2].slice(0, -2) + 'AA';
    let tamperedThrew = false;
    try { await Auth.decryptFromString(tampered, 'pw1'); }
    catch (e) { tamperedThrew = (e.code === 'BAD_PASSWORD'); }
    ok('密文被篡改检测', tamperedThrew);

    const a = await Auth.encryptToString('same', 'aaa');
    const b = await Auth.encryptToString('same', 'bbb');
    ok('不同密码→不同信封', a !== b);
    const c = await Auth.encryptToString('same', 'aaa');
    ok('同输入两次信封不同（随机 IV）', a !== c);

    console.log(`\nAuth: ${pass} 通过, ${fail} 失败`);
    process.exit(fail ? 1 : 0);
})();
