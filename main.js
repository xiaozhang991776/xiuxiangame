/* ============================================
   仙途·轮回诀 — 主入口
   加载流程 · 角色创建 · 事件绑定 · 启动
   ============================================ */

(function() {
    'use strict';

    /* ---------- 角色创建状态 ---------- */
    const ccState = {
        name: '',
        avatar: 0,
        element: 'metal'
    };
    let pendingSlotId = 1; // 待创建的存档槽
    let ccBound = false;   // 角色创建事件是否已绑定（防重复）
    let overlayBound = false; // 全局遮罩(弹窗/打赏)点击监听是否已绑定（防 enterGame 重复叠加）
    // 文本转义（防止存档名破坏 HTML）
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    /* ---------- 初始化 ---------- */
    function init() {
        // 加载提示轮换
        const tips = [
            '凝神聚气，开启仙途...',
            '道法自然，清静无为...',
            '气沉丹田，意守玄关...',
            '紫气东来，万象更新...',
            '太上忘情，大道至简...'
        ];
        let tipIdx = 0;
        const tipEl = document.getElementById('loadingTip');
        const tipTimer = setInterval(() => {
            tipIdx = (tipIdx + 1) % tips.length;
            if (tipEl) tipEl.textContent = tips[tipIdx];
        }, 800);

        // 加载完成
        setTimeout(() => {
            clearInterval(tipTimer);
            const loading = document.getElementById('loading-screen');
            loading.style.opacity = '0';
            setTimeout(() => {
                loading.style.display = 'none';
                showStartScreen();
            }, 800);
        }, 2200);
    }

    /* ---------- 显示开始界面 ---------- */
    let startBound = false;
    function showStartScreen() {
        const el = document.getElementById('start-screen');
        if (el) el.classList.remove('hidden');
        if (!startBound) {
            const btn = document.getElementById('startGameBtn');
            if (btn) btn.onclick = () => {
                const s = document.getElementById('start-screen');
                if (s) s.classList.add('hidden');
                startGame();
            };
            startBound = true;
        }
    }

    /* ---------- 启动游戏 ---------- */
    function startGame() {
        // 旧版单槽存档迁移（首次运行执行一次）
        if (typeof SaveSystem !== 'undefined' && SaveSystem.migrateOld) SaveSystem.migrateOld();
        // 尝试读取存档
        Game.init();
        if (Game.player) {
            // 有存档，直接进入游戏
            enterGame();
            // 显示离线收益
            if (Game.offlineReward && Game.offlineReward.zhanli > 0) {
                setTimeout(() => UI.showOfflineReward(Game.offlineReward), 500);
            }
        } else {
            // 无存档，显示选择存档界面
            showSaveSelect(false);
        }
    }

    /* ---------- 显示角色创建 ---------- */
    function showCharacterCreate(slotId) {
        if (slotId) pendingSlotId = slotId;
        document.getElementById('character-create').classList.remove('hidden');
        bindCharacterCreate();
        updatePreview();
    }

    /* ---------- 选择存档界面 ---------- */
    function showSaveSelect(returnToGame) {
        const el = document.getElementById('save-select');
        const wrap = document.getElementById('ssSlots');
        const slots = SaveSystem.listSlots();
        const avatars = ['道', '仙', '魔', '佛'];
        wrap.innerHTML = slots.map(s => {
            if (s.meta) {
                const r = getRealm(s.meta.realmIdx);
                const elemName = (GameConfig.elements[s.meta.element] || {}).name || '';
                const av = avatars[s.meta.avatar || 0] || '道';
                return `<div class="ss-slot occupied${s.current ? ' current' : ''}" onclick="window.__chooseSlot(${s.id},true)">
                    <div class="ss-slot-avatar">${av}</div>
                    <div class="ss-slot-info">
                        <div class="ss-slot-name">${esc(s.meta.name)}</div>
                        <div class="ss-slot-sub">${r.name}${cnNum(s.meta.realmLayer)}层 · ${esc(elemName)}</div>
                        <div class="ss-slot-time">${fmtAgo(s.meta.lastSave)}修炼</div>
                    </div>
                    <button class="ss-slot-del" title="删除存档" onclick="event.stopPropagation();window.__deleteSlot(${s.id},'${esc(s.meta.name)}')">×</button>
                </div>`;
            }
            return `<div class="ss-slot empty" onclick="window.__chooseSlot(${s.id},false)">
                <div class="ss-slot-avatar ss-empty-icon">＋</div>
                <div class="ss-slot-info">
                    <div class="ss-slot-name">空位</div>
                    <div class="ss-slot-sub">开辟新的仙缘</div>
                </div>
            </div>`;
        }).join('');
        document.getElementById('ssBackBtn').classList.toggle('hidden', !returnToGame);
        el.classList.remove('hidden');
    }

    /* 选择某槽位：occupied=继续，empty=去角色创建 */
    function chooseSlot(id, occupied) {
        if (occupied) {
            const p = Game.loadSlot(id);
            if (!p) { UI.toast('读取该存档失败', 'bad'); return; }
            const inGame = !document.getElementById('game-main').classList.contains('hidden');
            document.getElementById('save-select').classList.add('hidden');
            if (inGame) {
                UI.renderAll();
                UI.toast('已切换至「' + p.name + '」的道途', 'good');
            } else {
                enterGame();
                if (Game.offlineReward && Game.offlineReward.zhanli > 0) {
                    setTimeout(() => UI.showOfflineReward(Game.offlineReward), 500);
                }
            }
        } else {
            pendingSlotId = id;
            document.getElementById('save-select').classList.add('hidden');
            showCharacterCreate(id);
        }
    }

    /* 删除存档确认 */
    function deleteSlotUI(id, name) {
        UI.showModal({
            title: '删除存档',
            body: `<p style="color:#f43f5e">确定删除「<b>${esc(name)}</b>」的存档吗？</p><p style="margin-top:8px">此操作<b>不可恢复</b>。</p>`,
            footer: [
                { text: '确认删除', type: 'danger', action: () => {
                    // 如果删除的是当前正在游戏的道途，需要清理循环并回到选择界面
                    const deletingCurrent = Game.currentSlotId === id;
                    if (deletingCurrent) {
                        Game.stopAutoSave();
                        Game.stopCultivateLoop();
                        Game.stopLifespanDecay();
                        Game.player = null;
                        Game.currentSlotId = null;
                        document.getElementById('game-main').classList.add('hidden');
                    }
                    SaveSystem.deleteSlot(id);
                    UI.hideModal();
                    showSaveSelect(false);
                    UI.toast('已删除该道途', 'good');
                }},
                { text: '取消', action: () => UI.hideModal() }
            ]
        });
    }

    /* 相对时间（用于存档卡「x天前修炼」） */
    function fmtAgo(ts) {
        if (!ts) return '';
        const s = Math.floor((Date.now() - ts) / 1000);
        if (s < 60) return '刚刚';
        const m = Math.floor(s / 60); if (m < 60) return m + '分钟前';
        const h = Math.floor(m / 60); if (h < 24) return h + '小时前';
        const d = Math.floor(h / 24); if (d < 30) return d + '天前';
        const mo = Math.floor(d / 30); if (mo < 12) return mo + '个月前';
        return Math.floor(mo / 12) + '年前';
    }

    window.__chooseSlot = chooseSlot;
    window.__deleteSlot = deleteSlotUI;

    /* ---------- 绑定角色创建事件 ---------- */
    function bindCharacterCreate() {
        if (ccBound) return; // 仅绑定一次，避免重复监听
        ccBound = true;
        // 名字输入
        const nameInput = document.getElementById('charName');
        nameInput.addEventListener('input', e => {
            ccState.name = e.target.value;
            updatePreview();
        });
        // 随机名字
        document.getElementById('randomNameBtn').onclick = () => {
            const n = randomName();
            ccState.name = n;
            nameInput.value = n;
            updatePreview();
        };
        // 灵根选择
        document.querySelectorAll('.cc-element').forEach(el => {
            el.onclick = () => {
                document.querySelectorAll('.cc-element').forEach(e => e.classList.remove('active'));
                el.classList.add('active');
                ccState.element = el.dataset.element;
                updatePreview();
            };
        });
        // 默认选中金
        document.querySelector('.cc-element[data-element="metal"]').classList.add('active');
        // 法相选择
        document.querySelectorAll('.cc-avatar').forEach(el => {
            el.onclick = () => {
                document.querySelectorAll('.cc-avatar').forEach(e => e.classList.remove('active'));
                el.classList.add('active');
                ccState.avatar = parseInt(el.dataset.avatar);
                updatePreview();
            };
        });
        // 开始游戏（写入所选存档槽）
        document.getElementById('createGameBtn').onclick = () => {
            const name = ccState.name.trim() || '无名修士';
            Game.newGame({ name, avatar: ccState.avatar, element: ccState.element }, pendingSlotId);
            document.getElementById('character-create').classList.add('hidden');
            enterGame();
            UI.toast(`欢迎踏入仙途，${name}！`, 'gold');
            UI.addLog(`你以${name}之名，踏入仙途`, 'evt');
            // 新道途：弹出仙途主线·序章（发奖 + 弹窗）
            if (typeof MainStory !== 'undefined' && Game.player) MainStory.intro(Game.player);
            // 新道途首次进入自动展开新手教程
            if (Game.player && (!Game.player.stats || !Game.player.stats.tutorialDone)) {
                UI.startTutorial();
            }
        };
    }

    /* ---------- 更新预览 ---------- */
    function updatePreview() {
        const avatars = ['道', '仙', '魔', '佛'];
        const elemNames = { metal: '金灵根', wood: '木灵根', water: '水灵根', fire: '火灵根', earth: '土灵根' };
        document.getElementById('previewAvatar').textContent = avatars[ccState.avatar];
        document.getElementById('previewName').textContent = ccState.name.trim() || '无名修士';
        document.getElementById('previewElem').textContent = elemNames[ccState.element];
    }

    /* ---------- 进入游戏 ---------- */
    function enterGame() {
        document.getElementById('game-main').classList.remove('hidden');
        // 同步设置
        const s = Game.player.settings;
        document.getElementById('autoSaveToggle').checked = s.autoSave;
        document.getElementById('animToggle').checked = s.anim;
        document.getElementById('soundToggle').checked = s.sound;
        // 渲染所有
        UI.renderAll();
        // 边界：载入的道途寿元已尽（如死亡弹窗未确认即刷新），直接进入羽化流程
        if ((Game.player.lifespan || 0) <= 0) {
            lifespanZero(Game.player);
            return;
        }
        // 启动循环
        Game.startAutoSave();
        Game.startCultivateLoop();
        Game.startLifespanDecay();
        // 绑定事件
        bindGameEvents();
        // 欢迎日志
        UI.addLog('游戏已加载', 'evt');
        // 存储可用性主动检测（根因提示：file:// 双击打开会导致本地存储被禁用）
        if (typeof SaveSystem !== 'undefined' && SaveSystem.storageMode() === 'none' && !window.__storageWarned) {
            window.__storageWarned = true;
            UI.showModal({
                title: '⚠️ 存档功能不可用',
                body: '<p>当前浏览器<b>禁止了本地存储</b>，最常见原因是：你是用 <code>file://</code> 双击 <code>index.html</code> 打开的。</p>' +
                      '<p style="margin-top:10px">这会导致所有进度<b>无法保存</b>，刷新或关闭后会丢失——也就是「按存档没用」。</p>' +
                      '<p style="margin-top:12px">✅ <b>解决方法（任选其一）</b>：</p>' +
                      '<p style="margin-top:6px">① 用 <code>http://</code> 方式打开：在游戏目录执行 <code>python -m http.server 8080</code>，再访问 <code>http://localhost:8080</code>；</p>' +
                      '<p style="margin-top:6px">② 随时用设置里的「<b>导出存档</b>」把进度码复制保存，需要时「导入存档」恢复。</p>',
                footer: [{ text: '已知晓', action: () => UI.hideModal() }]
            });
        }
    }

    /* 寿元耗尽：羽化归虚，道途尽，重入轮回 */
    function lifespanZero(player) {
        // 停掉循环，避免已故道途仍在修炼
        Game.stopCultivateLoop();
        Game.stopAutoSave();
        Game.stopLifespanDecay();
        UI.showModal({
            title: '寿元已尽',
            body: `<p style="line-height:1.8">${esc(player.name)}道友闭关悟道，终至寿元耗尽，<b style="color:#d4af37">羽化归虚</b>。</p>
                   <p style="margin-top:10px;color:#9a8e7a;font-size:13px">红尘一梦，仙缘已了。此身道途就此归于轮回——可另择仙缘，再踏仙途。</p>`,
            footer: [{
                text: '重入轮回', type: 'primary', action: () => {
                    // 当前道途已尽，清除该槽位
                    if (Game.currentSlotId) SaveSystem.deleteSlot(Game.currentSlotId);
                    Game.player = null;
                    Game.currentSlotId = null;
                    Game.cultivating = true;
                    UI.hideModal();
                    document.getElementById('game-main').classList.add('hidden');
                    showSaveSelect(false);
                }
            }]
        });
    }
    Game.onLifespanZero = lifespanZero;

    /* ---------- 绑定游戏事件 ---------- */
    function bindGameEvents() {
        // 导航切换
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.onclick = () => UI.switchPanel(btn.dataset.panel);
        });

        // 突破按钮
        document.getElementById('breakBtn').onclick = () => Cultivate.breakThrough(Game.player);

        // 修炼切换
        document.getElementById('cultivateToggle').onclick = () => Cultivate.toggleCultivate();

        // 手动修炼（点击聚气）
        document.getElementById('cultivateTap').onclick = () => Cultivate.manualCultivate(Game.player);

        // 闭关潜修
        document.getElementById('seclusionBtn').onclick = () => UI.openSeclusion();

        // 游历天下
        document.getElementById('youliBtn').onclick = () => UI.openYouli();

        // 兑换灵石（拿战力换灵石）
        document.getElementById('exchangeBtn').onclick = () => UI.openExchange();

        // 悟性·顿悟
        document.getElementById('enlightenBtn').onclick = () => UI.openEnlighten();

        // 存档（统一反馈：成功 / 临时存储 / 浏览器禁止存储）
        function doSave() {
            const ok = Game.save();
            const st = (typeof SaveSystem !== 'undefined') ? SaveSystem.lastSaveStatus : null;
            if (ok && st && st.mode === 'local') {
                UI.toast('存档成功', 'good');
            } else if (ok) {
                UI.toast('已临时保存到会话（关闭标签页前有效），建议用 http:// 打开本游戏以永久保存', 'warn');
            } else {
                UI.toast('存档失败：浏览器禁止本地存储（多为用 file:// 双击打开所致）。请用 http:// 方式打开，或用「导出存档」备份进度', 'bad');
            }
        }
        document.getElementById('saveBtn').onclick = () => doSave();

        // 设置按钮
        document.getElementById('settingsBtn').onclick = () => {
            document.getElementById('settings-screen').classList.remove('hidden');
        };

        // 新手教程（随时可看）
        document.getElementById('tutorialBtn').onclick = () => UI.startTutorial();
        document.getElementById('tutorialNext').onclick = () => UI.tutorialNext();
        document.getElementById('tutorialPrev').onclick = () => UI.tutorialPrev();
        document.getElementById('tutorialSkip').onclick = () => UI.endTutorial();

        // 背包分类切换
        document.querySelectorAll('.inv-tab').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.inv-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                UI.invCategory = tab.dataset.tab;
                UI.selectedInvItem = null;
                document.getElementById('invDetail').innerHTML = '<p class="inv-detail-empty">选中物品查看详情</p>';
                UI.renderInventory();
            };
        });

        // 商店分类切换
        document.querySelectorAll('.shop-tab').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                UI.shopTab = tab.dataset.tab;
                UI.renderShop();
            };
        });

        // 坊市购买搜索 + 分类过滤
        const shopSearch = document.getElementById('shopSearch');
        if (shopSearch) {
            shopSearch.oninput = e => {
                UI.shopFilter = e.target.value.trim();
                UI.renderShop();
            };
        }
        document.querySelectorAll('.shop-category').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.shop-category').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                UI.shopCategory = btn.dataset.cat;
                UI.renderShop();
            };
        });

        // 战斗逃遁
        document.getElementById('battleFlee').onclick = () => Combat.flee();
        // 普通攻击（回合制基础行动）
        document.getElementById('battleAttack').onclick = () => Combat.useSkill('s_basic_strike');

        // 弹窗关闭
        document.getElementById('modalClose').onclick = () => UI.hideModal();
        if (!overlayBound) {
            overlayBound = true;
            document.getElementById('modal-overlay').addEventListener('click', e => {
                if (e.target.id === 'modal-overlay') UI.hideModal();
            });
        }

        // 设置面板
        document.getElementById('settingsClose').onclick = () => {
            document.getElementById('settings-screen').classList.add('hidden');
        };
        // 打赏弹窗
        document.getElementById('rewardFab').onclick = () => {
            document.getElementById('reward-screen').classList.remove('hidden');
        };
        document.getElementById('rewardClose').onclick = () => {
            document.getElementById('reward-screen').classList.add('hidden');
        };
        if (!window.__rewardBound) {
            window.__rewardBound = true;
            document.getElementById('reward-screen').addEventListener('click', e => {
                if (e.target.id === 'reward-screen') document.getElementById('reward-screen').classList.add('hidden');
            });
        }
        // 选择存档（入道飞升 / 切换道途）
        document.getElementById('slotSelectBtn').onclick = () => {
            Game.save();
            document.getElementById('settings-screen').classList.add('hidden');
            showSaveSelect(true);
        };
        // 选择存档界面「返回游戏」
        document.getElementById('ssBackBtn').onclick = () => {
            document.getElementById('save-select').classList.add('hidden');
        };
        document.getElementById('autoSaveToggle').onchange = e => {
            Game.player.settings.autoSave = e.target.checked;
            Game.save();
        };
        document.getElementById('animToggle').onchange = e => {
            Game.player.settings.anim = e.target.checked;
            Game.save();
        };
        document.getElementById('soundToggle').onchange = e => {
            Game.player.settings.sound = e.target.checked;
            Game.save();
        };
        document.getElementById('manualSaveBtn').onclick = () => doSave('手动存档');
        document.getElementById('exportBtn').onclick = () => {
            const data = SaveSystem.exportSave(Game.player);
            UI.showModal({
                title: '导出存档',
                body: `<p>复制以下存档码保存：</p>
                       <textarea style="width:100%;height:120px;margin-top:10px;background:rgba(0,0,0,0.4);border:1px solid #c9a96a;border-radius:6px;color:#e8e0d0;padding:8px;font-size:11px" readonly onclick="this.select()">${data}</textarea>`,
                footer: [{ text: '关闭', action: () => UI.hideModal() }]
            });
        };
        document.getElementById('importBtn').onclick = () => {
            UI.showModal({
                title: '导入存档',
                body: `<p>粘贴存档码：</p>
                       <textarea id="importCode" style="width:100%;height:120px;margin-top:10px;background:rgba(0,0,0,0.4);border:1px solid #c9a96a;border-radius:6px;color:#e8e0d0;padding:8px;font-size:11px"></textarea>`,
                footer: [
                    { text: '导入', type: 'primary', action: () => {
                        const code = document.getElementById('importCode').value.trim();
                        if (!code) { UI.toast('请输入存档码', 'bad'); return; }
                        const player = SaveSystem.importSave(code);
                        if (player) {
                            Game.player = player;
                            Game.save();
                            UI.hideModal();
                            UI.renderAll();
                            UI.toast('导入成功', 'good');
                        } else {
                            UI.toast('存档码无效', 'bad');
                        }
                    }},
                    { text: '取消', action: () => UI.hideModal() }
                ]
            });
        };
        document.getElementById('resetBtn').onclick = () => {
            UI.showModal({
                title: '⚠️ 重置游戏',
                body: '<p style="color:#f43f5e">此操作将<strong>永久删除</strong>你的所有游戏进度！</p><p style="margin-top:10px">确定要重置吗？</p>',
                footer: [
                    { text: '确认重置', type: 'danger', action: () => {
                        Game.reset();
                        UI.hideModal();
                        document.getElementById('settings-screen').classList.add('hidden');
                        document.getElementById('game-main').classList.add('hidden');
                        // 重置角色创建状态
                        ccState.name = '';
                        ccState.avatar = 0;
                        ccState.element = 'metal';
                        document.getElementById('charName').value = '';
                        document.querySelectorAll('.cc-element').forEach(e => e.classList.remove('active'));
                        document.querySelector('.cc-element[data-element="metal"]').classList.add('active');
                        document.querySelectorAll('.cc-avatar').forEach(e => e.classList.remove('active'));
                        document.querySelector('.cc-avatar[data-avatar="0"]').classList.add('active');
                        showSaveSelect(false);
                        UI.toast('游戏已重置', 'good');
                    }},
                    { text: '取消', action: () => UI.hideModal() }
                ]
            });
        };

        // 键盘快捷键
        document.addEventListener('keydown', e => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            // 弹窗/事件/战斗界面打开时不响应面板快捷键
            const blocked = !document.getElementById('modal-overlay').classList.contains('hidden')
                || !document.getElementById('event-screen').classList.contains('hidden')
                || !document.getElementById('battle-screen').classList.contains('hidden')
                || !document.getElementById('settings-screen').classList.contains('hidden')
                || !document.getElementById('reward-screen').classList.contains('hidden');
            if (blocked) return;
            const keyMap = { '1': 'cultivate', '2': 'combat', '3': 'explore', '4': 'inventory', '5': 'skill', '6': 'shop', '7': 'quest', '8': 'friends', '9': 'reincarnate', '0': 'talent', 'p': 'pet' };
            if (keyMap[e.key]) UI.switchPanel(keyMap[e.key]);
            // 空格键：在修炼面板手动聚气
            if (e.key === ' ' && Game.currentPanel === 'cultivate') {
                e.preventDefault();
                Cultivate.manualCultivate(Game.player);
            }
            // B键突破
            if (e.key.toLowerCase() === 'b') Cultivate.breakThrough(Game.player);
            // S键保存
            if (e.key.toLowerCase() === 's' && !e.ctrlKey) {
                if (Game.save()) UI.toast('存档成功', 'good');
            }
        });
    }

    /* ---------- 启动 ---------- */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
