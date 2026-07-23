/* 存档码：版本头 / 版本门控 / 加密码 / 旧码兼容 单测 */
const fs = require('fs'), vm = require('vm');
const ctx = {
    window: { addEventListener() {} },
    crypto: require('crypto').webcrypto,   // vm 沙箱内需显式注入（globalThis.crypto 在沙箱不可见）
    btoa: s => Buffer.from(s, 'binary').toString('base64'),
    atob: s => Buffer.from(s, 'base64').toString('binary'),
    console, JSON, Math, Date, isFinite, encodeURIComponent, decodeURIComponent,
    unescape, escape, setTimeout, TextEncoder, TextDecoder, process
};
vm.createContext(ctx);
const test = `
(async () => {
  let pass = 0, fail = 0;
  const ok = (n, c) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n); } };
  const p = { name:'测试道友', realmIdx:5, realmLayer:3, zhanli:12345.5, stats:{totalZhanli:999,combatWins:2}, pets:[{id:'p_fire',lv:2}], settings:{autoSave:true} };

  // 明文导出带版本头
  const code = await SaveSystem.exportSave(p, null);
  ok('明文码带 XIUXIAN:v1:P: 前缀', code.startsWith('XIUXIAN:v1:P:'));
  let parsed = SaveSystem.parseCode(code);
  ok('parseCode → plaintext', parsed.status === 'plaintext');
  let res = await SaveSystem.importSave(code);
  ok('明文导入成功', res.ok && res.player && res.player.name === '测试道友');

  // 加密码导出
  const enc = await SaveSystem.exportSave(p, 'mypw');
  ok('加密码带 XIUXIAN:v1:E: 前缀', enc.startsWith('XIUXIAN:v1:E:'));
  parsed = SaveSystem.parseCode(enc);
  ok('parseCode → encrypted', parsed.status === 'encrypted');
  let r1 = await SaveSystem.importSave(enc);
  ok('加密码无密码 → needPassword', r1.ok === false && r1.needPassword === true);
  let r2 = await SaveSystem.importSave(enc, 'wrong');
  ok('错误密码 → BAD_PASSWORD', r2.ok === false && r2.error === 'BAD_PASSWORD');
  let r3 = await SaveSystem.importSave(enc, 'mypw');
  ok('正确密码 → 成功', r3.ok && r3.player && r3.player.name === '测试道友');

  // 版本门控
  const oldVer = GameConfig.saveVersion;
  GameConfig.saveVersion = 'v9';
  const r4 = await SaveSystem.importSave(code);
  ok('跨版本明文码 → VERSION 拒绝', r4.ok === false && r4.error === 'VERSION');
  GameConfig.saveVersion = oldVer;

  // 旧版 XIUXIAN1: 兼容
  const legacy = 'XIUXIAN1:' + btoa(unescape(encodeURIComponent(JSON.stringify(p))));
  const r5 = await SaveSystem.importSave(legacy);
  ok('旧版 XIUXIAN1: 码兼容导入', r5.ok && r5.player && r5.player.name === '测试道友');

  // 非法码拒绝
  const r6 = await SaveSystem.importSave('这是一段乱码不是base64@@@');
  ok('非法码 → INVALID', r6.ok === false && r6.error === 'INVALID');

  console.log('\\nSaveCode: ' + pass + ' 通过, ' + fail + ' 失败');
  if (fail) process.exit(1);
})();
`;
vm.runInContext(
    fs.readFileSync('config.js', 'utf8') + '\n' +
    fs.readFileSync('auth.js', 'utf8') + '\n' +
    fs.readFileSync('save.js', 'utf8') + '\n' + test,
    ctx, { filename: 'bundle.js' }
);
